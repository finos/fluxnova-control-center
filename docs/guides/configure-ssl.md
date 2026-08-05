# Configure SSL for Server Startup

This guide explains how TLS/SSL is selected when the server starts, and how to configure each supported scenario.

The startup logic supports both HTTPS and HTTP. In deployed environments, TLS is required. In local development, the server can fall back to HTTP if certificates are missing.

## Prerequisites

- Access to set environment variables for the server process
- A certificate (`.crt`/`.pem`) and private key (`.key`/`.pem`) if you want HTTPS
- For encrypted private keys, either:
  - the key passphrase as an environment variable, or
  - a mounted file containing the passphrase

## How SSL Selection Works

At startup, the server follows this order:

1. If `FXN_FORCE_HTTP` is set, start HTTP.
2. Otherwise, read key/cert from configured paths.
3. If key/cert are found, start HTTPS.
4. If key/cert are missing:
   - running locally: log and fall back to HTTP
   - not running locally: fail startup

Environment detection for "running locally" is based on:

- `process.env.container !== 'docker'`, or
- `NODE_ENV === 'test'`

## Scenario 1: Local Development Without Certificates (HTTP Fallback)

Use this when you are developing locally and do not want to provision local certificates.

```bash
unset FXN_SSL_KEY_PATH
unset FXN_SSL_CERT_PATH
unset FXN_SSL_KEY_PASSPHRASE
unset FXN_SSL_KEY_PASSPHRASE_FILE
```

Expected behavior:

- If `/certs/server.key` and `/certs/server.crt` are missing, startup continues on HTTP.

## Scenario 2: Local Development With HTTPS Using Default `/certs` Paths

Use this when local TLS is desired and certs are mounted at the default paths.

```bash
unset FXN_SSL_KEY_PATH
unset FXN_SSL_CERT_PATH
unset FXN_SSL_KEY_PASSPHRASE
unset FXN_SSL_KEY_PASSPHRASE_FILE
```

Place files at:

- `/certs/server.key`
- `/certs/server.crt`

Optional passphrase file path (default):

- `/certs/SSL_KEYSTORE_PASSWORD`

Expected behavior:

- Server starts HTTPS using key/cert from `/certs`.
- If the passphrase file exists, its trimmed contents are used.

## Scenario 3: HTTPS With Custom Key/Cert Paths

Use this when certificates are mounted somewhere other than `/certs`.

```bash
export FXN_SSL_KEY_PATH="/run/secrets/tls/server.key"
export FXN_SSL_CERT_PATH="/run/secrets/tls/server.crt"
```

Expected behavior:

- Server reads certs from the custom paths and starts HTTPS.

## Scenario 4: Encrypted Key With Passphrase in Environment Variable

Use this when your secret manager injects passphrase directly as an env var.

```bash
export FXN_SSL_KEY_PATH="/run/secrets/tls/server.key"
export FXN_SSL_CERT_PATH="/run/secrets/tls/server.crt"
export FXN_SSL_KEY_PASSPHRASE="<your-passphrase>"
```

Expected behavior:

- HTTPS starts with the provided passphrase.
- `FXN_SSL_KEY_PASSPHRASE` takes precedence over any passphrase file.

## Scenario 5: Encrypted Key With Passphrase in File

Use this when passphrase is mounted as a secret file.

```bash
export FXN_SSL_KEY_PATH="/run/secrets/tls/server.key"
export FXN_SSL_CERT_PATH="/run/secrets/tls/server.crt"
export FXN_SSL_KEY_PASSPHRASE_FILE="/run/secrets/tls/key-passphrase"
unset FXN_SSL_KEY_PASSPHRASE
```

Expected behavior:

- Server reads passphrase from `FXN_SSL_KEY_PASSPHRASE_FILE`.
- File contents are trimmed before use.

## Scenario 6: Deployed Environment (TLS Required)

Use this for containerized/deployed runtime where TLS must not silently downgrade.

```bash
export container="docker"
export FXN_SSL_KEY_PATH="/run/secrets/tls/server.key"
export FXN_SSL_CERT_PATH="/run/secrets/tls/server.crt"
```

Expected behavior:

- If key/cert are unreadable or missing, startup fails with an SSL cert/key error.
- No fallback to HTTP.

## Scenario 7: Force HTTP Explicitly

Use this for temporary troubleshooting or trusted local-only environments. Helpful for running / troubleshooting the application locally via docker

```bash
export FXN_FORCE_HTTP="true"
```

Expected behavior:

- Server starts HTTP and skips TLS key/cert loading.

## Troubleshooting

- If HTTPS setup fails with decryption errors, verify key passphrase value or file.
- If startup unexpectedly falls back to HTTP, verify `container` is set to `docker` in deployed environments.
- If startup unexpectedly fails on SSL locally, verify environment variables are not pointing to invalid paths.
- If startup fails with self signed certificate errors, ensure the client trusts the certificate or disable strict TLS checks in development, by setting `NODE_TLS_REJECT_UNAUTHORIZED=0` in the client environment.

## References

- `apps/server/src/start-server.ts`
- `apps/server/src/common/is-running-locally.ts`
- `apps/server/src/start-server.spec.ts`
- [Configuration Reference](../reference/configuration.md)
- [Getting Started](./getting-started.md)
