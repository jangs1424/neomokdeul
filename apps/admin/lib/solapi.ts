/**
 * Solapi (coolsms) SMS client.
 *
 * Uses direct fetch + HMAC-SHA256 signature (no extra deps).
 * Docs: https://developers.solapi.com/references/v4/messages/sendSimpleMessages
 *
 * Env required:
 *   SOLAPI_API_KEY
 *   SOLAPI_API_SECRET
 *   SOLAPI_SENDER_PHONE   (registered sender, e.g. "01012345678")
 *
 * If any of the three is missing, the module exports `isConfigured=false`
 * and callers should fall back to the stub in sms.ts.
 */
import { createHmac, randomBytes } from "node:crypto";

const API_KEY = process.env.SOLAPI_API_KEY;
const API_SECRET = process.env.SOLAPI_API_SECRET;
const SENDER = process.env.SOLAPI_SENDER_PHONE;

export const isConfigured = Boolean(API_KEY && API_SECRET && SENDER);

const BASE = "https://api.solapi.com";

function authHeader() {
  if (!API_KEY || !API_SECRET) throw new Error("Solapi keys missing");
  const date = new Date().toISOString();
  const salt = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", API_SECRET)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

export interface SolapiSendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  raw?: unknown;
}

/**
 * Send a single SMS/LMS via Solapi.
 *
 * Auto-detects message type based on text byte length (KR KSC5601):
 *  - SMS: up to 90 bytes
 *  - LMS: up to 2000 bytes
 *  - MMS: images (we don't use — ignore)
 */
export async function solapiSend(
  to: string,
  text: string,
): Promise<SolapiSendResult> {
  if (!isConfigured) return { ok: false, error: "Solapi not configured" };

  const body = {
    message: {
      to: to.replace(/[^0-9]/g, ""),
      from: SENDER!.replace(/[^0-9]/g, ""),
      text,
      type: estimateMessageType(text),
    },
  };

  try {
    const res = await fetch(`${BASE}/messages/v4/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      statusCode?: string;
      statusMessage?: string;
      messageId?: string;
    };
    if (!res.ok || (json.statusCode && json.statusCode !== "2000")) {
      return {
        ok: false,
        error: `[${json.statusCode ?? res.status}] ${json.statusMessage ?? "send failed"}`,
        raw: json,
      };
    }
    return {
      ok: true,
      providerMessageId: json.messageId,
      raw: json,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "network error",
    };
  }
}

/** Rough KR byte length: ASCII=1, Korean=2 (KSC5601 approximation). */
function byteLength(text: string): number {
  let n = 0;
  for (const ch of text) n += ch.charCodeAt(0) > 127 ? 2 : 1;
  return n;
}

function estimateMessageType(text: string): "SMS" | "LMS" {
  return byteLength(text) <= 90 ? "SMS" : "LMS";
}
