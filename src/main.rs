use axum::{
    body::Body,
    extract::{ConnectInfo, Host},
    http::{header, HeaderValue, Request, Response, StatusCode, Uri, Version},
    response::IntoResponse,
    routing::{any, get, post},
    Json, Router,
};
use axum_server::tls_rustls::RustlsConfig;
use hyper::client::HttpConnector;
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
        let client: hyper::Client<HttpConnector> = hyper::Client::new();
        let router = Router::new().fallback_service({
            any(
                |Host(hostname): Host,
                 ConnectInfo(peer): ConnectInfo<SocketAddr>,
                 request: Request<Body>| async move {
                    // the Host header can carry a port
                    match hostname.split(':').next().unwrap_or("") {
                        "petrichor64.app" => petrichor_serve().oneshot(request).await,
                        SOSH_HOST => Ok(sosh_proxy(client, peer, request).await.into_response()),
                        _ => makeavoy_serve().oneshot(request).await,
                    }
                },
            )
        });
        tokio::join!(
            serve(router.clone(), 8080, address, None),
            serve(router, 443, address, pems),
        );
    }
}

// sosh.makeavoy.com: everything goes to the sosh server (Phoenix, in a
// container on this machine; github.com/Auxnon/sosh, deploy/README.md),
// websockets included. SOSH_UPSTREAM overrides where it listens.
const SOSH_HOST: &str = "sosh.makeavoy.com";

fn sosh_upstream() -> String {
    std::env::var("SOSH_UPSTREAM").unwrap_or_else(|_| "127.0.0.1:4000".to_string())
}

async fn sosh_proxy(
    client: hyper::Client<HttpConnector>,
    peer: SocketAddr,
    mut request: Request<Body>,
) -> Response<Body> {
    let path = request
        .uri()
        .path_and_query()
        .map(|p| p.as_str())
        .unwrap_or("/");
    let uri: Uri = match format!("http://{}{}", sosh_upstream(), path).parse() {
        Ok(u) => u,
        Err(_) => return status(StatusCode::BAD_REQUEST),
    };

    // Who's asking, for sosh's rate limits: Cloudflare's word for it when the
    // request came through Cloudflare, else whoever connected. Set, never
    // appended to, so a client can't pick its own.
    let real_ip = request
        .headers()
        .get("cf-connecting-ip")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.trim().parse::<std::net::IpAddr>().ok())
        .unwrap_or(peer.ip())
        .to_string();

    // A websocket: hold on to the client's side of the upgrade, to splice to
    // the server's once it agrees (101).
    let wants_upgrade = request.headers().contains_key(header::UPGRADE);
    let client_side = wants_upgrade.then(|| hyper::upgrade::on(&mut request));

    *request.uri_mut() = uri;
    // the server speaks HTTP/1.1, whatever the client spoke to us
    *request.version_mut() = Version::HTTP_11;
    let headers = request.headers_mut();
    if let Ok(v) = HeaderValue::from_str(&real_ip) {
        headers.insert("x-real-ip", v);
    }
    headers.insert("x-forwarded-proto", HeaderValue::from_static("https"));
    if !headers.contains_key(header::HOST) {
        headers.insert(header::HOST, HeaderValue::from_static(SOSH_HOST));
    }

    let mut response = match client.request(request).await {
        Ok(r) => r,
        Err(e) => {
            println!("sosh upstream: {}", e);
            return status(StatusCode::BAD_GATEWAY);
        }
    };

    if response.status() == StatusCode::SWITCHING_PROTOCOLS {
        if let Some(client_side) = client_side {
            let server_side = hyper::upgrade::on(&mut response);
            tokio::spawn(async move {
                match (client_side.await, server_side.await) {
                    (Ok(mut c), Ok(mut s)) => {
                        let _ = tokio::io::copy_bidirectional(&mut c, &mut s).await;
                    }
                    (c, s) => println!("sosh websocket upgrade failed: {:?} {:?}", c.err(), s.err()),
                }
            });
        }
    }
    response
}

fn status(code: StatusCode) -> Response<Body> {
    let mut r = Response::new(Body::empty());
    *r.status_mut() = code;
    r
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

async fn serve(app: Router, port: u16, address: [u8; 4], pems: Option<(String, String)>) {
    let addr = SocketAddr::from((address, port));

    if let Some((full, private)) = pems {
        if let Ok(config) = RustlsConfig::from_pem_file(full, private).await {
            println!("serving with tls");
            axum_server::bind_rustls(addr, config)
                .serve(app.into_make_service_with_connect_info::<SocketAddr>())
                .await
                .unwrap();
        } else {
            println!("keys missing or invalid, not serving on port{}", port);
        }
    } else {
        println!("serving without tls on localhost:{}", port);
        axum_server::bind(SocketAddr::from((address, port)))
            .serve(app.into_make_service_with_connect_info::<SocketAddr>())
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
