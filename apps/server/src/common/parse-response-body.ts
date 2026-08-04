import { AxiosResponse } from 'axios';
import { isString, some } from 'lodash-es';

export function parseResponseBody(httpResponse: AxiosResponse) {
  let body = httpResponse?.data;
  const contentTypeHeader = httpResponse?.headers?.['content-type'];
  const contentTypes = Array.isArray(contentTypeHeader)
    ? contentTypeHeader
    : isString(contentTypeHeader)
      ? [contentTypeHeader]
      : [];
  const includesApplicationJson = some(contentTypes, (type) => isString(type) && type.includes('application/json'));
  if (includesApplicationJson && isString(body) && body.trim().startsWith('{')) {
    body = JSON.parse(body);
  }
  return body;
}
