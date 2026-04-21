import { NextResponse } from "next/server";
import { sendMessageForApplication } from "../../../../lib/sms";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const applicationId =
      typeof body.applicationId === "string" ? body.applicationId : "";
    const overrideBody =
      typeof body.overrideBody === "string" ? body.overrideBody : undefined;

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId is required" },
        { status: 400 },
      );
    }

    const outcome = await sendMessageForApplication(applicationId, overrideBody);

    switch (outcome.kind) {
      case "sent":
        return NextResponse.json({ ok: true, log: outcome.log });
      case "failed":
        return NextResponse.json(
          { ok: false, log: outcome.log, error: outcome.log.last_error ?? "failed" },
          { status: 502 },
        );
      case "skipped":
        return NextResponse.json(
          { ok: false, error: "이미 발송된 신청입니다" },
          { status: 409 },
        );
      case "error": {
        const status =
          outcome.message === "Latpeed URL이 설정되지 않았습니다"
            ? 400
            : outcome.message.includes("찾을 수 없습니다")
              ? 404
              : 500;
        return NextResponse.json({ error: outcome.message }, { status });
      }
    }
  } catch (err) {
    console.error("[messages/send POST]", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
