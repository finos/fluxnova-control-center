import { isString } from 'lodash-es';
export function jsonParseSafe<T>(json?: string): T | undefined {
  if (!isString(json)) {
    return json;
  }

  if (json === 'undefined') {
    console.debug('jsonParseSafe: value is string "undefined", returning undefined');
    return undefined;
  }

  try {
    return JSON.parse(json) as T;
  } catch (err: any) {
    console.debug('jsonParseSafe: failed to parse json, ignoring', json, err);
  }
  return;
}
