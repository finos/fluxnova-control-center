# Observability

Fluxnova is configured to use Open Telemetry for observability in the browser and in its server
layer.

### Setup

The following environment variables are available to configure observability. For full details,
see [Configuration](./configuration.md#supported-configuration-variables) documentation.

- `FXN_OTEL_ENABLED`
  - Enable Open Telemetry exporting
  - Default: false
- `FXN_OTEL_DEBUG`
  - Whether to log exports to the console (either in Node or in the browser) for use in debugging
  - Default: false
- `FXN_OTEL_LOG_TRACE_ID_KEY`
  - A custom key to set on a log record that reflects the trace id. This may be needed when using
    third party telemetry platforms.
- `FXN_OTEL_LOG_SPAN_ID_KEY`
  - A custom key to set on a log record that reflects the span id. This may be
    needed when using third party telemetry platforms.

The application uses auto instrumentation to set up telemetry. To configure this instrumentation,
you can use the following environment variables as specified by Open Telemetry. More information on
their usage can be found in
the [OpenTelemetry SDK Configuration](https://opentelemetry.io/docs/languages/sdk-configuration/)
documentation:

- `OTEL_SERVICE_NAME`
  - Sets the value of the service.name resource attribute.
  - Default: "fluxnova"
- `OTEL_RESOURCE_ATTRIBUTES`
  - Key-value pairs to be used as resource attributes.
  - Example: "key1=value1,key2=value2"
- `OTEL_EXPORTER_OTLP_ENDPOINT`
  - A base endpoint URL for any signal type, with an optionally-specified port number.
  - Default: "http://localhost:4318"
- `OTEL_TRACES_EXPORTER`
  - Specifies which exporter is used for traces.
  - Default: "otlp"
- `OTEL_METRICS_EXPORTER`
  - Specifies which exporter is used for metrics.
  - Default: "otlp"
- `OTEL_LOGS_EXPORTER`
  - Specifies which exporter is used for logs.
  - Default: "otlp"

NOTE: Browser telemetry data is proxied by the server to the `OTEL_EXPORTER_OTLP_ENDPOINT`, not sent
directly to that endpoint.
