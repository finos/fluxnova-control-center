import { parseResponseBody } from './parse-response-body';

describe('parse response body', () => {
  it('should return response body parsed', () => {
    const resp: any = { data: '{"error":"This is an error"}', headers: { 'content-type': 'application/json' } };
    expect(parseResponseBody(resp)).toEqual({ error: 'This is an error' });
  });

  it('should return response body parsed when contentType contains application/json;charset=UTF-8', () => {
    const resp: any = {
      data: '{"error":"This is an error"}',
      headers: { 'content-type': 'application/json;charset=UTF-8' },
    };
    expect(parseResponseBody(resp)).toEqual({ error: 'This is an error' });
  });

  it('should return response body parsed multiple content types', () => {
    const resp: any = {
      data: '{"error":"This is an error"}',
      headers: { 'content-type': ['text/plain', 'application/json'] },
    };
    expect(parseResponseBody(resp)).toEqual({ error: 'This is an error' });
  });

  it('should return response body as a string if body does not start with a curly bracket', () => {
    const resp: any = { data: 'Testing', headers: { 'content-type': 'application/json' } };
    expect(parseResponseBody(resp)).toEqual('Testing');
  });

  it('should return response body as a string if content type is not application json', () => {
    const resp: any = { data: '{Testing}', headers: { 'content-type': 'multipart/form-data' } };
    expect(parseResponseBody(resp)).toEqual('{Testing}');
  });

  it('should return unparsed body if content type is not set', () => {
    const resp: any = { data: '{Testing}' };
    expect(parseResponseBody(resp)).toEqual('{Testing}');
  });
});
