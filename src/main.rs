#![feature(proc_macro_hygiene, decl_macro)]

use rocket::{fairing::AdHoc, Request};

#[macro_use]
extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

fn main() {
    rocket::ignite()
        .mount("/", routes![index])
        .attach(AdHoc::on_request("GET", |req, _| {
            for h in req.headers().get("Host") {
                println!("header: {:?}", h);
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
