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
- dist will move up into root of repo


### Deploying
`podman build -t localhost/site-delta .` builds all of it (silt-lua's wasm from its GitHub main, both sites, the server) into one image. `DEPLOY.md` has the NixOS runbook.

### Dev server
- Follow build steps
- Return to repo root and `cd makeavoy-assets`
- `http-server -a 0.0.0.0 -p 9001` ( proxy to assets normally handled by backend)
- within `makeavoy-package` run `bun run dev`

## Petrichor64.app

Svelte site includes markdown and builtin command based search bar activated by typing any text anywhere on the page. On mobile use the magnifying glass button

### Building
- `bun run build` within `petrichor-package`
- dist will move up into root of repo

Additionally make sure a folder named 'petrichor-templates` has been populated with a petrichor64 [guide-builder](https://github.com/Auxnon/Petrichor64/blob/main/build-tools/guide-builder.js). Move the finalized guide.md here.

### Dev server
- execute `bun run preview -- --host`

## Backend

rust built axum and tower based server replaces old Node.js runtime for original site, socket integrations coming soon


### Building

Make sure config.txt is set up with 3 lines:
1. device local IP
2. file path of public ssl key
3. file path of private ssl key

run `cargo build --release` assuming default cargo toolchain is set to your system's architecture
copy the binary from target to root level of the project repo `cp target/release/site-delta .`
Configure daemon to run binary on system level, on the assumption keys are not in userspace 
