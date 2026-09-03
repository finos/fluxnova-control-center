# Local OIDC Setup (Keycloak + fluxnova-bpm-platform)

This guide runs `control-center` and `bpm-platform` with OIDC provided by Keycloak using
`docker/docker-compose-keycloak.yml`.

## What this stack provides

- Keycloak on `https://localhost:8443`
- bpm-platform on `http://localhost:8080`
- control-center on `https://localhost:4000`
- OIDC login for control-center and JWT validation in bpm-platform

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- `openssl` installed
- Access to pull images from your configured `DOCKER_REGISTRY` (default `docker.io`)

## 1) Generate local TLS certs used by Keycloak and control-center

From repo root:

```bash
bash ./scripts/generate-cert.sh
```

This creates:

- `docker/certs/fluxnova-local.crt`
- `docker/certs/fluxnova-local.key`

## 2) Start the OIDC stack

From repo root:

- Use `--build` if you want to build `control-center` from local source changes.
- Omit `--build` to use/pull images from your configured registry.

```bash
docker compose -f docker/docker-compose-keycloak.yml up -d --build
```

```bash
docker compose -f docker/docker-compose-keycloak.yml up -d
```

Optional: if your environment needs internal registry mirrors, set these first:

```bash
export DOCKER_REGISTRY=<your-registry>
export ALPINE_REGISTRY=<your-alpine-mirror>
```

## 3) Verify services are up

```bash
docker compose -f docker/docker-compose-keycloak.yml ps
```

Check logs if needed:

```bash
docker compose -f docker/docker-compose-keycloak.yml logs -f keycloak
docker compose -f docker/docker-compose-keycloak.yml logs -f control-center
docker compose -f docker/docker-compose-keycloak.yml logs -f bpm-platform
```

## 4) Sign in to control-center

Open:

- `https://localhost:4000`

Test users from `docker/keycloak/realm-export.json`:

- `demo` / `demo`
- `john` / `john`
- `mary` / `mary`
- `peter` / `peter`

## Notes about hostname usage

The compose file intentionally mixes hostnames:

- `keycloak:8443` for container-to-container calls (token, userinfo, JWKS)
- `localhost:8443` for browser-reachable URLs and issuer matching

This keeps browser redirects working while preserving internal Docker DNS routing.

```bash
docker compose -f docker/docker-compose-keycloak.yml run --rm --entrypoint sh control-center
```

## Stop and clean up

```bash
docker compose -f docker/docker-compose-keycloak.yml down
```

To also remove volumes:

```bash
docker compose -f docker/docker-compose-keycloak.yml down -v
```
