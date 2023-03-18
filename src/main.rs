use axum::{
    body::{self, Body, Empty, Full},
    extract::{Host, Path},
    handler::HandlerWithoutStateExt,
    http::{header, HeaderValue, Request, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{any, get, get_service},
    Extension, Json, Router,
};
use std::net::SocketAddr;
use std::sync::atomic::{AtomicUsize, Ordering};
use tower::ServiceExt;
use tower_http::services::{ServeDir, ServeFile};

struct State {
    api_requests: AtomicUsize,
    website_requests: AtomicUsize,
}

#[tokio::main]
async fn main() {
    tokio::join!(
        serve(makeavoy_serve(), 3001),
        serve(petrichor_serve(), 3002),
        // serve(using_serve_dir_only_from_root_via_fallback(), 3003),
        // serve(using_serve_dir_with_handler_as_service(), 3004),
        // serve(two_serve_dirs(), 3005),
        // serve(calling_serve_dir_from_a_handler(), 3006),
    );
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

fn using_serve_dir_only_from_root_via_fallback() -> Router {
    // you can also serve the assets directly from the root (not nested under `/assets`)
    // by only setting a `ServeDir` as the fallback
    let serve_dir = ServeDir::new("assets").not_found_service(ServeFile::new("assets/index.html"));

    Router::new()
        .route("/foo", get(|| async { "Hi from /foo" }))
        .fallback_service(serve_dir)
}

fn using_serve_dir_with_handler_as_service() -> Router {
    async fn handle_404() -> (StatusCode, &'static str) {
        (StatusCode::NOT_FOUND, "Not found")
    }

    let serve_dir = ServeDir::new("assets").not_found_service(handle_404.into_service());

    Router::new()
        .route("/foo", get(|| async { "Hi from /foo" }))
        .fallback_service(serve_dir)
}

fn two_serve_dirs() -> Router {
    // you can also have two `ServeDir`s nested at different paths
    let serve_dir_from_assets = ServeDir::new("assets");
    let serve_dir_from_dist = ServeDir::new("dist");

    Router::new()
        .nest_service("/assets", serve_dir_from_assets)
        .nest_service("/dist", serve_dir_from_dist)
}

#[allow(clippy::let_and_return)]
fn calling_serve_dir_from_a_handler() -> Router {
    // via `tower::Service::call`, or more conveniently `tower::ServiceExt::oneshot` you can
    // call `ServeDir` yourself from a handler
    Router::new().nest_service(
        "/foo",
        get(|request: Request<Body>| async {
            let service = ServeDir::new("assets");
            let result = service.oneshot(request).await;
            result
        }),
    )
}

async fn serve(app: Router, port: u16) {
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    // tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
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
