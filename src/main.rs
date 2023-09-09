use axum::{
    body::Body,
    extract::Host,
    http::{Request, Response},
    routing::{any, get, post},
    Json, Router,
};
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
            if lines.len() == 3 {
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
