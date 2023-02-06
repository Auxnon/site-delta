#![feature(proc_macro_hygiene, decl_macro)]

use rocket::{fairing::AdHoc, Request};

#[macro_use]
extern crate rocket;

use rocket::fs::NamedFile;

#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open("index.html").await.ok()
}

async fn makeavoy() -> Option<NamedFile> {
    NamedFile::open("makeavoy-dist/index.html").await.ok()
}

async fn petrichor() -> Option<NamedFile> {
    NamedFile::open("petrichor-dist/index.html").await.ok()
}
// #[get("/")]
// fn index() -> &'static str {
//     "Hello, world!"
// }

fn main() {
    rocket::ignite()
        .mount("/", routes![index])
        .attach(AdHoc::on_request("GET", |req, data| {
            match req.headers().get("Host").next() {
                Some(h) => match h {
                    "makeavoy.com" => makeavoy(),
                    "petrichor.com" => petrichor(),
                    _ => makeavoy(),
                },
                _ => makeavoy(),
            }
            // .iter()
            // .for_each(|h| println!("header: {:?}", h));
            // println!("headers {}",);
            // req.
            // Request::host(req);
            // println!("Request: {:?}", req);
        }))
        .launch();
}
