import { AxiosError, AxiosResponse } from 'axios';
import pino, { Level, SerializedError } from 'pino';
import { parseResponseBody } from '../common';

export const axiosErrorSerializer = (err: SerializedError, error: AxiosError) => {
  const { request, response } = error;
  err.url = request.requestUrl;
  err.method = request.options?.method;

  err.responseBody = parseResponseBody(response ?? ({} as unknown as AxiosResponse));

  if (response?.status) {
    err.statusCode = response?.status;
  }

  return err;
};

/**
 * handles formatting nested "cause" errors and JSON response bodies for errors that are caused
 * by http/got failures
 */
export const errorSerializer = pino.stdSerializers.wrapErrorSerializer((err: SerializedError) => {
  const raw = err.raw as any;
  try {
    if (raw?.request && raw?.response && raw?.timings) {
      return axiosErrorSerializer(err, raw);
    }

    if (err?.options?.cause) {
      err.options.cause = errorSerializer(err.options.cause);
    }
  } catch (serializingError) {
    // eslint-disable-next-line no-console
    console.log(serializingError, 'problems serializing error', raw?.response?.body);
  }

  return err;
});

// While each level is defined as a type, we can't check a string against a type
export const pinoLogLevelTypes: Set<Level> = new Set(['fatal', 'error', 'warn', 'info', 'debug', 'trace']);
