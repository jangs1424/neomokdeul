import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@neomokdeul/db";

/**
 * POST /api/matching/publish
 *
 * Body (two variants):
 *   { matchingId: string }                     → publish that single draft
 *   { cohortId: string, round?: 1 | 2 }        → bulk publish all drafts
 *
 * TODO(phase-6+): on publish, enqueue SMS to both parties via message_logs
 * (reuse /messages infra from Phase 4). For MVP we only console.log the intent.
 */
export async function POST(req: Request) {
  let body: {
    matchingId?: unknown;
    cohortId?: unknown;
    round?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // --- Single-matching publish ---
  if (typeof body.matchingId === "string") {
    const { data, error } = await supabase
      .from("matchings")
      .update({ status: "published", published_at: nowIso, updated_at: nowIso })
      .eq("id", body.matchingId)
      .eq("status", "draft")
      .select("*");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const updated = data?.length ?? 0;
    // eslint-disable-next-line no-console
    console.log(
      `[matching.publish] single id=${body.matchingId} updated=${updated} TODO: dispatch SMS`,
    );
    return NextResponse.json({ ok: true, updated });
  }

  // --- Bulk publish by cohort (+optional round) ---
  if (typeof body.cohortId !== "string" || !body.cohortId) {
    return NextResponse.json(
      { error: "matchingId or cohortId required" },
      { status: 400 },
    );
  }

  let q = supabase
    .from("matchings")
    .update({ status: "published", published_at: nowIso, updated_at: nowIso })
    .eq("cohort_id", body.cohortId)
    .eq("status", "draft");

  if (body.round === 1 || body.round === 2) {
    q = q.eq("round", body.round);
  }

  const { data, error } = await q.select("*");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const updated = data?.length ?? 0;
  // eslint-disable-next-line no-console
  console.log(
    `[matching.publish] bulk cohort=${body.cohortId} round=${body.round ?? "all"} updated=${updated} TODO: dispatch SMS`,
  );

  return NextResponse.json({ ok: true, updated });
}
