use axum::{
    body::Body,
    extract::Host,
    http::Request,
    routing::{any, get},
    Router,
};
use axum_server::tls_rustls::RustlsConfig;
use std::net::SocketAddr;
use tower::ServiceExt;
use tower_http::services::{ServeDir, ServeFile};

// struct State {
//     api_requests: AtomicUsize,
//     website_requests: AtomicUsize,
// }

#[tokio::main]
async fn main() {
    // let router = Router::new()
    //     .route("/", get(main))
    //     .with_state(())
    //     .layer(middleware::from_fn(my_middleware));

    // async fn my_middleware<B>(Host(host): Host, request: Request<B>, next: Next<B>) -> Response {
    //     let lowcase_host = host.to_lowercase();

    //     if lowcase_host == "example.com" || lowcase_host == "www.example.com" {
    //         next.
    //         return next.run(request).await;
    //     }

    //     StatusCode::NOT_FOUND.into_response()
    // }

    let nums = [127, 0, 0, 1];
    let mut pems = None;
    let d = if let Ok(s) = std::fs::read_to_string("config.txt") {
        let lines: Vec<&str> = s.lines().collect::<Vec<&str>>();
        if lines.len() == 0 {
            nums
        } else {
            if lines.len() == 3 {
                pems = Some((lines[1].to_string(), lines[2].to_string()));
            }
            let b: Vec<u8> = lines[0]
                .split(":")
                .collect::<Vec<&str>>()
                .iter()
                .enumerate()
                .map(|(i, s)| s.trim().parse().unwrap_or(nums[i]))
                .collect();
            b.try_into().unwrap_or_else(|_| nums)
        }
    } else {
        nums
    };

    println!(
        "address: {:?} and {}",
        d,
        match &pems {
            Some(p) => format!("searching for pems at {} and {}", p.0, p.1),
            None => "no pems".to_string(),
        }
    );

    // pet feature

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
            serve(router.clone(), 8080, d, None),
            serve(router, 443, d, pems),
        );
    }

    // serve(
    //     Router::new().route("/", {
    //         any(|Host(hostname): Host, request: Request<Body>| async move {
    //             match hostname.as_str() {
    //                 "website.com" => route1().oneshot(request).await,
    //                 _ => route2().oneshot(request).await,
    //             }
    //         });
    //     }),
    //     3001,
    // )
    // .await;
    // .layer(Extension(state));

    // tokio::join!(
    //     serve(makeavoy_serve(), 3001),
    //     serve(petrichor_serve(), 3002),
    //     // serve(using_serve_dir_only_from_root_via_fallback(), 3003),
    //     // serve(using_serve_dir_with_handler_as_service(), 3004),
    //     // serve(two_serve_dirs(), 3005),
    //     // serve(calling_serve_dir_from_a_handler(), 3006),
    // );
}

fn petrichor_serve() -> Router {
    let serve_dir =
        ServeDir::new("petrichor-dist").not_found_service(ServeFile::new("404/index.html"));
    let templates = ServeDir::new("petrichor-templates");
    Router::new()
        .nest_service("/templates", templates)
        .fallback_service(serve_dir)
}

fn makeavoy_serve() -> Router {
    // `ServeDir` allows setting a fallback if an asset is not found
    // so with this `GET /assets/doesnt-exist.jpg` will return `index.html`
    // rather than a 404
    let serve_dir =
        ServeDir::new("makeavoy-dist").not_found_service(ServeFile::new("404/index.html"));

    let assets = ServeDir::new("makeavoy-assets");

    Router::new()
        .route("/foo", get(|| async { "Hi from /foo" }))
        .nest_service("/assets", assets)
        // .nest_service("/", serve_dir.clone())
        .fallback_service(serve_dir)
}

// fn using_serve_dir_only_from_root_via_fallback() -> Router {
//     // you can also serve the assets directly from the root (not nested under `/assets`)
//     // by only setting a `ServeDir` as the fallback
//     let serve_dir = ServeDir::new("assets").not_found_service(ServeFile::new("assets/index.html"));

//     Router::new()
//         .route("/foo", get(|| async { "Hi from /foo" }))
//         .fallback_service(serve_dir)
// }

// fn using_serve_dir_with_handler_as_service() -> Router {
//     async fn handle_404() -> (StatusCode, &'static str) {
//         (StatusCode::NOT_FOUND, "Not found")
//     }

//     let serve_dir = ServeDir::new("assets").not_found_service(handle_404.into_service());

//     Router::new()
//         .route("/foo", get(|| async { "Hi from /foo" }))
//         .fallback_service(serve_dir)
// }

// fn two_serve_dirs() -> Router {
//     // you can also have two `ServeDir`s nested at different paths
//     let serve_dir_from_assets = ServeDir::new("assets");
//     let serve_dir_from_dist = ServeDir::new("dist");

//     Router::new()
//         .nest_service("/assets", serve_dir_from_assets)
//         .nest_service("/dist", serve_dir_from_dist)
// }

// #[allow(clippy::let_and_return)]
// fn calling_serve_dir_from_a_handler() -> Router {
//     // via `tower::Service::call`, or more conveniently `tower::ServiceExt::oneshot` you can
//     // call `ServeDir` yourself from a handler
//     Router::new().nest_service(
//         "/foo",
//         get(|request: Request<Body>| async {
//             let service = ServeDir::new("assets");
//             let result = service.oneshot(request).await;
//             result
//         }),
//     )
// }

async fn serve(app: Router, port: u16, address: [u8; 4], pems: Option<(String, String)>) {
    let addr = SocketAddr::from((address, port));

    if let Some(p) = pems {
        if let Ok(config) = RustlsConfig::from_pem_file(
            // "/home/maker/keys/fullchain.pem",
            // "/home/maker/keys/privkey.pem",
            p.0,
            p.1,
            // "examples/self-signed-certs/cert.pem",
            // "examples/self-signed-certs/key.pem",
        )
        .await
        {
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

// #[tokio::main]
// async fn main() {
//     // let api_router = Router::new().route("/*path", any(api_handler));
//     let makeavoy_router = using_serve_dir();
//     // let makeavoy_router = Router::new().route("/", any(makeavoy_handler));
//     let petrichor_router = Router::new().route("/", any(petrichor_handler));
//     let state = Arc::new(State {
//         website_requests: AtomicUsize::new(0),
//         api_requests: AtomicUsize::new(0),
//     });
//     let app = Router::new()
//         .route(
//             "/",
//             any(|Host(hostname): Host, request: Request<Body>| async move {
//                 match hostname.as_str() {
//                     "petrichor.app" => petrichor_router.oneshot(request).await,
//                     _ => makeavoy_router.oneshot(request).await,
//                 }
//             }),
//         )
//         .layer(Extension(state));
//     let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
//     println!("listening on {}", addr);
//     axum::Server::bind(&addr)
//         .serve(app.into_make_service())
//         .await
//         .unwrap();
// }

// async fn petrichor_handler(Extension(state): Extension<Arc<State>>) -> Html<String> {
//     state.website_requests.fetch_add(1, Ordering::SeqCst);
//     println!("something");
//     Html(format!(
//         "website: {}",
//         state.website_requests.load(Ordering::SeqCst)
//     ))
// }
