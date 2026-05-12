# Local Development with Keycloak OIDC and fluxnova-bpm-platform

This guide walks through how to spin up a local development environment that includes the
**fluxnova-bpm-platform** engine and **Keycloak** as an OIDC provider using Docker Compose, and
how to configure and run the Fluxnova Control Center against those services.

By the end of this guide you will have:

- Keycloak running locally as your OIDC identity provider
- fluxnova-bpm-platform running locally as the BPM engine
- The Fluxnova Control Center running in development mode, authenticated via Keycloak

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker
  Compose CLI)
- Node.js 22+
- pnpm
- The Fluxnova Control Center repository cloned locally
  (see [Getting Started](./getting-started.md) if you haven't done this yet)

---

## 1. Create the Docker Compose stack

Create a `docker-compose.yml` file in a convenient directory (e.g. alongside your cloned
repositories or in a dedicated `local-dev/` folder). This stack starts Keycloak and the
fluxnova-bpm-platform engine.

```yaml
# docker-compose.yml
services:
  # ──────────────────────────────────────────────
  # Keycloak - OIDC identity provider
  # ──────────────────────────────────────────────
  keycloak:
    image: quay.io/keycloak/keycloak:26.1
    container_name: keycloak
    command: start-dev
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: admin
      KC_BOOTSTRAP_ADMIN_PASSWORD: admin
      KC_HTTP_PORT: 8180
    ports:
      - '8180:8180'
    healthcheck:
      test: ['CMD-SHELL', 'curl -sf http://localhost:8180/health/ready || exit 1']
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  # ──────────────────────────────────────────────
  # fluxnova-bpm-platform - BPM engine & REST API
  # ──────────────────────────────────────────────
  fluxnova-engine:
    image: finos/fluxnova-bpm-platform:latest
    container_name: fluxnova-engine
    environment:
      # Disable engine-level auth so the Control Center BFF can proxy
      # requests without needing an engine-level bearer token.
      # Remove / adjust if your engine is secured behind Keycloak.
      SPRING_SECURITY_ENABLED: 'false'
    ports:
      - '8080:8080'
    healthcheck:
      test: ['CMD-SHELL', 'curl -sf http://localhost:8080/engine-rest/engine || exit 1']
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
```

> **Note:** The `finos/fluxnova-bpm-platform` image tag above uses `latest`. Pin this to a
> specific version that matches your development needs. Check the
> [fluxnova-bpm-platform releases](https://github.com/finos/fluxnova-bpm-platform/releases)
> for available versions.

Start the stack:

```bash
docker compose up -d
```

Wait for both services to become healthy before proceeding:

```bash
docker compose ps
```

---

## 2. Configure Keycloak

Once Keycloak is running, navigate to the Admin Console at
[http://localhost:8180](http://localhost:8180) and sign in with:

- **Username:** `admin`
- **Password:** `admin`

### 2a. Create a realm

1. In the top-left corner, click the realm dropdown (showing **Keycloak**) and select
   **Create realm**.
2. Set the **Realm name** to `fluxnova` and click **Create**.

### 2b. Create an OIDC client

1. In the left sidebar, navigate to **Clients** and click **Create client**.
2. Fill in the following on the **General Settings** page:

   | Field           | Value                     |
   | --------------- | ------------------------- |
   | **Client type** | OpenID Connect            |
   | **Client ID**   | `fluxnova-control-center` |

3. Click **Next**.
4. On the **Capability config** page:

   | Setting                   | Value                    |
   | ------------------------- | ------------------------ |
   | **Client authentication** | On (confidential client) |
   | **Standard flow**         | Enabled                  |

5. Click **Next**.
6. On the **Login settings** page:

   | Field                               | Value                     |
   | ----------------------------------- | ------------------------- |
   | **Valid redirect URIs**             | `http://localhost:4000/*` |
   | **Valid post logout redirect URIs** | `http://localhost:4000/*` |
   | **Web origins**                     | `http://localhost:4000`   |

7. Click **Save**.

### 2c. Copy the client secret

1. Open the client you just created and navigate to the **Credentials** tab.
2. Copy the value in the **Client secret** field — you will need this when configuring the
   Control Center environment variables below.

### 2d. Create a test user

1. In the left sidebar, navigate to **Users** and click **Create new user**.
2. Fill in a **Username** (e.g. `dev-user`) and click **Create**.
3. Navigate to the **Credentials** tab, click **Set password**, enter a password, and set
   **Temporary** to **Off**. Click **Save password**.

---

## 3. Configure the Control Center

Set the following environment variables in your shell initialisation file (e.g. `~/.zshrc` or
`~/.bashrc`), then restart your terminal (or run `source ~/.zshrc`).

Replace `<YOUR_CLIENT_SECRET>` with the client secret you copied in step 2c.

```bash
# ── Auth strategy ──────────────────────────────────────────────────────────
export FXN_AUTH_STRATEGY=oidc

# ── OIDC provider (Keycloak, realm: fluxnova) ──────────────────────────────
export FXN_OIDC_AUTHORITY=http://localhost:8180/realms/fluxnova
export FXN_OIDC_ISSUER=http://localhost:8180/realms/fluxnova
export FXN_OIDC_AUTH_URL=http://localhost:8180/realms/fluxnova/protocol/openid-connect/auth
export FXN_OIDC_TOKEN_URL=http://localhost:8180/realms/fluxnova/protocol/openid-connect/token
export FXN_OIDC_USERINFO_URL=http://localhost:8180/realms/fluxnova/protocol/openid-connect/userinfo

# ── OIDC client credentials ────────────────────────────────────────────────
export FXN_OIDC_CLIENT_ID=fluxnova-control-center
export FXN_OIDC_CLIENT_SECRET=<YOUR_CLIENT_SECRET>

# ── Public URL of the Control Center (used for OIDC callback) ──────────────
export FXN_PUBLIC_URL=http://localhost:4000

# ── Fluxnova engine REST API ───────────────────────────────────────────────
export FXN_REST_API_URL=http://localhost:8080

# ── TLS - disable rejection of self-signed certs for local development ──────
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

> **Note:** `NODE_TLS_REJECT_UNAUTHORIZED=0` disables TLS certificate verification. This is
> safe for local development but **must never be used in production**. If you use Node.js for
> other purposes where you don't want this behaviour, start the application with the variable
> scoped to just that process instead:
>
> ```bash
> NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm start
> ```

### Optional: secure cookie / CSRF keys

For anything beyond a quick local test it is strongly recommended to also set:

```bash
# Comma-separated list of signing keys (allows key rotation)
export FXN_COOKIE_KEYS=some-long-random-string-here

# Pseudo-random secret for CSRF protection
export FXN_CSRF_KEY=another-long-random-string-here
```

You can generate suitable random values with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Build and run the Control Center

If this is your first time running the project, follow the full setup in
[Getting Started](./getting-started.md). The abbreviated steps are:

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Generate the Fluxnova API client library (required before the first build):

   ```bash
   ./scripts/generate-fluxnova-client.sh
   ```

3. Start the development server:

   ```bash
   pnpm start
   ```

   This starts both the Angular frontend and the NestJS BFF server in parallel with live reload.

4. Open your browser at [http://localhost:4000](http://localhost:4000).

   You should be redirected to the Keycloak login page. Sign in with the test user created
   in step 2d, and you will be redirected back to the Control Center dashboard.

---

## 5. Verify the setup

| What to check                    | How                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Keycloak is running              | [http://localhost:8180/health/ready](http://localhost:8180/health/ready) returns `{"status":"UP"}`                       |
| fluxnova-bpm-platform is running | [http://localhost:8080/engine-rest/engine](http://localhost:8080/engine-rest/engine) returns a JSON list of engine names |
| Control Center is running        | [http://localhost:4000](http://localhost:4000) redirects to Keycloak login                                               |
| Login succeeds                   | After authenticating with your test user, you are redirected to the Control Center dashboard                             |

---

## Architecture overview

```
Browser
  │
  │  http://localhost:4000
  ▼
┌─────────────────────────────────┐
│  Control Center BFF (Node.js)   │
│  NestJS + Express               │
│  ├── OIDC auth via Keycloak     │
│  └── Proxies API calls ─────────┼──► http://localhost:8080
└─────────────────────────────────┘    (fluxnova-bpm-platform)

  When logging in:
  Browser ──redirect──► http://localhost:8180/realms/fluxnova (Keycloak)
  Keycloak ──callback──► http://localhost:4000/api/callback (BFF)
```

---

## Teardown

To stop and remove the Docker containers when you're done:

```bash
# Stop containers only (data is preserved)
docker compose stop

# Stop and remove containers + networks
docker compose down

# Stop and remove containers, networks, AND all volumes (wipes Keycloak DB)
docker compose down -v
```

---

## Troubleshooting

### "Invalid redirect URI" on Keycloak login

Ensure the **Valid redirect URIs** for the `fluxnova-control-center` client in Keycloak includes
`http://localhost:4000/*`. The `FXN_PUBLIC_URL` must match the origin you are accessing the app
from.

### OIDC token errors / 401 responses after login

Check that `FXN_OIDC_ISSUER`, `FXN_OIDC_AUTHORITY`, and the Keycloak realm name are all
consistent. A mismatch between the `issuer` claim in the Keycloak token and `FXN_OIDC_ISSUER`
will cause token validation to fail.

### Cannot connect to the Fluxnova engine

Verify the engine container is healthy:

```bash
docker compose ps
curl http://localhost:8080/engine-rest/engine
```

If the container has not started yet, wait a moment and try again, or inspect the logs:

```bash
docker compose logs fluxnova-engine
```

### Keycloak admin console is not reachable

Keycloak can take 20–30 seconds to start, especially on first launch. The healthcheck in
the Compose file polls every 10 seconds. Run `docker compose ps` until the service shows
`healthy`, then retry.

---

## References

- [Authentication configuration](../reference/authentication.md)
- [Configuration reference](../reference/configuration.md)
- [Getting Started](./getting-started.md)
- [Keycloak documentation](https://www.keycloak.org/docs/latest/)
- [fluxnova-bpm-platform repository](https://github.com/finos/fluxnova-bpm-platform)
