import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Instrumentation, registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource, resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getMockCallArgumentReference } from '@fxn/test-support';
import { initOpenTelemetry } from './otel-init';

vi.mock('@opentelemetry/auto-instrumentations-web');
vi.mock('@opentelemetry/context-zone');
vi.mock('@opentelemetry/exporter-trace-otlp-http');
vi.mock('@opentelemetry/instrumentation');
vi.mock('@opentelemetry/resources');
vi.mock('@opentelemetry/sdk-trace-web');
vi.mock('@opentelemetry/sdk-trace-base');
vi.mock('@opentelemetry/semantic-conventions');

const mockGetWebAutoInstrumentations = vi.mocked(getWebAutoInstrumentations);
const mockZoneContextManager = vi.mocked(ZoneContextManager);
const mockOTLPTraceExporter = vi.mocked(OTLPTraceExporter);
const mockRegisterInstrumentations = vi.mocked(registerInstrumentations);
const mockResourceFromAttributes = vi.mocked(resourceFromAttributes);
const mockBatchSpanProcessor = vi.mocked(BatchSpanProcessor);
const mockWebTracerProvider = vi.mocked(WebTracerProvider);
const mockConsoleSpanExporter = vi.mocked(ConsoleSpanExporter);
const mockSimpleSpanProcessor = vi.mocked(SimpleSpanProcessor);

describe('otel-init', () => {
  const mockSimpleSpanProcessorInstance = {};
  const mockConsoleSpanExporterInstance = {};
  const mockOltpTraceExporterInstance = {};
  const mockBatchSpanProcessorInstance = {};
  const mockResourceInstance = {};
  const mockWebTracerProviderInstance = { register: vi.fn() };
  const mockZoneContextManagerInstance = {};
  const mockInstrumentations: Instrumentation[] = [];

  beforeEach(() => {
    mockSimpleSpanProcessor.mockImplementation(function () {
      return mockSimpleSpanProcessorInstance as SimpleSpanProcessor;
    });
    mockConsoleSpanExporter.mockImplementation(function () {
      return mockConsoleSpanExporterInstance as ConsoleSpanExporter;
    });
    mockOTLPTraceExporter.mockImplementation(function () {
      return mockOltpTraceExporterInstance as OTLPTraceExporter;
    });
    mockBatchSpanProcessor.mockImplementation(function () {
      return mockBatchSpanProcessorInstance as BatchSpanProcessor;
    });
    mockWebTracerProvider.mockImplementation(function () {
      return mockWebTracerProviderInstance as unknown as WebTracerProvider;
    });
    mockZoneContextManager.mockImplementation(function () {
      return mockZoneContextManagerInstance as ZoneContextManager;
    });
    mockResourceFromAttributes.mockReturnValue(mockResourceInstance as Resource);
    mockGetWebAutoInstrumentations.mockReturnValue(mockInstrumentations);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should correctly create the exporters, processors, providers, managers, and instrumentations', () => {
    const baseURI = 'http://test:123/';
    const config = {
      attributes: { foo: 'bar', baz: 'qux' },
      serviceName: 'test-service-name',
      debug: false,
      enabled: true,
    };
    Object.defineProperty(window.document, 'baseURI', {
      value: baseURI,
      writable: false,
    });
    Object.defineProperty(window.document, 'cookie', {
      value: 'XSRF-TOKEN=test-xsrf-token',
      writable: false,
    });

    initOpenTelemetry(config);

    const mockBatchSpanProcessorCallArg = getMockCallArgumentReference(mockBatchSpanProcessor);
    const mockWebTracerProviderCallArg = getMockCallArgumentReference(mockWebTracerProvider);
    const mockWebTracerProviderRegisterCallArg = getMockCallArgumentReference(mockWebTracerProviderInstance.register);
    const mockRegisterInstrumentationsCallArg = getMockCallArgumentReference(mockRegisterInstrumentations);

    expect(mockOTLPTraceExporter).toHaveBeenCalledWith({
      headers: { 'x-xsrf-token': 'test-xsrf-token' },
      url: 'http://test:123/api/v1/traces',
    });
    expect(mockBatchSpanProcessorCallArg).toBe(mockOltpTraceExporterInstance);
    expect(mockResourceFromAttributes).toHaveBeenCalledWith({
      [ATTR_SERVICE_NAME]: config.serviceName,
      ...config.attributes,
    });
    expect(mockWebTracerProviderCallArg.spanProcessors[0]).toBe(mockBatchSpanProcessorInstance);
    expect(mockWebTracerProviderCallArg.resource).toBe(mockResourceInstance);
    expect(mockWebTracerProviderRegisterCallArg.contextManager).toBe(mockZoneContextManagerInstance);
    expect(mockGetWebAutoInstrumentations).toHaveBeenCalledWith({
      '@opentelemetry/instrumentation-xml-http-request': {
        propagateTraceHeaderCorsUrls: [/.+/g],
      },
      '@opentelemetry/instrumentation-fetch': {
        propagateTraceHeaderCorsUrls: [/.+/g],
      },
    });
    expect(mockRegisterInstrumentationsCallArg.instrumentations).toBe(mockInstrumentations);
  });

  it('should add simple span processor and console span exporter when debug is true', () => {
    const config = {
      attributes: { foo: 'bar', baz: 'qux' },
      serviceName: 'test-service-name',
      debug: true,
      enabled: true,
    };

    initOpenTelemetry(config);

    const mockSimpleSpanProcessorCallArg = getMockCallArgumentReference(mockSimpleSpanProcessor);
    const mockWebTracerProviderCallArg = getMockCallArgumentReference(mockWebTracerProvider);

    expect(mockConsoleSpanExporter).toHaveBeenCalled();
    expect(mockSimpleSpanProcessorCallArg).toBe(mockConsoleSpanExporterInstance);
    expect(mockWebTracerProviderCallArg.spanProcessors[0]).toBe(mockSimpleSpanProcessorInstance);
    expect(mockWebTracerProviderCallArg.spanProcessors[1]).toBe(mockBatchSpanProcessorInstance);
    expect(mockWebTracerProviderCallArg.resource).toBe(mockResourceInstance);
  });
});
