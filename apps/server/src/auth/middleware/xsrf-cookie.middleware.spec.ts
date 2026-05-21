import { describe, expect, it, vi } from 'vitest';
import { XSRFCookieHandler } from './xsrf-cookie.middleware';

describe('XSRFCookieHandler', () => {
  it('should set XSRF-TOKEN cookie if csrfToken is present', () => {
    const mockReq = { csrfToken: vi.fn().mockReturnValue('mockCsrfToken') } as any;
    const mockRes = { cookie: vi.fn() } as any;
    const next = vi.fn();

    const middleware = new XSRFCookieHandler();
    middleware.use(mockReq, mockRes, next);

    expect(mockRes.cookie).toHaveBeenCalledWith('XSRF-TOKEN', 'mockCsrfToken');
    expect(next).toHaveBeenCalled();
  });

  it('should not set XSRF-TOKEN cookie if csrfToken is not present', () => {
    const mockReq = {} as any;
    const mockRes = { cookie: vi.fn() } as any;
    const next = vi.fn();

    const middleware = new XSRFCookieHandler();
    middleware.use(mockReq, mockRes, next);

    expect(mockRes.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
