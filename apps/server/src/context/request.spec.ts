import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodeState, RequestState } from './request';

describe('fluxnova-request', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestLogger');
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  describe('decodeState', () => {
    it('should decode a valid base64 encoded state with a valid returnTo', () => {
      const stateObj: RequestState = { returnTo: '/dashboard' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result).toEqual(stateObj);
    });

    it('should default returnTo to "/" if missing', () => {
      const stateObj: RequestState = {};
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should default returnTo to "/" if it does not start with "/"', () => {
      const stateObj: RequestState = { returnTo: 'https://malicious.site' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should handle invalid base64 and log warning', () => {
      const spy = vi.spyOn(logger, 'warn');
      const invalidState = '!!!notbase64!!!';
      const result = decodeState(invalidState, logger);
      expect(result.returnTo).toBe('/');
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() }),
        'problem parsing request state',
      );
    });

    it('should handle JSON that decodes to null', () => {
      const encodedNull = Buffer.from('null').toString('base64');
      const result = decodeState(encodedNull, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should default returnTo to "/" if it starts with "//"', () => {
      const stateObj: RequestState = { returnTo: '//evil.com' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should default returnTo to "/" if it contains a backslash', () => {
      const stateObj: RequestState = { returnTo: '/path\\evil' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should default returnTo to "/" if it contains a newline character', () => {
      const stateObj: RequestState = { returnTo: '/path\nevil' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should default returnTo to "/" if it contains a carriage return', () => {
      const stateObj: RequestState = { returnTo: '/path\revil' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should default returnTo to "/" if it contains a tab character', () => {
      const stateObj: RequestState = { returnTo: '/path\tevil' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });

    it('should accept a deeply nested valid path', () => {
      const stateObj: RequestState = { returnTo: '/dashboard/settings/profile' };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/dashboard/settings/profile');
    });

    it('should default returnTo to "/" if returnTo is not a string', () => {
      const stateObj = { returnTo: 42 };
      const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const result = decodeState(encodedState, logger);
      expect(result.returnTo).toBe('/');
    });
  });
});
