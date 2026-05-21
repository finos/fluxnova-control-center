import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Instrumentation } from '@opentelemetry/instrumentation';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMockCallArgumentReference } from '@fxn/test-support/src/lib/get-mock-call-argument-reference.ts';
import { OTEL_DEFAULT_SERVICE_NAME } from './otel-default-service-name';

vi.mock('@opentelemetry/auto-instrumentations-node');
vi.mock('@opentelemetry/instrumentation-pino');

let nodeSdkStarted = false;

const mockedNodeSDK = vi.fn(
  class {
    mockReturnValueOnce = vi.fn();
    start = vi.fn(() => {
      nodeSdkStarted = true;
    });
  },
);

// doMock used instead of mock so that it wouldn't be hoisted to the top
vi.doMock('@opentelemetry/sdk-node', () => ({
  NodeSDK: mockedNodeSDK,
}));

const mockGetNodeAutoInstrumentations = vi.mocked(getNodeAutoInstrumentations);

const expectedHeadersToSpanAttributes = ['host', 'x-forwarded-for', 'origin', 'logging-level'];

describe('otel-setup', () => {
  const mockInstrumentations: Instrumentation[] = [];

  beforeEach(() => {
    vi.resetModules();

    delete process.env.FXN_OTEL_ENABLED;
    delete process.env.OTEL_SERVICE_NAME;
    delete process.env.FXN_OTEL_LOG_TRACE_ID_KEY;
    delete process.env.FXN_OTEL_LOG_SPAN_ID_KEY;

    mockGetNodeAutoInstrumentations.mockReturnValueOnce(mockInstrumentations);
  });

  afterEach(() => {
    vi.resetAllMocks();
    nodeSdkStarted = false;
  });

  it.each(['false', undefined, ''])(
    'should not initialize OpenTelemetry if FXN_OTEL_ENABLED is not "true". Test value: %p',
    async (value) => {
      process.env.FXN_OTEL_ENABLED = value;

      await import('./otel-setup');

      expect(mockedNodeSDK).not.toHaveBeenCalled();
    },
  );

  it('should not initialize OpenTelemetry if FXN_OTEL_ENABLED is missing', async () => {
    delete process.env.FXN_OTEL_ENABLED;

    await import('./otel-setup');

    expect(mockedNodeSDK).not.toHaveBeenCalled();
  });

  it('should initialize OpenTelemetry based on environment values', async () => {
    process.env.FXN_OTEL_ENABLED = 'true';

    await import('./otel-setup');

    const mockNodeSdkCallArg = getMockCallArgumentReference(mockedNodeSDK);

    expect(mockGetNodeAutoInstrumentations).toHaveBeenCalledWith({
      '@opentelemetry/instrumentation-http': {
        headersToSpanAttributes: {
          client: { requestHeaders: expectedHeadersToSpanAttributes, responseHeaders: expectedHeadersToSpanAttributes },
          server: { requestHeaders: expectedHeadersToSpanAttributes, responseHeaders: expectedHeadersToSpanAttributes },
        },
        ignoreIncomingRequestHook: expect.any(Function),
        ignoreOutgoingRequestHook: expect.any(Function),
      },
      '@opentelemetry/instrumentation-express': {
        requestHook: expect.any(Function),
      },
      '@opentelemetry/instrumentation-pino': undefined,
    });
    expect(mockNodeSdkCallArg.instrumentations).toBe(mockInstrumentations);
    expect(nodeSdkStarted).toBe(true);
  });

  it('should add pino instrumentation if log trace and span ID key env variables are set', async () => {
    process.env.FXN_OTEL_ENABLED = 'true';
    process.env.FXN_OTEL_LOG_TRACE_ID_KEY = 'traceId';
    process.env.FXN_OTEL_LOG_SPAN_ID_KEY = 'spanId';

    await import('./otel-setup');

    expect(mockGetNodeAutoInstrumentations).toHaveBeenCalledWith({
      '@opentelemetry/instrumentation-http': {
        headersToSpanAttributes: {
          client: { requestHeaders: expectedHeadersToSpanAttributes, responseHeaders: expectedHeadersToSpanAttributes },
          server: { requestHeaders: expectedHeadersToSpanAttributes, responseHeaders: expectedHeadersToSpanAttributes },
        },
        ignoreIncomingRequestHook: expect.any(Function),
        ignoreOutgoingRequestHook: expect.any(Function),
      },
      '@opentelemetry/instrumentation-express': {
        requestHook: expect.any(Function),
      },
      '@opentelemetry/instrumentation-pino': {
        logHook: expect.any(Function),
      },
    });
  });

  it('should set the OTEL_SERVICE_NAME to a default value if not provided', async () => {
    process.env.FXN_OTEL_ENABLED = 'true';

    await import('./otel-setup');

    expect(process.env.OTEL_SERVICE_NAME).toBe(OTEL_DEFAULT_SERVICE_NAME);
  });

  describe('http instrumentation ignoreIncomingRequestHook', () => {
    let ignoreIncomingRequestHook: (req: { url: string }) => boolean;

    beforeEach(async () => {
      process.env.FXN_OTEL_ENABLED = 'true';
      await import('./otel-setup');
      ignoreIncomingRequestHook = getMockCallArgumentReference(mockGetNodeAutoInstrumentations)[
        '@opentelemetry/instrumentation-http'
      ].ignoreIncomingRequestHook;
    });

    it('should return "true" for requests for static assets', () => {
      expect(ignoreIncomingRequestHook({ url: 'test.com/image.png' })).toBe(true);
      expect(ignoreIncomingRequestHook({ url: 'test.com/styles.css' })).toBe(true);
      expect(ignoreIncomingRequestHook({ url: 'test.com/script.js' })).toBe(true);
    });

    it('should return "true" for requests for filtered urls', () => {
      expect(ignoreIncomingRequestHook({ url: 'test.com/liveness' })).toBe(true);
      expect(ignoreIncomingRequestHook({ url: 'test.com/health' })).toBe(true);
      expect(ignoreIncomingRequestHook({ url: 'test.com/v1/traces' })).toBe(true);
      expect(ignoreIncomingRequestHook({ url: 'test.com/v1/metrics' })).toBe(true);
      expect(ignoreIncomingRequestHook({ url: 'test.com/v1/logs' })).toBe(true);
    });

    it('should return "false" for other requests', () => {
      expect(ignoreIncomingRequestHook({ url: 'test.com/process-instances' })).toBe(false);
      expect(ignoreIncomingRequestHook({ url: 'test.com/' })).toBe(false);
      expect(ignoreIncomingRequestHook({ url: 'test.com/some-other-endpoint' })).toBe(false);
    });
  });

  describe('http instrumentation ignoreOutgoingRequestHook', () => {
    let ignoreOutgoingRequestHook: (req: { path: string }) => boolean;

    beforeAll(async () => {
      vi.resetModules();

      process.env.FXN_OTEL_ENABLED = 'true';

      await import('./otel-setup');

      ignoreOutgoingRequestHook = getMockCallArgumentReference(mockGetNodeAutoInstrumentations)[
        '@opentelemetry/instrumentation-http'
      ].ignoreOutgoingRequestHook;
    });

    it('should return "true" for requests for filtered urls', () => {
      expect(ignoreOutgoingRequestHook({ path: 'test.com/v1/traces' })).toBe(true);
      expect(ignoreOutgoingRequestHook({ path: 'test.com/v1/metrics' })).toBe(true);
      expect(ignoreOutgoingRequestHook({ path: 'test.com/v1/logs' })).toBe(true);
    });

    it('should return "false" for other requests', () => {
      expect(ignoreOutgoingRequestHook({ path: 'test.com/process-instances' })).toBe(false);
      expect(ignoreOutgoingRequestHook({ path: 'test.com/some-other-endpoint' })).toBe(false);
    });
  });

  describe('express instrumentation requestHook', () => {
    let requestHook: (span: object, info: object) => boolean;

    beforeAll(async () => {
      process.env.FXN_OTEL_ENABLED = 'true';
      await import('./otel-setup');
      requestHook = getMockCallArgumentReference(mockGetNodeAutoInstrumentations)[
        '@opentelemetry/instrumentation-express'
      ].requestHook;
    });

    it('should set the userId attribute on the span', () => {
      const span = { setAttribute: vi.fn() };
      const info = { request: { session: { user: { id: 'test-user-id' } } } };

      requestHook(span, info);

      expect(span.setAttribute).toHaveBeenCalledWith('userId', 'test-user-id');
    });
  });

  describe('pino instrumentation logHook', () => {
    let logHook: (span: object, info: object) => boolean;

    beforeAll(async () => {
      process.env.FXN_OTEL_ENABLED = 'true';
      process.env.FXN_OTEL_LOG_TRACE_ID_KEY = 'dd.traceId';
      process.env.FXN_OTEL_LOG_SPAN_ID_KEY = 'dd.spanId';
      await import('./otel-setup');
      logHook = getMockCallArgumentReference(mockGetNodeAutoInstrumentations)['@opentelemetry/instrumentation-pino']
        .logHook;
    });

    beforeEach(async () => {
      process.env.FXN_OTEL_LOG_TRACE_ID_KEY = 'dd.traceId';
      process.env.FXN_OTEL_LOG_SPAN_ID_KEY = 'dd.spanId';
    });

    it('should set the log record keys to the correct values', () => {
      const record: Record<string, string> = {};
      const span = { spanContext: () => ({ traceId: 'test-trace-id', spanId: 'test-span-id' }) };

      logHook(span, record);

      expect(record['dd.traceId']).toBe('test-trace-id');
      expect(record['dd.spanId']).toBe('test-span-id');
    });
  });
});
