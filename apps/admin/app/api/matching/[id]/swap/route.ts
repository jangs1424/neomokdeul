import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@neomokdeul/db";

/**
 * PATCH /api/matching/:id/swap
 * Body: { withApplicationId: string, side: 'male' | 'female' }
 *
 * Semantics:
 *   - Load current matching M.
 *   - Find the "other" matching M' in the SAME (cohortId, round) that currently
 *     contains withApplicationId on the given side.
 *   - Swap the applicants between M and M'. Both remain status='draft'.
 *   - If no such M' exists, just replace the slot on M (unique constraint is
 *     deferred so even transient dupes are fine within a txn; we do two updates
 *     sequentially outside a txn but use a throwaway temp uuid first).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: matchingId } = await params;

  let body: { withApplicationId?: unknown; side?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const withApplicationId =
    typeof body.withApplicationId === "string" ? body.withApplicationId : "";
  const side = body.side === "male" ? "male" : body.side === "female" ? "female" : null;

  if (!withApplicationId || !side) {
    return NextResponse.json(
      { error: "withApplicationId and side required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const sideCol =
    side === "male" ? "male_application_id" : "female_application_id";

  // Load current M
  const { data: current, error: loadErr } = await supabase
    .from("matchings")
    .select("*")
    .eq("id", matchingId)
    .maybeSingle();
  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: "matching not found" }, { status: 404 });
  }

  const currentAppId = current[sideCol] as string;
  if (currentAppId === withApplicationId) {
    return NextResponse.json({ ok: true, noop: true });
  }

  // Find M' with withApplicationId on the same side within (cohort, round)
  const { data: other, error: otherErr } = await supabase
    .from("matchings")
    .select("*")
    .eq("cohort_id", current.cohort_id)
    .eq("round", current.round)
    .eq(sideCol, withApplicationId)
    .neq("status", "superseded")
    .maybeSingle();
  if (otherErr) {
    return NextResponse.json({ error: otherErr.message }, { status: 500 });
  }

  if (other) {
    // Swap: use a sentinel placeholder first to avoid unique-violation mid-swap.
    // With deferrable constraints at the table level, direct updates work inside
    // a single transaction; postgrest doesn't expose txn boundaries, so we
    // use the trick of temporarily assigning the other app's id to current,
    // then swap. To keep it robust we do it in two steps with the target id
    // first moved aside.
    //
    // Step A: move M'.side → currentAppId (temp value, still violates? No —
    // currentAppId is held by M only; once we update M, we clear it. So:
    //   1) Update M.side = withApplicationId
    //   2) Update M'.side = currentAppId
    // Because unique constraints on matchings are DEFERRABLE INITIALLY DEFERRED
    // (see migration 0004), Postgres only validates at commit. PostgREST runs
    // each PATCH in its own implicit txn — so step 1 alone may fail.
    //
    // Workaround: update both rows atomically via RPC is overkill for MVP;
    // instead, we go through a throwaway third value.
    const placeholder = "00000000-0000-0000-0000-000000000000";
    // Use a placeholder? Unfortunately the column is FK to applications, so
    // a random UUID won't pass. Instead: temporarily set M'.side to a
    // DIFFERENT real applicant id — none is safe. Easiest: delete-and-recreate
    // both rows inside one Supabase transaction via rpc, or accept that this
    // works because constraints are DEFERRABLE. We rely on DEFERRABLE here —
    // PostgREST wraps each PATCH in a tx, and the unique check is deferred
    // until COMMIT. Multi-row updates via .in() run in one tx.
    void placeholder;

    // Use a single multi-row update via rpc-like approach: two updates inside
    // one PostgREST call isn't possible, but two sequential updates — each is
    // its own tx. The unique constraint check fires at commit of each tx.
    //
    // SOLUTION: use supabase.rpc with a custom function? Not in migration.
    // Practical MVP: mark current as 'superseded', create a new draft for each
    // side. This keeps status='draft' on fresh rows.
    const { data: currFresh } = await supabase
      .from("matchings")
      .select("*")
      .eq("id", current.id)
      .maybeSingle();
    const { data: othFresh } = await supabase
      .from("matchings")
      .select("*")
      .eq("id", other.id)
      .maybeSingle();
    if (!currFresh || !othFresh) {
      return NextResponse.json({ error: "state changed" }, { status: 409 });
    }

    // Supersede the two existing drafts, then insert two new drafts with swapped sides.
    const nowIso = new Date().toISOString();
    await supabase
      .from("matchings")
      .update({ status: "superseded", updated_at: nowIso })
      .in("id", [current.id, other.id]);

    const rowA =
      side === "female"
        ? {
            cohort_id: current.cohort_id,
            round: current.round,
            male_application_id: current.male_application_id,
            female_application_id: other.female_application_id,
            score: current.score,
            reasoning: current.reasoning,
            status: "draft",
          }
        : {
            cohort_id: current.cohort_id,
            round: current.round,
            male_application_id: other.male_application_id,
            female_application_id: current.female_application_id,
            score: current.score,
            reasoning: current.reasoning,
            status: "draft",
          };
    const rowB =
      side === "female"
        ? {
            cohort_id: other.cohort_id,
            round: other.round,
            male_application_id: other.male_application_id,
            female_application_id: current.female_application_id,
            score: other.score,
            reasoning: other.reasoning,
            status: "draft",
          }
        : {
            cohort_id: other.cohort_id,
            round: other.round,
            male_application_id: current.male_application_id,
            female_application_id: other.female_application_id,
            score: other.score,
            reasoning: other.reasoning,
            status: "draft",
          };

    const { error: insErr } = await supabase
      .from("matchings")
      .insert([rowA, rowB]);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, swapped: true });
  }

  // No opposing M' found → treat as direct replacement.
  const patch: Record<string, unknown> = {
    status: "draft",
    updated_at: new Date().toISOString(),
  };
  patch[sideCol] = withApplicationId;

  const { error: updErr } = await supabase
    .from("matchings")
    .update(patch)
    .eq("id", matchingId);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, swapped: false });
}
