import { createHmac } from "node:crypto";

/**
 * Admin-side mirror of `apps/webapp/lib/token.ts` signer.
 * Uses the same WEBAPP_TOKEN_SECRET so that links generated from admin
 * (e.g. match-form reminders) are accepted by the webapp.
 */

const SECRET = process.env.WEBAPP_TOKEN_SECRET;

export interface TokenPayload {
  appId: string;
  cohortId: string;
  exp: number; // unix seconds
}

function b64uEncode(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

export function signToken(payload: TokenPayload): string {
  if (!SECRET) throw new Error("WEBAPP_TOKEN_SECRET missing");
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = b64uEncode(payloadStr);
  const sig = createHmac("sha256", SECRET).update(payloadB64).digest();
  return `${payloadB64}.${b64uEncode(sig)}`;
}

/**
 * Convenience helper: returns a token that expires in N days (default 12).
 */
export function signAppToken(
  appId: string,
  cohortId: string,
  ttlDays = 12,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 24 * 3600;
  return signToken({ appId, cohortId, exp });
}

export function webappBaseUrl(): string {
  return process.env.NEXT_PUBLIC_WEBAPP_URL ?? "http://localhost:3002";
}
