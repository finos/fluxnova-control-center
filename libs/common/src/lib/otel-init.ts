import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export function initOpenTelemetry(config: OTELConfig) {
  const spanProcessors = [];

  if (config.debug) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  const baseUrl = window.document.baseURI;
  spanProcessors.push(
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        headers: {
          'x-xsrf-token': getXSRFToken() || '',
        },
        url: `${baseUrl}api/v1/traces`,
      }),
    ),
  );

  const provider = new WebTracerProvider({
    spanProcessors,
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      ...config.attributes,
    }),
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-xml-http-request': {
        propagateTraceHeaderCorsUrls: [/.+/g],
      },
      '@opentelemetry/instrumentation-fetch': {
        propagateTraceHeaderCorsUrls: [/.+/g],
      },
    }),
  });
}

function getXSRFToken() {
  return document.cookie
    .split('; ')
    .find((item) => item.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
}
