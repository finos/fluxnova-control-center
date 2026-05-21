# Fluxnova Control Center — Tech Stack

**Document Type:** Reference
**Date:** May 6, 2026

---

## Overview

The Fluxnova Control Center is a full-stack web application built as an **Nx monorepo** using **pnpm** workspaces. It is composed of two primary runtime applications — an Angular single-page application (SPA) served by a Node.js BFF (Backend-for-Frontend) — along with a suite of shared libraries and an end-to-end test suite. The application is containerised via Docker for deployment.

---

## Repository Structure

```
fluxnova-control-center/
├── apps/
│   ├── frontend/        # Angular SPA
│   ├── server/          # NestJS / Express BFF
│   └── e2e/             # Playwright test suite
├── libs/
│   ├── common/          # Shared Angular utilities
│   ├── grid/            # AG Grid wrappers
│   ├── process-modification/
│   ├── shared-assets/
│   ├── test-support/
│   └── types/           # Shared TypeScript types
└── scripts/             # Build/dev helper scripts
```

---

## Monorepo Tooling

| Tool                                                      | Version     | Purpose                                           |
| --------------------------------------------------------- | ----------- | ------------------------------------------------- |
| [Nx](https://nx.dev)                                      | 22.1.0      | Monorepo orchestration, build graph, task caching |
| [pnpm](https://pnpm.io)                                   | (workspace) | Package management (enforced via `preinstall`)    |
| [TypeScript](https://www.typescriptlang.org)              | ^5.9        | Primary language across all projects              |
| [Prettier](https://prettier.io)                           | 3.8.3       | Code formatting                                   |
| [ESLint](https://eslint.org)                              | ^9.28       | Linting (`@angular-eslint`, `typescript-eslint`)  |
| [Husky](https://typicode.github.io/husky)                 | 9.1.7       | Git hooks                                         |
| [lint-staged](https://github.com/lint-staged/lint-staged) | ^16.2       | Pre-commit formatting enforcement                 |

---

## Frontend (`apps/frontend`)

### Framework & Core

| Library                                       | Version | Purpose                                                   |
| --------------------------------------------- | ------- | --------------------------------------------------------- |
| [Angular](https://angular.dev)                | 20.3.x  | Primary UI framework                                      |
| [RxJS](https://rxjs.dev)                      | ~7.8    | Reactive programming / async data streams                 |
| [NgRx Component](https://ngrx.io)             | 20.1.0  | Reactive component utilities (`ngrxPush`, `LetDirective`) |
| [Zone.js](https://github.com/angular/zone.js) | ^0.16   | Angular change-detection integration                      |

### UI Components & Styling

| Library                                                                               | Version | Purpose                                    |
| ------------------------------------------------------------------------------------- | ------- | ------------------------------------------ |
| [Bootstrap](https://getbootstrap.com)                                                 | ^5.3    | CSS framework                              |
| [ng-bootstrap](https://ng-bootstrap.github.io)                                        | ^19.0   | Bootstrap Angular components               |
| [@ng-select/ng-select](https://github.com/ng-select/ng-select)                        | ^20.7   | Searchable select / multi-select           |
| [angular-split](https://angular-split.github.io)                                      | ^20.0   | Resizable split panels                     |
| [angular-resizable-element](https://github.com/mattlewis92/angular-resizable-element) | ^8.0    | Resizable UI elements                      |
| SCSS                                                                                  | —       | Component styles (default generator style) |

### Data Visualisation & Process Modelling

| Library                                                                                             | Version     | Purpose                                                             |
| --------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| [AG Grid](https://www.ag-grid.com)                                                                  | ~34.3       | High-performance data grid (`ag-grid-angular`, `ag-grid-community`) |
| [bpmn-js](https://bpmn.io/toolkit/bpmn-js/)                                                         | ^18.12      | BPMN 2.0 process diagram viewer/editor                              |
| [dmn-js](https://bpmn.io/toolkit/dmn-js/)                                                           | ^17.6       | DMN decision table viewer/editor                                    |
| [diagram-js](https://github.com/bpmn-io/diagram-js)                                                 | ^15.9       | Underlying diagramming toolkit                                      |
| [ApexCharts](https://apexcharts.com) / [ng-apexcharts](https://github.com/apexcharts/ng-apexcharts) | ^5.2 / ^2.0 | Charts and graphs                                                   |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/)                                         | ^0.55       | In-browser code editor                                              |
| [visual-heatmap](https://github.com/nswamy14/visual-heatmap)                                        | ^2.2        | Heatmap visualisations                                              |

### Build

| Tool                                                                                  | Purpose                                                    |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Angular CLI](https://angular.dev/tools/cli) / `@angular-devkit/build-angular`        | Primary build pipeline                                     |
| [Webpack 5](https://webpack.js.org)                                                   | Bundler (with custom config via `extra-webpack.config.ts`) |
| [Rspack](https://rspack.dev)                                                          | High-performance Rust-based bundler (`@rspack/core`)       |
| [gzipper](https://github.com/gios/gzipper)                                            | Post-build Brotli + Gzip compression of static assets      |
| [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) | Bundle size analysis                                       |

---

## Backend BFF (`apps/server`)

The server is a **Backend-for-Frontend** that proxies requests to the Fluxnova REST API, handles authentication, serves the Angular SPA static assets, and provides telemetry.

### Framework & Core

| Library                                                                 | Version      | Purpose                                           |
| ----------------------------------------------------------------------- | ------------ | ------------------------------------------------- |
| [NestJS](https://nestjs.com)                                            | ^11.1        | Server-side application framework                 |
| [Express](https://expressjs.com)                                        | 5.2.1        | Underlying HTTP server                            |
| [express-static-gzip](https://github.com/tkoenig89/express-static-gzip) | ^3.0         | Serves pre-compressed static assets (Brotli/Gzip) |
| [Axios](https://axios-http.com) / `@nestjs/axios`                       | ^1.15 / ^4.0 | HTTP client for upstream API calls                |
| [rxjs](https://rxjs.dev)                                                | ~7.8         | Used within NestJS service layer                  |

### Authentication & Security

| Library                                                                                | Purpose                                                        |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [@azure/msal-node](https://github.com/AzureAD/microsoft-authentication-library-for-js) | OIDC / OAuth 2.0 flows (Azure Entra ID / other OIDC providers) |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)                             | JWT verification                                               |
| [client-oauth2](https://github.com/mulesoft/js-client-oauth2)                          | OAuth 2.0 client credential flows for API auth                 |
| [csrf-csrf](https://github.com/Psifi-Solutions/csrf-csrf)                              | CSRF protection (Double Submit Cookie pattern)                 |
| [cookie-session](https://github.com/expressjs/cookie-session)                          | Signed cookie-based sessions                                   |
| [cookie-parser](https://github.com/expressjs/cookie-parser)                            | Cookie parsing middleware                                      |

**Auth Strategies (runtime-configurable):**

- `none` — No UI authentication (default, mirrors Fluxnova Engine default)
- `oidc` — OpenID Connect SSO via configurable OIDC provider (e.g. Azure AD / Entra ID)

See [Authentication](./authentication.md) for full details.

### Logging

| Library                                                                       | Purpose                                             |
| ----------------------------------------------------------------------------- | --------------------------------------------------- |
| [Pino](https://getpino.io) / [pino-http](https://github.com/pinojs/pino-http) | Structured JSON logging                             |
| [nestjs-pino](https://github.com/iamolegga/nestjs-pino)                       | NestJS Pino integration                             |
| [pino-pretty](https://github.com/pinojs/pino-pretty)                          | Human-readable log formatting for local development |

Logs are redacted and formatted differently between local development and production environments.

### Caching

| Library                                                | Purpose                       |
| ------------------------------------------------------ | ----------------------------- |
| [node-cache](https://github.com/node-cache/node-cache) | In-memory server-side caching |

### Build

| Tool                                | Purpose                                           |
| ----------------------------------- | ------------------------------------------------- |
| [Webpack 5](https://webpack.js.org) | Server bundle (with `webpack-node-externals`)     |
| `@module-federation/node`           | Module Federation support for the Node.js runtime |

---

## Observability

Both the **frontend** and **server** are instrumented with [OpenTelemetry](https://opentelemetry.io), providing traces, metrics, and logs.

| Package                                     | Purpose                                |
| ------------------------------------------- | -------------------------------------- |
| `@opentelemetry/sdk-node`                   | Server-side OTel SDK                   |
| `@opentelemetry/sdk-trace-web`              | Browser-side trace SDK                 |
| `@opentelemetry/auto-instrumentations-node` | Auto-instrumentation for Node.js       |
| `@opentelemetry/auto-instrumentations-web`  | Auto-instrumentation for the browser   |
| `@opentelemetry/exporter-trace-otlp-http`   | OTLP HTTP trace exporter               |
| `@opentelemetry/sdk-metrics`                | Metrics SDK                            |
| `@opentelemetry/instrumentation-pino`       | Pino log correlation (trace/span IDs)  |
| `@opentelemetry/context-zone`               | Zone.js context propagation in Angular |

> Browser telemetry is **proxied through the BFF server** to the configured OTLP endpoint, rather than being sent directly from the browser.

Observability is opt-in and controlled via environment variables (`FXN_OTEL_ENABLED`, `OTEL_EXPORTER_OTLP_ENDPOINT`, etc.).

See [Observability](./observability.md) for full details.

---

## Testing

### Unit & Integration Tests

| Tool                                                                                                                             | Version      | Purpose                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------- |
| [Vitest](https://vitest.dev)                                                                                                     | ^4.0         | Unit test runner (replaces Jest across libs) |
| [jsdom](https://github.com/jsdom/jsdom)                                                                                          | 27.4.0       | DOM simulation environment                   |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage)                                                                         | 4.1.5        | Code coverage (V8)                           |
| [@vitest/coverage-istanbul](https://vitest.dev/guide/coverage)                                                                   | ^4.0         | Code coverage (Istanbul)                     |
| [jasmine-marbles](https://github.com/synapse-wireless/jasmine-marbles) / [rxjs-marbles](https://github.com/cartant/rxjs-marbles) | 0.9.2 / ^7.0 | Marble testing for RxJS observables          |
| [@nestjs/testing](https://docs.nestjs.com/fundamentals/testing)                                                                  | ^11.1        | NestJS unit/integration test utilities       |

### End-to-End Tests

| Tool                                 | Version | Purpose                          |
| ------------------------------------ | ------- | -------------------------------- |
| [Playwright](https://playwright.dev) | ^1.56   | Browser-based E2E test framework |
| `@nx/playwright`                     | 22.1.0  | Nx Playwright integration        |

The E2E suite runs three project profiles:

- **`e2e`** — Full integration tests against a live Fluxnova Engine
- **`me2e`** (mocked E2E) — Tests against a mocked API layer
- **`regression`** — Regression suite with automatic retries (2)

---

## Infrastructure & Deployment

| Technology                              | Purpose                                               |
| --------------------------------------- | ----------------------------------------------------- |
| [Docker](https://www.docker.com)        | Container image (Alpine 3 base, non-root `node` user) |
| [Alpine Linux](https://alpinelinux.org) | Minimal base OS image                                 |
| [Node.js](https://nodejs.org)           | Runtime for the BFF server (installed via `apk`)      |
| Port `4000`                             | Exposed application port                              |

### Secrets Management

[HashiCorp Vault](https://www.vaultproject.io) can be used for secrets management in local development. Vault Agent configuration templates are provided in `scripts/vault/` for injecting secrets as environment variables at runtime.

---

## API Client Generation

The Fluxnova API TypeScript client is auto-generated from an OpenAPI spec using [`@openapitools/openapi-generator-cli`](https://openapi-generator.tech). The generation script is located at `scripts/generate-fluxnova-client.sh`.

See [Fluxnova API Client Generation](./fluxnova-api-client-generation.md) for full details.

---

## Key Environment Variables (Runtime Configuration)

The application is entirely configured through environment variables. Key categories include:

| Category       | Variables                                             |
| -------------- | ----------------------------------------------------- |
| Auth strategy  | `FXN_AUTH_STRATEGY`, `FXN_OIDC_*`                     |
| API connection | `FXN_REST_API_URL`, `FXN_ENGINE_*`                    |
| Observability  | `FXN_OTEL_ENABLED`, `OTEL_*`                          |
| Security       | `FXN_COOKIE_KEYS`, `FXN_CSRF_KEY`                     |
| Deployment     | `FXN_ENV`, `FXN_REGION`, `FXN_CC_VERSION`, `NODE_ENV` |
| Proxy          | `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`               |

See [Configuration](./configuration.md) for the full reference.

---

## Summary Diagram

```
┌─────────────────────────────────────────┐
│              Browser                    │
│  Angular 20 SPA                         │
│  ├── Bootstrap 5 / ng-bootstrap         │
│  ├── AG Grid 34                         │
│  ├── bpmn-js / dmn-js                   │
│  ├── Monaco Editor                      │
│  ├── ApexCharts                         │
│  └── OpenTelemetry (browser)            │
└────────────────┬────────────────────────┘
                 │ HTTP(S)
┌────────────────▼────────────────────────┐
│        BFF Server (Node.js)             │
│  NestJS 11 + Express 5                  │
│  ├── OIDC Auth (MSAL / client-oauth2)   │
│  ├── CSRF + Cookie Sessions             │
│  ├── Pino Structured Logging            │
│  ├── Static Asset Serving (Brotli/Gzip) │
│  ├── OTel Proxy → OTLP Endpoint         │
│  └── OpenTelemetry (Node)               │
└────────────────┬────────────────────────┘
                 │ HTTP
     ┌───────────▼────────────┐
     │  Fluxnova BPM Engine   │
     │  (REST API)            │
     └────────────────────────┘
```
