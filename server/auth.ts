import crypto from 'node:crypto';

const ADMIN_DIGEST_HEX =
  'e97ce558099c0f55370135e21e23c45510ecfa22efa3dcde939cf20480ed164b';

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    'rt-run-serverless-hmac-key-v1-2026'
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const envOverride = process.env.ADMIN_SECRET;
  if (envOverride && envOverride.length > 0) {
    const a = crypto.createHash('sha256').update(input).digest();
    const b = crypto.createHash('sha256').update(envOverride).digest();
    return crypto.timingSafeEqual(a, b);
  }
  const candidate = crypto
    .createHash('sha256')
    .update(`rt-run-admin:${input}`)
    .digest();
  const expected = Buffer.from(ADMIN_DIGEST_HEX, 'hex');
  return crypto.timingSafeEqual(candidate, expected);
}

export interface AuthTokenPayload {
  sub: number | 'admin';
  role: 'player' | 'admin';
  username?: string;
  exp: number;
}

export function signToken(
  payload: Omit<AuthTokenPayload, 'exp'>,
  ttlMs = 7 * 24 * 60 * 60 * 1000
): string {
  const fullPayload: AuthTokenPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const body = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(body)
    .digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  try {
    const expectedSig = crypto
      .createHmac('sha256', getAuthSecret())
      .update(body)
      .digest();
    const actualSig = Buffer.from(sig, 'base64url');
    if (expectedSig.length !== actualSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null;
    const parsed = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    ) as AuthTokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
