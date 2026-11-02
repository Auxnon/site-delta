# Deploying site-delta on a NixOS server: a runbook for an agent

You're on the NixOS machine that serves makeavoy.com, petrichor64.app and
sosh.makeavoy.com, with root (sudo). site-delta is built **on this machine**
as a podman image: the `Containerfile` builds silt-lua's wasm from silt-lua's
GitHub `main` (for the Code app), both sites and the server. It runs on the
host network:
- `:443` is HTTPS, with the certificate named in `config.txt`.
- `:8080` is plain HTTP.
- Requests for `sosh.makeavoy.com` go to `127.0.0.1:4000`, which is sosh.
  Its runbook is `deploy/AGENT.md` in github.com/Auxnon/sosh.

## Rules

- Never print or copy the private key. Don't overwrite
  `/var/lib/site-delta/config.txt` or the certificates if they exist.
- Use `sudo podman`. The service runs as root and only sees root's images.
- `nixos-rebuild test` first, `switch` once it's healthy.
- Stop and report if a step fails twice the same way.

## 1. Look first

```sh
uname -m; free -g; df -h /var/lib       # the build wants ~3 GB RAM and ~8 GB of disk
ls /etc/nixos/                          # flake.nix there means a flake config
systemctl status podman-site-delta 2>&1 | head
sudo ss -ltnp | grep -E ':(443|8080|80) '   # anything else on these ports has to go first
```

## 2. Source and image

```sh
sudo mkdir -p /srv && cd /srv
sudo git clone https://github.com/Auxnon/site-delta.git   # or: sudo git -C /srv/site-delta pull --ff-only
cd /srv/site-delta
sudo podman tag localhost/site-delta localhost/site-delta:previous 2>/dev/null   # an update: something to roll back to
sudo podman build -t localhost/site-delta .
```

This takes about 10 to 20 minutes the first time. To build an older silt:
`--build-arg SILT_REF=<branch or tag>`.

## 3. Config and certificates (first deploy only)

The server reads `config.txt` from its working directory (`/site` in the
image):
- line 1: the address to bind, as `0:0:0:0`
- lines 2 and 3: the certificate chain and the key, as paths inside the
  container

```sh
sudo mkdir -p /var/lib/site-delta/certs
sudo test -e /var/lib/site-delta/config.txt || printf '0:0:0:0\n/certs/cert.pem\n/certs/key.pem\n' \
  | sudo tee /var/lib/site-delta/config.txt
```

The certificate has to cover `makeavoy.com`, `*.makeavoy.com` (for sosh)
and `petrichor64.app`. With Cloudflare in Full (strict) mode, a Cloudflare
Origin certificate does this, made in the dashboard under SSL/TLS, then
Origin Server.

If the certificates aren't in `/var/lib/site-delta/certs/` (`cert.pem` and
`key.pem`, mode 600, owned by root), ask the owner for them. Don't generate
self-signed ones, because Cloudflare strict rejects them.

## 4. The NixOS configuration

In `/etc/nixos/configuration.nix`, or a module it imports:

```nix
{
  virtualisation.podman.enable = true;
  virtualisation.oci-containers.backend = "podman";
  virtualisation.oci-containers.containers.site-delta = {
    image = "localhost/site-delta";
    pull = "newer";             # a local image: podman keeps it
    volumes = [
      "/var/lib/site-delta/config.txt:/site/config.txt:ro"
      "/var/lib/site-delta/certs:/certs:ro"
    ];
    # host network: binds 443 and 8080 on the machine, reaches sosh on 127.0.0.1:4000
    # --init: as PID 1 the server would ignore SIGTERM, so every stop waited 10s for a kill
    extraOptions = [ "--network=host" "--init" ];
    # environment.SOSH_UPSTREAM = "127.0.0.1:4000";   # the default
  };
  networking.firewall.allowedTCPPorts = [ 443 8080 ];
}
```

If Cloudflare or a router sends plain HTTP to port 80, forward 80 to 8080:
`networking.firewall.extraCommands` with an iptables `REDIRECT`, or the
router. Ask the owner which one this machine uses. Then:

```sh
sudo nixos-rebuild test
```

## 5. Check it works

```sh
systemctl is-active podman-site-delta
journalctl -u podman-site-delta -n 30 --no-pager      # "address: [0, 0, 0, 0] and searching for pems at ..."
for h in makeavoy.com petrichor64.app sosh.makeavoy.com; do
  printf '%s ' $h; curl -sk -o /dev/null -w '%{http_code}\n' --resolve $h:443:127.0.0.1 https://$h/
done                                                   # 200 200 200 (sosh: 502 if sosh isn't up)
curl -sk --resolve makeavoy.com:443:127.0.0.1 https://makeavoy.com/health
```

From outside: https://makeavoy.com, https://petrichor64.app,
https://sosh.makeavoy.com. When they all work, run
`sudo nixos-rebuild switch`.

**Updating:** `git pull --ff-only`, then step 2, then
`sudo systemctl restart podman-site-delta`.

**Rolling back:** `sudo podman tag localhost/site-delta:previous localhost/site-delta && sudo systemctl restart podman-site-delta`.

| symptom | look at |
|---|---|
| exits at start: `Address in use` | something else is on 443 or 8080 (step 1) |
| exits at start, pem error | `config.txt` paths are inside the container: `/certs/...`, not `/var/lib/...` |
| sosh.makeavoy.com 502 | sosh isn't running on 127.0.0.1:4000 (`systemctl status podman-sosh`) |
| Cloudflare 526 | the certificate doesn't cover the host name |
| Code app on makeavoy.com errors | the silt wasm: rebuild, check the `silt` stage's log |

Report back the commit deployed (`git -C /srv/site-delta log --oneline -1`),
the step 5 results, and anything skipped.
