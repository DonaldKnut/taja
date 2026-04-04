import { verifyGoogleIdTokenForExpo } from '@/lib/google-id-token-verify';
import type { OAuth2Client } from 'google-auth-library';

describe('verifyGoogleIdTokenForExpo', () => {
  it('returns normalized profile when verifyIdToken succeeds (mocked OAuth2Client)', async () => {
    const mockClient = {
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: () => ({
          sub: 'sub-123',
          email: 'User@Example.com',
          email_verified: true,
          iss: 'https://accounts.google.com',
          name: 'Test User',
          picture: 'https://cdn.example/p.png',
        }),
      }),
    } as unknown as OAuth2Client;

    const profile = await verifyGoogleIdTokenForExpo(
      'fake.jwt.token',
      'web-client-id.apps.googleusercontent.com',
      mockClient
    );

    expect(profile).toEqual({
      sub: 'sub-123',
      email: 'user@example.com',
      emailVerified: true,
      name: 'Test User',
      picture: 'https://cdn.example/p.png',
    });
    expect(mockClient.verifyIdToken).toHaveBeenCalledWith({
      idToken: 'fake.jwt.token',
      audience: 'web-client-id.apps.googleusercontent.com',
    });
  });

  it('rejects when email_verified is false', async () => {
    const mockClient = {
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: () => ({
          sub: 'sub-123',
          email: 'user@example.com',
          email_verified: false,
          iss: 'https://accounts.google.com',
        }),
      }),
    } as unknown as OAuth2Client;

    await expect(
      verifyGoogleIdTokenForExpo('token', 'client-id', mockClient)
    ).rejects.toThrow();
  });
});
