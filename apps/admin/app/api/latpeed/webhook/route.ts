import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@neomokdeul/db";

/**
 * Latpeed payment webhook receiver.
 *
 * Latpeed 정확한 payload 포맷을 아직 모름. 이 엔드포인트는 공통 필드명을
 * 여러 개 시도해서 application을 찾고 payment_completed_at을 찍는 유연한
 * 구현. 실제 webhook 받아 raw 로깅 후 필드명 fix 예정.
 *
 * Matching strategies (순서대로):
 *   1) body.ref / application_id / order_id / merchant_uid == applications.id
 *   2) body.buyer_tel / phone / customer_phone == applications.phone
 *      (approved 상태 + payment_completed_at NULL 중 최신)
 *
 * Always logs the raw body to server console for debugging.
 */

export async function POST(req: Request) {
  const raw = await req.text();
  console.log("[latpeed webhook raw]", raw);

  let body: Record<string, unknown> = {};
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      body = JSON.parse(raw || "{}");
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = Object.fromEntries(new URLSearchParams(raw).entries());
    } else {
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        body = Object.fromEntries(new URLSearchParams(raw).entries());
      }
    }
  } catch (err) {
    console.error("[latpeed webhook parse failed]", err);
    return NextResponse.json({ ok: false, error: "unparseable body" }, { status: 400 });
  }

  console.log("[latpeed webhook parsed]", body);

  // --- Classify status -----------------------------------------------------
  const statusRaw = String(
    body.status ?? body.payment_status ?? body.payStatus ?? body.paid ?? "",
  ).toLowerCase();
  const isPaid =
    statusRaw === "paid" ||
    statusRaw === "success" ||
    statusRaw === "completed" ||
    statusRaw === "done" ||
    statusRaw === "complete" ||
    statusRaw === "완료" ||
    body.paid === true ||
    body.success === true;

  if (!isPaid) {
    return NextResponse.json({
      ok: true,
      message: "received (not a paid status)",
      status: statusRaw || "unknown",
    });
  }

  // --- Look up application -------------------------------------------------
  const ref =
    (body.ref as string | undefined) ??
    (body.application_id as string | undefined) ??
    (body.order_id as string | undefined) ??
    (body.merchant_uid as string | undefined) ??
    (typeof body.custom_data === "object" && body.custom_data !== null
      ? (body.custom_data as Record<string, unknown>).application_id as string | undefined
      : undefined);

  const phone =
    (body.buyer_tel as string | undefined) ??
    (body.phone as string | undefined) ??
    (body.customer_phone as string | undefined) ??
    (body.buyerPhone as string | undefined);

  const sb = getSupabaseAdmin();
  let applicationId: string | null = null;

  if (ref && typeof ref === "string") {
    const { data } = await sb
      .from("applications")
      .select("id")
      .eq("id", ref)
      .maybeSingle();
    if (data) applicationId = data.id;
  }

  if (!applicationId && phone) {
    const normalized = String(phone).replace(/[^0-9]/g, "");
    const dashed =
      normalized.length === 11
        ? `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`
        : normalized;
    const { data } = await sb
      .from("applications")
      .select("id")
      .in("phone", [dashed, normalized])
      .eq("status", "approved")
      .is("payment_completed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data[0]) applicationId = data[0].id;
  }

  if (!applicationId) {
    console.error("[latpeed webhook] no matching application", { ref, phone });
    return NextResponse.json(
      {
        ok: false,
        error: "no matching application",
        hint: "pass application id as 'ref' query param or ensure phone matches",
      },
      { status: 404 },
    );
  }

  // --- Update payment_completed_at ----------------------------------------
  const { error } = await sb
    .from("applications")
    .update({ payment_completed_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) {
    console.error("[latpeed webhook] db update failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.log("[latpeed webhook] ✓ paid", applicationId);
  return NextResponse.json({ ok: true, applicationId });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Latpeed webhook endpoint. POST here. Supported body formats: JSON, form-urlencoded.",
  });
}
