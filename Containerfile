# site-delta as one image: the server and everything it serves from its
# working directory (/site): makeavoy-dist (with silt-lua's wasm for the Code
# app, built from silt-lua's GitHub main), petrichor-dist, makeavoy-assets, 404.
#
#   podman build -t localhost/site-delta .
#
# At run time mount config.txt (and the certificates it names) into /site,
# and run it on the host network so it reaches sosh on 127.0.0.1:4000.
# See DEPLOY.md.

ARG SILT_REPO=https://github.com/Auxnon/silt-lua.git
ARG SILT_REF=main

# --- silt-lua for the browser ----------------------------------------------
FROM docker.io/library/rust:1-bookworm AS silt
RUN rustup target add wasm32-unknown-unknown && cargo install --locked wasm-pack
ARG SILT_REPO
ARG SILT_REF
RUN git clone -q --depth 1 --branch "$SILT_REF" "$SILT_REPO" /silt
WORKDIR /silt
# silt main's `wasm` feature doesn't build as of ea28d0f (lsp_wasm, serde_json):
# the fix, applied only while main lacks it
COPY silt-wasm.patch /tmp/
RUN if git apply --check /tmp/silt-wasm.patch 2>/dev/null; then git apply /tmp/silt-wasm.patch; fi
# --no-opt: wasm-pack's wasm-opt predates the bulk-memory ops current Rust emits
RUN wasm-pack build --release --no-opt --target web -- --features wasm

# --- the two sites -----------------------------------------------------------
# node 20: petrichor-package's node-sass 8 builds on nothing newer
FROM docker.io/library/node:20-bookworm AS web
RUN npm install -g bun
WORKDIR /src
COPY makeavoy-package makeavoy-package
COPY petrichor-package petrichor-package
COPY makeavoy-assets makeavoy-assets
RUN cd makeavoy-package && bun install
# silt-lua isn't on npm: the package the wasm build made (the README's bun link)
COPY --from=silt /silt/pkg makeavoy-package/node_modules/silt-lua
RUN cd makeavoy-package && bun run build
RUN cd petrichor-package && npm ci && npm run build

# --- the server --------------------------------------------------------------
FROM docker.io/library/rust:1-bookworm AS server
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src src
# the /todo page is compiled in (include_str!)
COPY todo-admin todo-admin
RUN cargo build --release --locked

# --- runtime -----------------------------------------------------------------
FROM docker.io/library/debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /site
COPY --from=server /src/target/release/site-delta ./site-delta
COPY --from=web /src/makeavoy-dist makeavoy-dist
COPY --from=web /src/petrichor-dist petrichor-dist
COPY makeavoy-assets makeavoy-assets
COPY 404 404
EXPOSE 8080 443
CMD ["./site-delta"]
