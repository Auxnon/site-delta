use axum::{
    body::{self, Body, Empty, Full},
    extract::{Host, Path},
    http::{header, HeaderValue, Request, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::{any, get, get_service},
    Extension, Json, Router,
};
use std::net::SocketAddr;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tower::util::ServiceExt;
use tower_http::services::ServeDir;

struct State {
    api_requests: AtomicUsize,
    website_requests: AtomicUsize,
}
use include_dir::{include_dir, Dir};

static STATIC_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/makeavoy-dist");

#[tokio::main]
async fn main() {
    // let api_router = Router::new().route("/*path", any(api_handler));
    let makeavoy_router = using_serve_dir();
    // let makeavoy_router = Router::new().route("/", any(makeavoy_handler));
    let petrichor_router = Router::new().route("/", any(petrichor_handler));
    let state = Arc::new(State {
        website_requests: AtomicUsize::new(0),
        api_requests: AtomicUsize::new(0),
    });
    let app = Router::new()
        .route(
            "/",
            any(|Host(hostname): Host, request: Request<Body>| async move {
                match hostname.as_str() {
                    "petrichor.app" => petrichor_router.oneshot(request).await,
                    _ => makeavoy_router.oneshot(request).await,
                }
            }),
        )
        .layer(Extension(state));
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// async fn api_handler(Extension(state): Extension<Arc<State>>) -> Html<String> {
//     state.api_requests.fetch_add(1, Ordering::SeqCst);
//     Html(format!(
//         "api: {}",
//         state.api_requests.load(Ordering::SeqCst)
//     ))
// }

async fn website_handler(Extension(state): Extension<Arc<State>>) -> Html<String> {
    state.website_requests.fetch_add(1, Ordering::SeqCst);
    println!("something");
    Html(format!(
        "website: {}",
        state.website_requests.load(Ordering::SeqCst)
    ))
}

async fn makeavoy_handler(Extension(state): Extension<Arc<State>>) -> Html<String> {
    state.website_requests.fetch_add(1, Ordering::SeqCst);
    println!("something");
    Html(format!(
        "website: {}",
        state.website_requests.load(Ordering::SeqCst)
    ))
}

async fn petrichor_handler(Extension(state): Extension<Arc<State>>) -> Html<String> {
    state.website_requests.fetch_add(1, Ordering::SeqCst);
    println!("something");
    Html(format!(
        "website: {}",
        state.website_requests.load(Ordering::SeqCst)
    ))
}

fn using_serve_dir() -> Router {
    println!("something");
    // `SpaRouter` is just a convenient wrapper around `ServeDir`
    //
    // You can use `ServeDir` directly to further customize your setup
    let serve_dir = get_service(ServeDir::new("makeavoy-dist")).handle_error(
        |error: std::io::Error| async move {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Unhandled internal error: {}", error),
            )
        },
    );

    Router::new()
        // .nest(path, router)
        .route("/:test", get(static_file_handler))
        // .nest_service("/", serve_dir.clone())
        .fallback_service(serve_dir)
}
async fn static_file_handler(Path(path): Path<String>) -> impl IntoResponse {
    let path = path.trim_start_matches('/');
    let mime_type = mime_guess::from_path(path).first_or_text_plain();

    println!("something {}", path);
    match STATIC_DIR.get_file(path) {
        None => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(body::boxed(Empty::new()))
            .unwrap(),
        Some(file) => Response::builder()
            .status(StatusCode::OK)
            .header(
                header::CONTENT_TYPE,
                HeaderValue::from_str(mime_type.as_ref()).unwrap(),
            )
            .body(body::boxed(Full::from(file.contents())))
            .unwrap(),
    }
}
