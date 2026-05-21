import { AxiosError } from 'axios';

export function scrubError(error: unknown) {
  if (error instanceof AxiosError) {
    return {
      code: error.code,
      request: {
        method: error.request?.method,
        path: error.request?.path,
        host: error.request?.host,
      },
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
      },
    };
  }

  return error;
}
