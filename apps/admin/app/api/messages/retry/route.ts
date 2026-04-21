import { NextResponse } from "next/server";
import { retryMessageLog } from "../../../../lib/sms";

/**
 * Manual retry of a failed message_logs row (실패 탭의 [수동 재시도] button).
 * Body: { logId: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const logId = typeof body.logId === "string" ? body.logId : "";
    if (!logId) {
      return NextResponse.json({ error: "logId is required" }, { status: 400 });
    }

    const outcome = await retryMessageLog(logId);
    if (outcome.kind === "sent") {
      return NextResponse.json({ ok: true, log: outcome.log });
    }
    if (outcome.kind === "failed") {
      return NextResponse.json(
        { ok: false, log: outcome.log, error: outcome.log.last_error ?? "failed" },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: outcome.kind === "error" ? outcome.message : "skipped" }, { status: 500 });
  } catch (err) {
    console.error("[messages/retry POST]", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
