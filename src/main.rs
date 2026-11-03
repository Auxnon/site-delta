use axum::{
    body::Body,
    extract::{ConnectInfo, Host, Multipart, Query},
    http::{header, HeaderValue, Request, Response, StatusCode, Version},
    response::{Html, IntoResponse},
    routing::{any, get, post},
    Json, Router,
};
use hyper::{client::HttpConnector, Client, Uri};
use axum_server::tls_rustls::RustlsConfig;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::net::SocketAddr;
use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
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
                        // share.makeavoy.com (share_serve, a Node app on :3000) is off
                        // while nothing runs there; to turn it back on:
                        // "share.makeavoy.com" => share_serve().oneshot(request).await,
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
        .route("/todo", get(todo_page))
        .route("/todo/api/feed", get(todo_get_feed).post(todo_update_feed))
        .route("/todo/api/upload", post(todo_upload))
        .route("/todo/api/uploads", get(todo_list_uploads))
        .route("/todo/api/uploads/delete", post(todo_delete_upload))
        .nest_service("/assets", assets)
        .nest_service("/blog", blog)
        .nest_service("/archive", archive)
        .fallback_service(serve_dir)
}

// --- /todo admin panel: keycode-gated editor for makeavoy-assets/feed.json ---

// The code comes from the TODO_ACCESS_CODE environment variable; without one
// (or with an empty one) every request is refused, so /todo is off.
fn todo_code_ok(given: &str) -> bool {
    static CODE: std::sync::OnceLock<Option<String>> = std::sync::OnceLock::new();
    let code = CODE.get_or_init(|| {
        std::env::var("TODO_ACCESS_CODE")
            .ok()
            .map(|c| c.trim().to_string())
            .filter(|c| !c.is_empty())
    });
    matches!(code, Some(c) if c.as_str() == given)
}

const FEED_PATH: &str = "makeavoy-assets/feed.json";
const UPLOADS_DIR: &str = "makeavoy-assets/uploads";

// Xteink X3 panel: 528 wide x 792 tall portrait. With the 5-item list showing,
// the list block eats the bottom 220px (20px gap + 5 * 40px rows), so the
// image gets the remaining 572px. With items disabled the image fills the screen.
const EINK_WIDTH: u32 = 528;
const EINK_HEIGHT_WITH_ITEMS: u32 = 572;
const EINK_HEIGHT_NO_ITEMS: u32 = 792;

#[derive(Serialize, Deserialize)]
struct Feed {
    version: String,
    image: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    items: Option<Vec<String>>,
}

#[derive(Deserialize)]
struct CodeQuery {
    code: String,
}

#[derive(Deserialize)]
struct UpdateFeedRequest {
    code: String,
    image: String,
    items: Option<Vec<String>>,
    #[serde(default)]
    dodge: bool,
    #[serde(default)]
    dodge_amount: i32,
    #[serde(default)]
    fit: FitMode,
}

#[derive(Deserialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
enum FitMode {
    // Distort the image to exactly fill the target dimensions.
    Stretch,
    // Preserve aspect ratio, letterboxing the remainder in white.
    Pad,
}

impl Default for FitMode {
    fn default() -> Self {
        FitMode::Pad
    }
}

#[derive(Deserialize)]
struct DeleteUploadRequest {
    code: String,
    name: String,
}

async fn todo_page() -> Html<&'static str> {
    Html(include_str!("../todo-admin/index.html"))
}

async fn todo_get_feed(Query(q): Query<CodeQuery>) -> impl IntoResponse {
    if !todo_code_ok(&q.code) {
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "invalid code"}))).into_response();
    }
    match tokio::fs::read_to_string(FEED_PATH).await {
        Ok(contents) => match serde_json::from_str::<Feed>(&contents) {
            Ok(feed) => (StatusCode::OK, Json(feed)).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("failed to parse feed: {}", e)})),
            )
                .into_response(),
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to read feed: {}", e)})),
        )
            .into_response(),
    }
}

// If `image` points at our own uploads folder (relative or absolute), return the
// bare filename so we can read it straight off disk instead of round-tripping over HTTP.
fn local_upload_filename(image: &str) -> Option<String> {
    let marker = "/assets/uploads/";
    let name = &image[image.find(marker)? + marker.len()..];
    if name.is_empty() || name.contains('/') || name.contains("..") {
        None
    } else {
        Some(name.to_string())
    }
}

// Only public addresses: the server mustn't be a way into this machine or its
// network (127.0.0.1:4000, the router, ...).
fn is_public(ip: std::net::IpAddr) -> bool {
    use std::net::IpAddr;
    match ip {
        IpAddr::V4(v4) => {
            let o = v4.octets();
            !(v4.is_private()
                || v4.is_loopback()
                || v4.is_link_local()
                || v4.is_unspecified()
                || v4.is_broadcast()
                || v4.is_documentation()
                || o[0] == 0
                || (o[0] == 100 && (o[1] & 0xc0) == 64) // 100.64/10, carrier NAT
                || o[0] >= 224) // multicast, reserved
        }
        IpAddr::V6(v6) => {
            if let Some(v4) = v6.to_ipv4_mapped() {
                return is_public(IpAddr::V4(v4));
            }
            let first = v6.segments()[0];
            !(v6.is_loopback()
                || v6.is_unspecified()
                || (first & 0xfe00) == 0xfc00 // unique local
                || (first & 0xffc0) == 0xfe80 // link local
                || (first & 0xff00) == 0xff00) // multicast
        }
    }
}

async fn fetch_url_bytes(url: &str) -> Result<Vec<u8>, String> {
    const MAX_BYTES: usize = 25 * 1024 * 1024;
    let parsed = reqwest::Url::parse(url).map_err(|e| e.to_string())?;
    if !matches!(parsed.scheme(), "http" | "https") {
        return Err("image url must be http or https".to_string());
    }
    let host = parsed.host_str().ok_or("image url has no host")?.to_string();
    let port = parsed.port_or_known_default().unwrap_or(443);
    let addr = tokio::net::lookup_host((host.trim_matches(|c| c == '[' || c == ']'), port))
        .await
        .map_err(|e| e.to_string())?
        .next()
        .ok_or("image url's host doesn't resolve")?;
    if !is_public(addr.ip()) {
        return Err("image url must be a public address".to_string());
    }
    // connect to the address just checked (no second lookup), and follow no
    // redirects, which could point anywhere
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none())
        .resolve(&host, addr)
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.get(parsed).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("image url returned status {}", resp.status()));
    }
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    if bytes.len() > MAX_BYTES {
        return Err("image is too large".to_string());
    }
    Ok(bytes.to_vec())
}

// Resize to the exact eink panel dimensions (stretched or letterboxed per `fit`),
// optionally brighten ("dodge") the image since washed-out art survives the panel's
// 1-bit dither better than dark/saturated art, then dither to black/white and pack
// into an uncompressed 1-bit BMP the device can render without any on-device decode.
fn process_for_eink(
    bytes: &[u8],
    target_w: u32,
    target_h: u32,
    fit: FitMode,
    dodge: bool,
    dodge_amount: i32,
) -> Result<Vec<u8>, String> {
    let img = image::load_from_memory(bytes).map_err(|e| e.to_string())?;

    let mut img = match fit {
        FitMode::Stretch => {
            img.resize_exact(target_w, target_h, image::imageops::FilterType::Lanczos3)
        }
        FitMode::Pad => {
            let resized = img
                .resize(target_w, target_h, image::imageops::FilterType::Lanczos3)
                .to_rgba8();
            let (rw, rh) = (resized.width(), resized.height());
            let off_x = (target_w - rw) / 2;
            let off_y = (target_h - rh) / 2;
            let mut canvas =
                image::RgbaImage::from_pixel(target_w, target_h, image::Rgba([255, 255, 255, 255]));
            for y in 0..rh {
                for x in 0..rw {
                    canvas.put_pixel(x + off_x, y + off_y, *resized.get_pixel(x, y));
                }
            }
            image::DynamicImage::ImageRgba8(canvas)
        }
    };

    if dodge && dodge_amount != 0 {
        let brightened = image::imageops::brighten(&img, dodge_amount.clamp(0, 100));
        img = image::DynamicImage::ImageRgba8(brightened);
    }

    let mut gray = img.to_luma8();
    image::imageops::dither(&mut gray, &image::imageops::BiLevel);

    Ok(encode_1bit_bmp(&gray))
}

// Hand-rolled BITMAPFILEHEADER + BITMAPINFOHEADER writer: 1 bit per pixel, a 2-entry
// [black, white] palette, rows padded to 4 bytes, bottom-up row order, no compression.
// This is the exact format the eink device validates and renames into place untouched.
fn encode_1bit_bmp(img: &image::GrayImage) -> Vec<u8> {
    let width = img.width();
    let height = img.height();

    let row_bytes = (((width as usize + 7) / 8) + 3) / 4 * 4;
    let pixel_data_size = row_bytes * height as usize;
    let palette_size = 2 * 4;
    let header_size = 14 + 40;
    let pixel_offset = header_size + palette_size;
    let file_size = pixel_offset + pixel_data_size;

    let mut buf = Vec::with_capacity(file_size);

    // BITMAPFILEHEADER
    buf.extend_from_slice(b"BM");
    buf.extend_from_slice(&(file_size as u32).to_le_bytes());
    buf.extend_from_slice(&0u16.to_le_bytes());
    buf.extend_from_slice(&0u16.to_le_bytes());
    buf.extend_from_slice(&(pixel_offset as u32).to_le_bytes());

    // BITMAPINFOHEADER
    buf.extend_from_slice(&40u32.to_le_bytes());
    buf.extend_from_slice(&(width as i32).to_le_bytes());
    buf.extend_from_slice(&(height as i32).to_le_bytes()); // positive = bottom-up
    buf.extend_from_slice(&1u16.to_le_bytes()); // planes
    buf.extend_from_slice(&1u16.to_le_bytes()); // bits per pixel
    buf.extend_from_slice(&0u32.to_le_bytes()); // BI_RGB, uncompressed
    buf.extend_from_slice(&(pixel_data_size as u32).to_le_bytes());
    buf.extend_from_slice(&2835i32.to_le_bytes()); // ~72 DPI
    buf.extend_from_slice(&2835i32.to_le_bytes());
    buf.extend_from_slice(&2u32.to_le_bytes()); // colors used
    buf.extend_from_slice(&2u32.to_le_bytes()); // important colors

    // Palette: index 0 = black, index 1 = white (BGR + reserved byte)
    buf.extend_from_slice(&[0, 0, 0, 0]);
    buf.extend_from_slice(&[255, 255, 255, 0]);

    // Pixel data, bottom row first, MSB-first bit packing, 1 = white
    for y in (0..height).rev() {
        let mut row = vec![0u8; row_bytes];
        for x in 0..width {
            if img.get_pixel(x, y).0[0] >= 128 {
                row[(x / 8) as usize] |= 1 << (7 - (x % 8));
            }
        }
        buf.extend_from_slice(&row);
    }

    buf
}

async fn todo_update_feed(Json(payload): Json<UpdateFeedRequest>) -> impl IntoResponse {
    if !todo_code_ok(&payload.code) {
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "invalid code"}))).into_response();
    }
    if let Some(items) = &payload.items {
        if items.len() != 5 {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "exactly 5 items are required"})),
            )
                .into_response();
        }
    }

    let (target_w, target_h) = if payload.items.is_some() {
        (EINK_WIDTH, EINK_HEIGHT_WITH_ITEMS)
    } else {
        (EINK_WIDTH, EINK_HEIGHT_NO_ITEMS)
    };

    // Every image is re-fetched/re-read and re-encoded locally on save: URLs can't be
    // trusted to stay reachable or sized correctly, so the JSON must only ever point at
    // our own processed copy.
    let raw_bytes = if let Some(filename) = local_upload_filename(&payload.image) {
        match tokio::fs::read(format!("{}/{}", UPLOADS_DIR, filename)).await {
            Ok(b) => b,
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": format!("failed to read uploaded image: {}", e)})),
                )
                    .into_response()
            }
        }
    } else if payload.image.starts_with("http://") || payload.image.starts_with("https://") {
        match fetch_url_bytes(&payload.image).await {
            Ok(b) => b,
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": format!("failed to fetch image url: {}", e)})),
                )
                    .into_response()
            }
        }
    } else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "image must be a URL or an uploaded file"})),
        )
            .into_response();
    };

    let dodge = payload.dodge;
    let dodge_amount = payload.dodge_amount;
    let fit = payload.fit;
    let processed = match tokio::task::spawn_blocking(move || {
        process_for_eink(&raw_bytes, target_w, target_h, fit, dodge, dodge_amount)
    })
    .await
    {
        Ok(Ok(bytes)) => bytes,
        Ok(Err(e)) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("failed to process image: {}", e)})),
            )
                .into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("image processing failed: {}", e)})),
            )
                .into_response()
        }
    };

    if let Err(e) = tokio::fs::create_dir_all(UPLOADS_DIR).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to create uploads dir: {}", e)})),
        )
            .into_response();
    }

    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let filename = format!("{}.bmp", millis);
    if let Err(e) = tokio::fs::write(format!("{}/{}", UPLOADS_DIR, filename), &processed).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to save processed image: {}", e)})),
        )
            .into_response();
    }
    // Served over http:// on purpose: the eink device fetches this URL directly and
    // skipping TLS + using a tiny 1-bit BMP keeps its sync fast and conversion-free.
    let image_url = format!("http://makeavoy.com/assets/uploads/{}", filename);

    let version = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string());

    let feed = Feed {
        version,
        image: image_url.clone(),
        items: payload.items,
    };

    let contents = match serde_json::to_string_pretty(&feed) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("failed to serialize feed: {}", e)})),
            )
                .into_response()
        }
    };

    match tokio::fs::write(FEED_PATH, contents).await {
        Ok(_) => (StatusCode::OK, Json(json!({"ok": true, "image": image_url}))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to write feed: {}", e)})),
        )
            .into_response(),
    }
}

async fn todo_upload(mut multipart: Multipart) -> impl IntoResponse {
    let mut code_ok = false;
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut content_type: Option<String> = None;

    loop {
        let field = match multipart.next_field().await {
            Ok(Some(f)) => f,
            Ok(None) => break,
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": format!("malformed upload: {}", e)})),
                )
                    .into_response()
            }
        };
        match field.name().unwrap_or("") {
            "code" => {
                code_ok = todo_code_ok(&field.text().await.unwrap_or_default());
            }
            "file" => {
                content_type = field.content_type().map(|s| s.to_string());
                file_bytes = field.bytes().await.ok().map(|b| b.to_vec());
            }
            _ => {}
        }
    }

    if !code_ok {
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "invalid code"}))).into_response();
    }

    let bytes = match file_bytes {
        Some(b) if !b.is_empty() => b,
        _ => {
            return (StatusCode::BAD_REQUEST, Json(json!({"error": "missing file"})))
                .into_response()
        }
    };

    // Only accept real PNGs: check declared content-type and the PNG file signature.
    const PNG_SIGNATURE: [u8; 8] = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    let declared_png = content_type.as_deref() == Some("image/png");
    let starts_with_signature = bytes.len() >= 8 && bytes[..8] == PNG_SIGNATURE;
    if !declared_png || !starts_with_signature {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "only .png files are allowed"})),
        )
            .into_response();
    }

    if let Err(e) = tokio::fs::create_dir_all(UPLOADS_DIR).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to create uploads dir: {}", e)})),
        )
            .into_response();
    }

    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let filename = format!("{}.png", millis);
    let path = format!("{}/{}", UPLOADS_DIR, filename);

    match tokio::fs::write(&path, &bytes).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({"url": format!("/assets/uploads/{}", filename)})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to save file: {}", e)})),
        )
            .into_response(),
    }
}

// A bare filename is safe to join onto UPLOADS_DIR only if it has no path
// components of its own — this is the only thing standing between the delete
// endpoint and the rest of the filesystem.
fn safe_upload_filename(name: &str) -> bool {
    !name.is_empty() && !name.contains('/') && !name.contains('\\') && name != "." && name != ".."
}

async fn todo_list_uploads(Query(q): Query<CodeQuery>) -> impl IntoResponse {
    if !todo_code_ok(&q.code) {
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "invalid code"}))).into_response();
    }

    let mut read_dir = match tokio::fs::read_dir(UPLOADS_DIR).await {
        Ok(rd) => rd,
        Err(_) => return (StatusCode::OK, Json(json!({"files": []}))).into_response(),
    };

    let mut files: Vec<(u128, String)> = Vec::new();
    loop {
        let entry = match read_dir.next_entry().await {
            Ok(Some(e)) => e,
            Ok(None) => break,
            Err(_) => break,
        };
        let Ok(file_type) = entry.file_type().await else { continue };
        if !file_type.is_file() {
            continue;
        }
        let Some(name) = entry.file_name().to_str().map(|s| s.to_string()) else { continue };
        let modified = entry
            .metadata()
            .await
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_millis())
            .unwrap_or(0);
        files.push((modified, name));
    }
    files.sort_by(|a, b| b.0.cmp(&a.0));

    let files: Vec<_> = files
        .into_iter()
        .map(|(_, name)| json!({"name": name, "url": format!("/assets/uploads/{}", name)}))
        .collect();

    (StatusCode::OK, Json(json!({"files": files}))).into_response()
}

async fn todo_delete_upload(Json(payload): Json<DeleteUploadRequest>) -> impl IntoResponse {
    if !todo_code_ok(&payload.code) {
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "invalid code"}))).into_response();
    }
    if !safe_upload_filename(&payload.name) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid filename"})),
        )
            .into_response();
    }

    let target = Path::new(UPLOADS_DIR).join(&payload.name);

    // Defense in depth beyond the filename check: canonicalize and confirm the
    // resolved path is actually inside the uploads directory before deleting.
    let (Ok(uploads_canon), Ok(target_canon)) = (
        tokio::fs::canonicalize(UPLOADS_DIR).await,
        tokio::fs::canonicalize(&target).await,
    ) else {
        return (StatusCode::NOT_FOUND, Json(json!({"error": "file not found"}))).into_response();
    };
    if !target_canon.starts_with(&uploads_canon) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "refusing to delete outside the uploads folder"})),
        )
            .into_response();
    }

    match tokio::fs::remove_file(&target).await {
        Ok(_) => (StatusCode::OK, Json(json!({"ok": true}))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("failed to delete file: {}", e)})),
        )
            .into_response(),
    }
}

// share.makeavoy.com — reverse proxy to Node.js on port 3000. Not routed for
// now (see main); kept for when it is.
#[allow(dead_code)]
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
