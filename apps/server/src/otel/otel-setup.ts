import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PinoInstrumentationConfig } from '@opentelemetry/instrumentation-pino';
import { OTEL_DEFAULT_SERVICE_NAME } from './otel-default-service-name';

let sdk: NodeSDK;

const headersToSpanAttributes = [
  'host',
  'x-forwarded-for',
  'origin',
  'logging-level',
  //TODO: Should we add the engine tenant here?
];

const staticAssetRegex = /^.*\.[a-z0-9]{2,5}$/i;
const otelUrls = ['/v1/traces', '/v1/metrics', '/v1/logs'];
const urlFilter = ['/liveness', '/health'];

if (process.env.FXN_OTEL_ENABLED === 'true') {
  // Note: Attributes are sourced from OTEL_* environment variables
  if (!process.env.OTEL_SERVICE_NAME) {
    process.env.OTEL_SERVICE_NAME = OTEL_DEFAULT_SERVICE_NAME;
  }
  let pinoInstrumentationConfig: PinoInstrumentationConfig | undefined;
  if (process.env.FXN_OTEL_LOG_TRACE_ID_KEY || process.env.FXN_OTEL_LOG_SPAN_ID_KEY) {
    // Set custom keys on log records to enable log/trace coordination in telemetry services (e.g. Datadog).
    pinoInstrumentationConfig = {
      logHook: (span, record) => {
        if (process.env.FXN_OTEL_LOG_TRACE_ID_KEY) {
          record[process.env.FXN_OTEL_LOG_TRACE_ID_KEY] = span.spanContext().traceId;
        }
        if (process.env.FXN_OTEL_LOG_SPAN_ID_KEY) {
          record[process.env.FXN_OTEL_LOG_SPAN_ID_KEY] = span.spanContext().spanId;
        }
      },
    };
  }
  sdk = new NodeSDK({
    instrumentations: getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        headersToSpanAttributes: {
          client: { requestHeaders: headersToSpanAttributes, responseHeaders: headersToSpanAttributes },
          server: { requestHeaders: headersToSpanAttributes, responseHeaders: headersToSpanAttributes },
        },
        ignoreIncomingRequestHook: (req) =>
          !!req.url?.match(staticAssetRegex) ||
          urlFilter.concat(otelUrls).some((filteredUrl) => req.url?.includes(filteredUrl)),
        ignoreOutgoingRequestHook: (req) => otelUrls.some((otelUrl) => req.path?.includes(otelUrl)),
      },
      '@opentelemetry/instrumentation-express': {
        requestHook: (span, info) => span.setAttribute('userId', info.request?.session?.user?.id),
      },
      '@opentelemetry/instrumentation-pino': pinoInstrumentationConfig,
    }),
  });
  sdk.start();
}
