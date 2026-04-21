import { NextResponse } from "next/server";
import { sendMessageForApplication } from "../../../../lib/sms";

/**
 * Bulk-send. Processes sequentially to avoid hammering the stub (and the real
 * provider later). Returns aggregated counts + per-item outcomes.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ids: unknown = body.applicationIds;
    if (!Array.isArray(ids) || ids.some((v) => typeof v !== "string")) {
      return NextResponse.json(
        { error: "applicationIds must be string[]" },
        { status: 400 },
      );
    }
    const list = ids as string[];
    if (list.length === 0) {
      return NextResponse.json({
        sent: 0,
        failed: 0,
        skipped: 0,
        errored: 0,
        results: [],
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let errored = 0;
    const results: Array<{
      applicationId: string;
      kind: "sent" | "failed" | "skipped" | "error";
      error?: string;
    }> = [];

    for (const id of list) {
      const outcome = await sendMessageForApplication(id);
      if (outcome.kind === "sent") {
        sent += 1;
        results.push({ applicationId: id, kind: "sent" });
      } else if (outcome.kind === "failed") {
        failed += 1;
        results.push({
          applicationId: id,
          kind: "failed",
          error: outcome.log.last_error ?? undefined,
        });
      } else if (outcome.kind === "skipped") {
        skipped += 1;
        results.push({
          applicationId: id,
          kind: "skipped",
          error: outcome.reason,
        });
      } else {
        errored += 1;
        results.push({
          applicationId: id,
          kind: "error",
          error: outcome.message,
        });
      }
    }

    return NextResponse.json({ sent, failed, skipped, errored, results });
  } catch (err) {
    console.error("[messages/send-bulk POST]", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
