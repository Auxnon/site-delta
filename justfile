start:
 cargo run
build:
 cargo build --release
 cp target/release/site-delta .
debug:
 cargo build
 cp target/debug/site-delta site-debug
