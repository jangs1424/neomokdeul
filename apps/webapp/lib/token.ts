import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.WEBAPP_TOKEN_SECRET;

export interface TokenPayload {
  appId: string;
  cohortId: string;
  exp: number; // unix seconds
}

function b64uEncode(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf;
  return b.toString('base64url');
}

function b64uDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

export function signToken(payload: TokenPayload): string {
  if (!SECRET) throw new Error('WEBAPP_TOKEN_SECRET missing');
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = b64uEncode(payloadStr);
  const sig = createHmac('sha256', SECRET).update(payloadB64).digest();
  return `${payloadB64}.${b64uEncode(sig)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!SECRET) return null;
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return null;
    const expected = createHmac('sha256', SECRET).update(payloadB64).digest();
    const given = b64uDecode(sigB64);
    if (expected.length !== given.length) return null;
    if (!timingSafeEqual(expected, given)) return null;
    const payload = JSON.parse(b64uDecode(payloadB64).toString('utf8')) as TokenPayload;
    if (typeof payload.appId !== 'string' || typeof payload.cohortId !== 'string') return null;
    if (typeof payload.exp !== 'number') return null;
    if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
