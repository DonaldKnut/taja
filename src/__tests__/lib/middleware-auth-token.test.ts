import type { RequestWithTokenSources } from '@/lib/auth-request-token';
import { extractAccessTokenFromRequest } from '@/lib/auth-request-token';

function mockRequest(opts: { authorization?: string | null; cookieToken?: string | null }): RequestWithTokenSources {
  return {
    headers: {
      get: (name: string) => {
        if (name.toLowerCase() === 'authorization') return opts.authorization ?? null;
        return null;
      },
    },
    cookies: {
      get: (name: string) => {
        if (name === 'token' && opts.cookieToken != null) return { name: 'token', value: opts.cookieToken };
        return undefined;
      },
    },
  } as RequestWithTokenSources;
}

describe('extractAccessTokenFromRequest', () => {
  it('parses standard Bearer header', () => {
    const req = mockRequest({ authorization: 'Bearer abc.def.ghi' });
    expect(extractAccessTokenFromRequest(req)).toBe('abc.def.ghi');
  });

  it('accepts lowercase bearer (common on some mobile HTTP stacks)', () => {
    const req = mockRequest({ authorization: 'bearer abc.def.ghi' });
    expect(extractAccessTokenFromRequest(req)).toBe('abc.def.ghi');
  });

  it('trims header and token segment', () => {
    const req = mockRequest({ authorization: '  Bearer   abc.def.ghi  ' });
    expect(extractAccessTokenFromRequest(req)).toBe('abc.def.ghi');
  });

  it('falls back to token cookie when Authorization absent', () => {
    const req = mockRequest({ cookieToken: 'from-cookie' });
    expect(extractAccessTokenFromRequest(req)).toBe('from-cookie');
  });

  it('prefers Authorization over cookie when both present', () => {
    const req = mockRequest({ authorization: 'Bearer from-header', cookieToken: 'from-cookie' });
    expect(extractAccessTokenFromRequest(req)).toBe('from-header');
  });

  it('returns null when neither header nor cookie', () => {
    const req = mockRequest({});
    expect(extractAccessTokenFromRequest(req)).toBeNull();
  });
});
