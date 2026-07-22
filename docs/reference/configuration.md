# Configuration

The application & associated test suites are configured via environment variables.

### Supported configuration variables

The following environment variables are available:

- `CI`
  - description:
    - Used by the end-to-end test suites to detect that it's running in a CI context. This is
      used to set the Playwright `reporter` configuration dynamically.
  - required?: no
- `FXN_CC_VERSION`
  - description: Version of the deployed Fluxnova Control Center application. Used in various contexts to display the
    version for diagnostic and informational purposes. E.g. in health-check responses.
  - required?: no
  - example: "1.0.0-b.42"
- `FXN_AUTH_STRATEGY`
  - description: Authentication strategy to use.
  - required?: yes
  - valid values: "oidc" | "none"
  - default: "none"
- `FXN_BASE_URL`
  - description: Base URL of the application. Only used by the end-to-end test suites.
  - required?: no
  - default: "http://localhost:4000"
- `FXN_COOKIE_KEYS`
  - description: Key(s) used for cookie signing. Accepts a csv of multiple keys to allow for
    key rotation, but at least one key must be provided.
  - required?: no, but STRONGLY RECOMMENDED
  - default: static, hard-coded value (not random, so not recommended)
- `FXN_CSRF_KEY`
  - description: Secret used for CSRF purposes. This should be a cryptographically
    pseudorandom generated value.
  - required?: no, but STRONGLY RECOMMENDED
  - default: static, hard-coded value (not random, so not recommended)
  - see also:
    - https://github.com/Psifi-Solutions/csrf-csrf/blob/30ac986e7077221c12a820a46c03da58129ff348/README.md#getsecret
- `FXN_DEPLOY_DATETIME`
  - description: The date & time indicating when the application was deployed. This is
    included in health check responses.
  - required?: no
  - example: "2025-08-29T17:26:36Z"
  - default: current date/time
- `FXN_ENGINE_HEADER_KEY`
  - description: Header key used to specify the target engine for the Fluxnova rest api. To be
    used when the Fluxnova Engine has been configured to use the `EngineHeaderServletFilter`
    and when using Multi Tenancy.
  - required?: no
  - default: "x-fxn-engine"
- `FXN_ENGINE_TENANT_RATIO`
  - description: Ratio of engine instances to tenants. Use for enabling tenancy, and
    corresponds to the supported Multi Tenancy models. If undefined, tenancy is not enabled.
  - valid
    values: "[one-to-one](https://docs.fluxnova.finos.org/user-guide/process-engine/multi-tenancy/#one-process-engine-per-tenant)" | "[one-to-many](https://docs.fluxnova.finos.org/user-guide/process-engine/multi-tenancy/#single-process-engine-with-tenant-identifiers)"
  - required?: no
  - see also:
    - https://docs.fluxnova.finos.org/user-guide/process-engine/multi-tenancy/
- `FXN_ENV`
  - description: Environment the application is deployed in. This value is used in a variety
    of contexts, including: finding secrets in the secrets provider, displaying in
    health-check responses, etc.
  - required?: no
  - default: "dev"
- `FXN_FORCE_HTTP`
  - description: Force the server to start in HTTP mode and skip TLS key/cert loading.
  - required?: no
  - valid values: "true" | "false"
  - default: unset (TLS path selection logic is used)
- `FXN_IDENTITY_HEADER_KEY`
  - description: Header for API requests that contains an authenticated user's identity token.
    Only used when FXN_AUTH_STRATEGY is set to "oidc".
  - required?: no
  - default: "x-fxn-identity-token"
- `FXN_LOG_LEVEL`
  - description: Specifies the minimum log level that will be enabled.
  - required?: no
  - valid values: "fatal" | "error" | "warn" | "info" | "debug" | "trace"
  - default: varies
  - see:
    - https://getpino.io/#/docs/api?id=logger-level
- `FXN_API_AUTH_ENABLED`
  - description: Whether to enable API authentication.
  - required?: no
  - valid values: "true" | "false"
  - default: "false"
- `FXN_API_AUTH_TOKEN_URL`
  - description: URL of the API management platform's auth token endpoint
  - required?: yes, if `FXN_API_AUTH_ENABLED` is "true"
- `FXN_API_AUTH_CLIENT_ID`
  - description: Client ID for authenticating with Fluxnova API.
  - required?: yes, if `FXN_API_AUTH_ENABLED` is "true"
- `FXN_API_AUTH_CLIENT_SECRET`
  - description: Client secret for authenticating with Fluxnova API.
  - required?: yes, if `FXN_API_AUTH_ENABLED` is "true"
- `FXN_API_AUTH_REQUEST_HEADER_NAME`
  - description: The name of the header to set the API auth token in.
  - required?: no
  - default: "Authorization"
- `FXN_OIDC_AUTHORITY`
  - description: The authority is the base URL of the OIDC provider
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
  - example: "https://login.microsoftonline.com/<REALM/TENANT>"
- `FXN_OIDC_AUTH_URL`
  - description: The URL to redirect to for authentication
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
  - example: "https://login.microsoftonline.com/<REALM/TENANT>/oauth2/v2.0/authorize"
- `FXN_OIDC_CLIENT_ID`
  - description: The client ID of the OIDC application.
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
- `FXN_OIDC_CLIENT_SECRET`
  - description: The client secret of the OIDC application.
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
- `FXN_OIDC_ISSUER`
  - description: The issuer URL of the OIDC provider
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
  - example: "https://login.microsoftonline.com/<REALM/TENANT>/v2.0"
- `FXN_OIDC_KNOWN_AUTHORITIES`
  - description: A comma-separated list of known authorities for the OIDC provider.
  - format: string containing comma-separated list of authorities
  - required?: no
  - default: value of `FXN_OIDC_AUTHORITY` environment variable.
- `FXN_OIDC_SCOPE`
  - description: List of OIDC scopes.
  - format: Comma-separated list of scopes.
  - required?: no
  - default: "openid,profile,email,offline_access"
- `FXN_OIDC_TOKEN_URL`
  - description: The URL to obtain the OIDC token from
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
  - example: "https://login.microsoftonline.com/<REALM/TENANT>/oauth2/v2.0/token"
- `FXN_OIDC_USERINFO_URL`
  - description: The URL to obtain the OIDC user info
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
  - example: "https://graph.microsoft.com/oidc/userinfo"
- `FXN_OTEL_DEBUG`
  - description: Whether to log exports to the console (either in Node or in the browser) for
    use in debugging
  - required?: no
  - valid values: "true" | "false"
  - default: "false"
- `FXN_OTEL_ENABLED`
  - description: Whether to enable Open Telemetry exporting
  - required?: no
  - valid values: "true" | "false"
  - default: "false"
- `FXN_OTEL_LOG_SPAN_ID_KEY`
  - description: A custom key to set on a log record that reflects the span id. This may be
    needed when using third party telemetry platforms.
  - required?: no
  - example: "key.path"
- `FXN_OTEL_LOG_TRACE_ID_KEY`
  - description: A custom key to set on a log record that reflects the trace id. This may be
    needed when using third party telemetry platforms.
  - required?: no
  - example: "key.path"
- `FXN_PUBLIC_URL`
  - description: Public URL of the application. Used as callback for OIDC auth.
  - required?: yes (when `FXN_AUTH_STRATEGY` is "oidc")
  - default: "http://localhost:4000/callback" (local dev URL)
- `FXN_REGION`
  - description: Region associated with the running application. This value is included in the
    response from the health check endpoint to allow differentiation between different
    instances of the app in different regions.
  - required?: no
  - default: "local"
- `FXN_REST_API_URL`
  - description: Base URL for the Fluxnova rest api or other contract conforming rest api used
    to access the appropriate Fluxnova engine.
  - required?: yes
- `FXN_SSL_CERT_PATH`
  - description: Filesystem path to the TLS certificate file used for HTTPS startup.
  - required?: no
  - default: "/certs/server.crt"
- `FXN_SSL_KEY_PASSPHRASE`
  - description: Passphrase for an encrypted TLS private key.
  - required?: no
  - default: unset
  - notes:
    - When set, this value takes precedence over `FXN_SSL_KEY_PASSPHRASE_FILE`.
- `FXN_SSL_KEY_PASSPHRASE_FILE`
  - description: Filesystem path to a file containing the TLS key passphrase.
  - required?: no
  - default: "/certs/SSL_KEYSTORE_PASSWORD"
  - notes:
    - Only used when `FXN_SSL_KEY_PASSPHRASE` is not set.
    - File contents are trimmed for whitespace before use.
- `FXN_SSL_KEY_PATH`
  - description: Filesystem path to the TLS private key file used for HTTPS startup.
  - required?: no
  - default: "/certs/server.key"
- `FXN_TEST_TENANT`
  - description: Engine identifier to use for e2e tests. When unset, the e2e tests will use the `default` engine.
  - required?: no
  - example: "my-process-engine"
- `HTTP_PROXY` / `http_proxy`
  - description: HTTP proxy URL
  - required?: no
- `HTTPS_PROXY` / `https_proxy`
  - description: HTTPS proxy URL
  - required?: no
- `NO_PROXY` / `no_proxy`
  - description: list of addresses or domains that should bypass the proxy configured with
    `HTTP_PROXY` / `HTTPS_PROXY`.
  - required?: no
- `NODE_ENV`
  - description: Environment the application is being deployed to
  - required?: no
  - valid values: "production" | "test" | "development"
- `OTEL_EXPORTER_OTLP_ENDPOINT`
  - description: A base endpoint URL for any signal type, with an optionally-specified port number.
    See [here](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/#otel_exporter_otlp_endpoint)
    for complete usage
  - required?: no
  - default: "http://localhost:4318"
- `OTEL_LOGS_EXPORTER`
  - description: Specifies which exporter is used for logs. Depending on the implementation it
    may be a comma-separated list.
    See [here](https://opentelemetry.io/docs/languages/sdk-configuration/general/#otel_logs_exporter)
    for complete usage
  - required?: no
  - default: "otlp"
- `OTEL_METRICS_EXPORTER`
  - description: Specifies which exporter is used for metrics. Depending on the implementation
    it may be a comma-separated list.
    See [here](https://opentelemetry.io/docs/languages/sdk-configuration/general/#otel_metrics_exporter)
    for complete usage
  - required?: no
  - default: "otlp"
- `OTEL_RESOURCE_ATTRIBUTES`
  - description: Key-value pairs to be used as resource attributes.
    See [here](https://opentelemetry.io/docs/languages/sdk-configuration/general/#otel_resource_attributes)
    for complete usage
  - required?: no
  - format: Comma-separated list of key-value pairs
  - example: "key1=value1,key2=value2"
- `OTEL_SERVICE_NAME`
  - description: Sets the value of the service.name telemetry resource attribute.
    See [here](https://opentelemetry.io/docs/languages/sdk-configuration/general/#otel_service_name)
    for complete usage
  - required?: no
  - default: "fluxnova"
- `OTEL_TRACES_EXPORTER`
  - description: Specifies which exporter is used for traces. Depending on the implementation
    it may be a comma-separated list.
    See [here](https://opentelemetry.io/docs/languages/sdk-configuration/general/#otel_traces_exporter)
    for complete usage
  - required?: no
  - default: "otlp"
- `SHARD_NUM`
  - description:
    - Used by the end-to-end test suites to set its `reporter` configuration when running in
      a CI context (see `CI` above)
  - required?: no
- `container`
  - description:
    - Used to determine whether the application is running inside a docker container. This
      is only currently used to determine whether the application is running locally (i.e.
      for local development). When running locally, this is expected to be empty, but when
      deployed, the value is expected to be "docker".
      When the application detects that it is running locally, certain features behave
      differently. For example:
      - TLS is not required when running locally. If the cert is not found at the expected
        location, HTTP will be used. In contrast, when not running locally, TLS is
        required and startup will fail if the cert is not found.
      - Logging configuration:
        - Certain log contents are redacted when not running locally.
        - Logs are formatted differently when running locally (since they are expected
          to be output to the console, rather than submitted to an external log server).
      - Static assets:
        - Caching is disabled when running locally.
        - Compression is disabled when running locally.
  - required?: no
  - example: "docker"

### Helper Scripts for Injecting Sensitive Environment Variables for LOCAL DEVELOPMENT

These environment variables can be set in a shell initialization file for local development, or can
be dynamically set at runtime (e.g. via a script that retrieves secrets from a vault and sets them
in the environment before starting the application).

There are 2 templates in the `./scripts/vault` directory that can be used to set secrets in the
environment from vault for local development:

- `agent-config.hcl.tpl`
- `agent-config.e2e.hcl.tpl`

These files need to be copied, modified, and saved to the same directory. See the comments in those
files for instructions on how to modify them. Once the files have been modified and saved, you will
then need to obtain a vault-token and then can use the following commands to start the application
and end-to-end test suites with secrets loaded from vault:

- `pnpm start:env`
- `pnpm e2e:env`

NOTE: In order to utilize this functionality, you will need to have HashiCorp Vault Agent installed
locally and have access to the Vault where the secrets are stored.

### Testing Support Secrets

The following environment variables are used to provide credentials for test accounts used by the
end-to-end test suites. These accounts are used to support various test scenarios, such as testing
different user roles and permissions.

- `FXN_DESIGNER_USR`
  - description: Username of a user with full write permissions. Only used testing and test-related
    data seeding.
  - required?:
    - application: no
    - end-to-end tests: yes
- `FXN_DESIGNER_PSW`
  - description: Password of the FXN_DESIGNER_USR account. Only used to seed data to support test
    suites.
  - required?:
    - application: no
    - end-to-end tests: yes
- `FXN_PLAT_READ_USR`
  - description: Username of a user with read-only permissions. Used by the end-to-end tests.
  - required?:
    - application: no
    - end-to-end tests: yes
- `FXN_PLAT_READ_PSW`
  - description: Password of the FXN_PLAT_READ_USR account. Used by the end-to-end tests.
  - required?:
    - application: no
    - end-to-end tests: yes
- `FXN_SUPPORT_USR`
  - description: Username of a user with write permissions, but without deployment creation permissions. Used by the end-to-end tests.
  - required?:
    - application: no
    - end-to-end tests: yes
- `FXN_SUPPORT_PSW`
  - description: Password of the FXN_SUPPORT_USR account. Used by the end-to-end tests.
  - required?:
    - application: no
    - end-to-end tests: yes
