import { afterEach, describe, expect, it, vi } from 'vitest';
import { FluxnovaError } from '../common';
import { errorSerializer } from './logger';

class CustomHttpError extends Error {
  response: any;
  request: any;
  timings: any;

  constructor(message: string, responseBody: string = JSON.stringify({ bodyError: 'doh' }), request: any = {}) {
    super(message);
    this.timings = {};
    this.request = request;
    this.response = {
      headers: { 'content-type': 'application/json' },
      data: responseBody,
      status: 400,
    };
  }
}

describe('Logger error serializers', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should serialize nested cause errors', () => {
    const firstError = new Error('hello');
    const error = new FluxnovaError('something went wrong', { cause: firstError });
    expect(errorSerializer(error)).toEqual(
      expect.objectContaining({
        options: expect.objectContaining({
          cause: expect.objectContaining({}),
        }),
        name: 'FluxnovaError',
        message: 'something went wrong: hello',
        response: 'something went wrong',
        stack: expect.any(String),
      }),
    );
  });

  it('should serialize response body if json', () => {
    const error = new CustomHttpError('test');
    expect(errorSerializer(error)).toEqual(
      expect.objectContaining({
        responseBody: {
          bodyError: 'doh',
        },
      }),
    );
  });

  it('should not serialize a body if json header but not json content', () => {
    const error = new CustomHttpError('test', 'internal server error');
    expect(errorSerializer(error)).toEqual(
      expect.objectContaining({
        responseBody: 'internal server error',
      }),
    );
  });

  it('should serialize response statusCode', () => {
    const error = new CustomHttpError('test');
    expect(errorSerializer(error)).toEqual(
      expect.objectContaining({
        statusCode: 400,
      }),
    );
  });

  it('should serialize url and method if got/http error', () => {
    const error = new CustomHttpError('test', 'whatever', {
      requestUrl: 'https://whatever.com',
      options: { method: 'POST' },
    });
    expect(errorSerializer(error)).toEqual(
      expect.objectContaining({
        url: 'https://whatever.com',
        method: 'POST',
      }),
    );
  });
});
