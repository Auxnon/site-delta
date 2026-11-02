# Website Delta Δ

## MakeAvoy.com
![image](https://user-images.githubusercontent.com/527951/117345490-98ec6280-ae74-11eb-9cf7-2e09e95d9317.png)

Original vanilla site converter to typescript and webpack5

### Building
Currently requires silt-lua to showcase the interpreter as wasm
- `cargo install wasm-pack`
- `git clone https://github.com/Auxnon/silt-lua && cd silt-lua`
- `wasm-pack build --release --no-opt --target web -- --features wasm` (with `silt-wasm.patch` applied, until silt main has it)
- `cd pkg`
- `bun link` (or `npm link`)
- Within this repo root `cd makeavoy-package`
- `bun link silt-lua && bun i`
- `bun run build`

### Deploying
`podman build -t localhost/site-delta .` builds all of it (silt-lua's wasm from its GitHub main, both sites, the server) into one image. `DEPLOY.md` has the NixOS runbook.

### Dev server
- Follow build steps
- Return to repo root and `cd makeavoy-assets`
- `http-server -a 0.0.0.0 -p 9001` ( proxy to assets normally handled by backend)
- within `makeavoy-package` run `bun run dev`

## Petrichor64.app

Svelte site includes markdown and builtin command based search bar activated by typing any text anywhere on the page. On mobile use the magnifying glass button

## Backend

rust built axum and tower based server replaces old Node.js runtime for original site, socket integrations coming soon



