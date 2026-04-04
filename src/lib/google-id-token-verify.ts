import { OAuth2Client } from 'google-auth-library';

/** Google-issued ID tokens use one of these iss values. */
const ALLOWED_ISS = new Set(['https://accounts.google.com', 'accounts.google.com']);

export type GoogleIdProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

/**
 * Verify an ID token from Expo AuthSession (web client / webClientId).
 * Throws on invalid token, wrong audience, bad issuer, or missing email.
 */
export async function verifyGoogleIdTokenForExpo(
  idToken: string,
  webClientId: string,
  client?: OAuth2Client
): Promise<GoogleIdProfile> {
  const oauth = client ?? new OAuth2Client(webClientId);
  const ticket = await oauth.verifyIdToken({
    idToken,
    audience: webClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new Error('invalid_google_token');
  }
  const iss = payload.iss || '';
  if (!ALLOWED_ISS.has(iss)) {
    throw new Error('invalid_google_token');
  }
  const email = payload.email?.toLowerCase().trim();
  if (!email) {
    throw new Error('invalid_google_token');
  }
  if (payload.email_verified === false) {
    throw new Error('email_not_verified');
  }

  return {
    sub: payload.sub,
    email,
    emailVerified: Boolean(payload.email_verified),
    name: (payload.name || '').trim() || email.split('@')[0] || 'User',
    picture: payload.picture,
  };
}
