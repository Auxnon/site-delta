use axum::{
    body::Body,
    extract::Host,
    http::{HeaderValue, Request, Response, StatusCode},
    routing::{any, get, post},
    Json, Router,
};
use hyper::{client::HttpConnector, Client, Uri};
use axum_server::tls_rustls::RustlsConfig;
use std::net::SocketAddr;
use tower::ServiceExt;
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
async fn main() {
    let default_address = [127, 0, 0, 1];
    let mut pems = None;
    let address = if let Ok(s) = std::fs::read_to_string("config.txt") {
        let lines: Vec<&str> = s.lines().collect::<Vec<&str>>();
        if lines.len() == 0 {
            default_address
        } else {
            if lines.len() >= 3 {
                pems = Some((lines[1].to_string(), lines[2].to_string()));
            }
            let b: Vec<u8> = lines[0]
                .split(":")
                .collect::<Vec<&str>>()
                .iter()
                .enumerate()
                .map(|(i, s)| s.trim().parse().unwrap_or(default_address[i]))
                .collect();
            b.try_into().unwrap_or_else(|_| default_address)
        }
    } else {
        default_address
    };

    println!(
        "address: {:?} and {}",
        address,
        match &pems {
            Some(p) => format!("searching for pems at {} and {}", p.0, p.1),
            None => "no pems".to_string(),
        }
    );

    #[cfg(feature = "dev")]
    {
        tokio::join!(
            serve(makeavoy_serve(), 8080, d, None),
            serve(petrichor_serve(), 8081, d, None),
        );
    }
    #[cfg(not(feature = "dev"))]
    {
        let router = Router::new().fallback_service({
            any(|Host(hostname): Host, request: Request<Body>| async move {
                println!("hostname: {}", hostname);
                match hostname.as_str() {
                    "petrichor64.app" => petrichor_serve().oneshot(request).await,
                    "share.makeavoy.com" => share_serve().oneshot(request).await,
                    _ => makeavoy_serve().oneshot(request).await,
                }
            })
        });
        tokio::join!(
            serve(router.clone(), 8080, address, None),
            serve(router, 443, address, pems),
        );
    }
}

// Petrichor.app website
fn petrichor_serve() -> Router {
    let serve_dir =
        ServeDir::new("petrichor-dist").not_found_service(ServeFile::new("404/index.html"));
    let templates = ServeDir::new("petrichor-templates");
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .nest_service("/templates", templates)
        .fallback_service(serve_dir)
}

// MakeAvoy.com website
fn makeavoy_serve() -> Router {
    let serve_dir =
        ServeDir::new("makeavoy-dist").not_found_service(ServeFile::new("404/index.html"));

    let assets = ServeDir::new("makeavoy-assets"); // assets served in dedicated folder
    let blog = ServeDir::new("Blog"); // a blog I guess lives here as unorganized markdown and image files
    let archive = ServeDir::new("archive");

    Router::new()
        // .route("/blog", post(blog_handler()))
        .route("/foo", get(|| async { "Hi from /foo" }))
        .route("/health", get(|| async { "ok" }))
        .nest_service("/assets", assets)
        .nest_service("/blog", blog)
        .nest_service("/archive", archive)
        .fallback_service(serve_dir)
}

// share.makeavoy.com — reverse proxy to Node.js on port 3000
fn share_serve() -> Router {
    // Share one Client (and its connection pool) across all proxied requests so
    // the pool isn't dropped while response bodies are still being streamed.
    let client: Client<HttpConnector, Body> = Client::new();
    Router::new().fallback(move |req| {
        let client = client.clone();
        share_proxy_handler(client, req)
    })
}

fn is_hop_by_hop(name: &str) -> bool {
    matches!(
        name,
        "connection"
            | "transfer-encoding"
            | "te"
            | "keep-alive"
            | "trailers"
            | "proxy-authorization"
            | "proxy-connection"
    )
}

async fn share_proxy_handler(
    client: Client<HttpConnector, Body>,
    mut req: Request<Body>,
) -> Response<Body> {
    let method = req.method().clone();
    let path_and_query = req
        .uri()
        .path_and_query()
        .map(|pq| pq.as_str().to_string())
        .unwrap_or_else(|| "/".to_string());

    let backend_uri: Uri = format!("http://127.0.0.1:3000{}", path_and_query)
        .parse()
        .unwrap_or_else(|_| Uri::from_static("http://127.0.0.1:3000/"));

    let is_upgrade = req.headers().get(axum::http::header::UPGRADE).is_some();
    let upgrade_value = req.headers().get(axum::http::header::UPGRADE).cloned();

    // Copy only non-hop-by-hop headers into a fresh header map
    let mut headers = axum::http::HeaderMap::new();
    for (name, value) in req.headers() {
        if name.as_str() != "host" && !is_hop_by_hop(name.as_str()) {
            headers.append(name, value.clone());
        }
    }

    // Forward the original Host so the Node.js app sees the right hostname
    headers.insert(
        axum::http::header::HOST,
        HeaderValue::from_static("share.makeavoy.com"),
    );

    if is_upgrade {
        // --- WebSocket / Upgrade path ---
        let on_upgrade = hyper::upgrade::on(&mut req);

        if let Some(ref uv) = upgrade_value {
            headers.insert(axum::http::header::UPGRADE, uv.clone());
            headers.insert(
                axum::http::header::CONNECTION,
                HeaderValue::from_static("Upgrade"),
            );
        }

        let mut backend_req = match Request::builder()
            .method(method)
            .uri(backend_uri)
            .version(hyper::Version::HTTP_11)
            .body(Body::empty())
        {
            Ok(r) => r,
            Err(e) => {
                eprintln!("share proxy build error: {}", e);
                return Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(Body::empty())
                    .unwrap();
            }
        };
        *backend_req.headers_mut() = headers;

        let backend_resp = match client.request(backend_req).await {
            Ok(resp) => resp,
            Err(e) => {
                eprintln!("share proxy upgrade error: {}", e);
                return Response::builder()
                    .status(StatusCode::BAD_GATEWAY)
                    .body(Body::empty())
                    .unwrap();
            }
        };

        if backend_resp.status() == StatusCode::SWITCHING_PROTOCOLS {
            let mut client_resp_builder =
                Response::builder().status(StatusCode::SWITCHING_PROTOCOLS);
            for (name, value) in backend_resp.headers() {
                client_resp_builder = client_resp_builder.header(name, value);
            }

            let backend_on_upgrade = hyper::upgrade::on(backend_resp);

            tokio::spawn(async move {
                match tokio::try_join!(on_upgrade, backend_on_upgrade) {
                    Ok((mut client_conn, mut backend_conn)) => {
                        if let Err(e) =
                            tokio::io::copy_bidirectional(&mut client_conn, &mut backend_conn)
                                .await
                        {
                            eprintln!("share websocket copy error: {}", e);
                        }
                    }
                    Err(e) => eprintln!("share websocket upgrade error: {}", e),
                }
            });

            client_resp_builder.body(Body::empty()).unwrap()
        } else {
            backend_resp
        }
    } else {
        // --- Normal HTTP proxy path ---
        // Buffer the body so the outgoing request has a known Content-Length,
        // avoiding any HTTP/2-to-HTTP/1.1 streaming-body issues.
        let body_bytes = hyper::body::to_bytes(req.into_body())
            .await
            .unwrap_or_default();

        let mut backend_req = match Request::builder()
            .method(method)
            .uri(backend_uri)
            .version(hyper::Version::HTTP_11)
            .body(Body::from(body_bytes))
        {
            Ok(r) => r,
            Err(e) => {
                eprintln!("share proxy build error: {}", e);
                return Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(Body::empty())
                    .unwrap();
            }
        };
        *backend_req.headers_mut() = headers;

        match client.request(backend_req).await {
            Ok(resp) => resp,
            Err(e) => {
                eprintln!("share proxy error: {}", e);
                Response::builder()
                    .status(StatusCode::BAD_GATEWAY)
                    .body(Body::empty())
                    .unwrap()
            }
        }
    }
}

async fn serve(app: Router, port: u16, address: [u8; 4], pems: Option<(String, String)>) {
    let addr = SocketAddr::from((address, port));

    if let Some((full, private)) = pems {
        if let Ok(config) = RustlsConfig::from_pem_file(full, private).await {
            println!("serving with tls");
            axum_server::bind_rustls(addr, config)
                .serve(app.into_make_service())
                .await
                .unwrap();
        } else {
            println!("keys missing or invalid, not serving on port{}", port);
        }
    } else {
        println!("serving without tls on localhost:{}", port);
        axum_server::bind(SocketAddr::from((address, port)))
            .serve(app.into_make_service())
            .await
            .unwrap();
    }
}

async fn blog_handler() -> impl Fn() -> Response<Json<Vec<String>>> {
    let blog_items = vec![]; //get_blog_items().unwrap_or_else(|_| vec![]);
    let j = Json(blog_items);
    return move || {
        return Response::new(j.clone());
    };
}
// Get first 100 items in sqlite table bloggy ascending by created date
// fn get_blog_items() -> Result<Vec<String>, rusqlite::Error> {
//     let conn = rusqlite::Connection::open("db.sqlite3")?;
//     let mut stmt =
//         conn.prepare("SELECT * FROM bloggy WHERE image = 0 ORDER BY created ASC LIMIT 100")?;
//     stmt.query_map([], |row| match row.get::<String>(0) {
//         Ok(s) => Ok(s),
//         Err(e) => Err(e),
//     })?
//     .filter_map(|s| match s {
//         Ok(s) => {
//             if s.len() > 0 {
//                 Some(s)
//             } else {
//                 None
//             }
//         }
//         Err(e) => None,
//     })
//     .collect::<Vec<String>>()
// }
