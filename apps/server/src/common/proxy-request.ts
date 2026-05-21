import { AxiosResponse } from 'axios';
import { omit } from 'lodash-es';
import ReadableStream = NodeJS.ReadableStream;
import type { Response } from 'express';

export function proxyRequest(proxiedStream: ReadableStream, res: Response, expiresSeconds?: number) {
  return new Promise((resolve) => {
    proxiedStream.on('response', (proxiedResponse: AxiosResponse) => {
      if (expiresSeconds && !res.headersSent) {
        proxiedResponse.headers = {
          ...omit(proxiedResponse.headers, 'etag'),
          Expires: new Date(Date.now() + expiresSeconds * 1000).toUTCString(),
          'Cache-Control': `public, max-age=${expiresSeconds}`,
        };
      }
    });
    proxiedStream.on('error', (error) => {
      res.status(error?.response?.statusCode ?? 500);
      res.send(error?.response?.body ?? 'error proxying request');
      resolve(null);
    });
    proxiedStream.on('end', () => resolve(null));
    proxiedStream.pipe(res);
  });
}
