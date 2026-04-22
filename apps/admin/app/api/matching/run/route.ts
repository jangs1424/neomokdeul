import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getCohort,
  listApplications,
  listExclusions,
  listMatchResponses,
  listMatchings,
  createMatching,
  type Application,
  type Cohort,
  type MatchResponse,
  type Matching,
} from "@neomokdeul/db";
import { claudeConfigured, scorePairWithLlm } from "../../../../lib/claude";

// -----------------------------------------------------------------------------
// Matching algorithm — Phase 12 rewrite.
//
// Pool: applications where status='approved' AND a match_response row exists.
//
// Rounds:
//   Round 1 → program Day 2..Day 4  (programStartDate +1 .. +3, inclusive)
//   Round 2 → program Day 5..Day 7  (programStartDate +4 .. +6, inclusive)
//
// Per-pair eligibility (hard gates):
//   1. Gender preference compatible:
//        m.matchGender ∈ {opposite, any} AND
//        f.matchGender ∈ {opposite, any}
//   2. Slot overlap in round's date range ≥ 2
//      (count of identical "YYYY-MM-DD_HH-HH" strings whose YYYY-MM-DD is in
//      the round's date list)
//   3. Exclusion pair (normalized phone) not present
//   4. Round 2 only: (m, f) must not have a round-1 match
//
// Scoring:
//   - If ANTHROPIC_API_KEY set → scorePairWithLlm (apps/admin/lib/claude.ts)
//   - Else (or on Claude error) → fallback heuristic:
//       score = 0.5 + min(slotOverlap, 4) / 8   (range 0.5 .. 1.0)
//     reasoning: "LLM 미연동 · 슬롯 겹침 N개"
//
// Pairing: greedy by score desc, skip if either side used, respects avoid-map
// for Round 2.
//
// Returns: { ok, cohortId, round1, round2, poolSize, skippedLowOverlap }
// -----------------------------------------------------------------------------

type RunBody = {
  cohortId?: unknown;
  round?: unknown;
};

function normalizePhonePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/**
 * Given a programStartDate like "2026-05-14" and a round (1 or 2), returns the
 * list of "YYYY-MM-DD" date strings for that round.
 *   Round 1 → start+1, start+2, start+3  (Day 2..4)
 *   Round 2 → start+4, start+5, start+6  (Day 5..7)
 */
function roundDateList(programStartDate: string, round: 1 | 2): string[] {
  const out: string[] = [];
  const start = new Date(programStartDate + "T00:00:00");
  if (isNaN(start.getTime())) return out;
  const offsets = round === 1 ? [1, 2, 3] : [4, 5, 6];
  for (const off of offsets) {
    const d = new Date(start);
    d.setDate(d.getDate() + off);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

/** "2026-05-15_18-22" → "2026-05-15" */
function slotDate(slot: string): string | null {
  const i = slot.indexOf("_");
  return i > 0 ? slot.slice(0, i) : null;
}

/**
 * Slot overlap within a round's date range. Both participants must have the
 * identical slot string (date + hour range) for it to count.
 */
function roundSlotOverlap(
  m: MatchResponse,
  f: MatchResponse,
  dateSet: Set<string>,
): number {
  const mSlots = new Set<string>();
  for (const s of m.availableSlots ?? []) {
    const d = slotDate(s);
    if (d && dateSet.has(d)) mSlots.add(s);
  }
  let count = 0;
  for (const s of f.availableSlots ?? []) {
    if (mSlots.has(s)) count++;
  }
  return count;
}

/** Gender-preference compatibility gate (symmetric). */
function genderPrefsOk(m: MatchResponse, f: MatchResponse): boolean {
  const mOk = m.matchGender === "opposite" || m.matchGender === "any";
  const fOk = f.matchGender === "opposite" || f.matchGender === "any";
  return mOk && fOk;
}

// ---------------------------------------------------------------------------
// Fallback heuristic scorer
// ---------------------------------------------------------------------------
function heuristicScore(slotOverlap: number): {
  score: number;
  reasoning: string;
} {
  const capped = Math.min(4, slotOverlap);
  const raw = 0.5 + capped / 8;
  const score = Math.max(0, Math.min(1, raw));
  return {
    score: Math.round(score * 100) / 100,
    reasoning: `LLM 미연동 · 슬롯 겹침 ${slotOverlap}개`,
  };
}

// ---------------------------------------------------------------------------
// Cost cap — LLM never called more than this many times per matching run.
// 30 pairs × 2 rounds = 60 calls × Haiku ~$0.0004 = ~$0.024/run worst case.
// ---------------------------------------------------------------------------
const MAX_LLM_CALLS_PER_ROUND = 30;

// ---------------------------------------------------------------------------
// Candidate list builder + greedy pairing
// ---------------------------------------------------------------------------

type Candidate = {
  maleId: string;
  femaleId: string;
  mr: MatchResponse;
  fr: MatchResponse;
  overlap: number;
  score: number;
  reasoning: string;
};

/**
 * Cost-controlled pairing:
 *   1. Build all eligible candidates with cheap heuristic scores
 *   2. Greedy pair by heuristic (this is the FINAL pair set)
 *   3. LLM-rescore ONLY the final pairs (in parallel) — at most
 *      MAX_LLM_CALLS_PER_ROUND calls per round.
 *
 * This avoids the N² LLM call disaster of the previous implementation.
 */
async function buildAndPair(
  males: Application[],
  females: Application[],
  responseByAppId: Map<string, MatchResponse>,
  dateSet: Set<string>,
  exclusionSet: Set<string>,
  avoid: Map<string, Set<string>> | undefined,
): Promise<{ pairs: Candidate[]; skippedLowOverlap: number; llmCalls: number }> {
  // ---- Step 1: build heuristic candidates ----
  const candidates: Candidate[] = [];
  let skippedLowOverlap = 0;

  for (const m of males) {
    const mr = responseByAppId.get(m.id);
    if (!mr) continue;

    for (const f of females) {
      const fr = responseByAppId.get(f.id);
      if (!fr) continue;

      if (!genderPrefsOk(mr, fr)) continue;

      const [a, b] = normalizePhonePair(m.phone, f.phone);
      if (exclusionSet.has(`${a}|${b}`)) continue;

      if (avoid?.get(m.id)?.has(f.id)) continue;

      const overlap = roundSlotOverlap(mr, fr, dateSet);
      if (overlap < 2) {
        skippedLowOverlap++;
        continue;
      }

      const heur = heuristicScore(overlap);
      candidates.push({
        maleId: m.id,
        femaleId: f.id,
        mr,
        fr,
        overlap,
        score: heur.score,
        reasoning: heur.reasoning,
      });
    }
  }

  // ---- Step 2: greedy pair by heuristic score ----
  candidates.sort((x, y) => y.score - x.score);

  const usedMale = new Set<string>();
  const usedFemale = new Set<string>();
  const pairs: Candidate[] = [];
  for (const c of candidates) {
    if (usedMale.has(c.maleId)) continue;
    if (usedFemale.has(c.femaleId)) continue;
    usedMale.add(c.maleId);
    usedFemale.add(c.femaleId);
    pairs.push(c);
  }

  // ---- Step 3: LLM-rescore final pairs (in parallel, capped) ----
  let llmCalls = 0;
  if (claudeConfigured && pairs.length > 0) {
    const toScore = pairs.slice(0, MAX_LLM_CALLS_PER_ROUND);
    const results = await Promise.allSettled(
      toScore.map((p) => scorePairWithLlm(p.mr, p.fr, p.overlap)),
    );
    for (let i = 0; i < toScore.length; i++) {
      const res = results[i];
      llmCalls++;
      if (res.status === "fulfilled") {
        toScore[i].score = Math.round(res.value.score * 100) / 100;
        toScore[i].reasoning = res.value.reasoning;
      } else {
        console.error("[matching/run] LLM call failed for pair", i, ":", res.reason);
        // keep heuristic; mark in reasoning
        toScore[i].reasoning = `${toScore[i].reasoning} · LLM 실패`;
      }
    }
  }

  return { pairs, skippedLowOverlap, llmCalls };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const cohortId = typeof body.cohortId === "string" ? body.cohortId : "";
  if (!cohortId) {
    return NextResponse.json({ error: "cohortId required" }, { status: 400 });
  }

  let rounds: (1 | 2)[];
  if (body.round === 1 || body.round === "1") rounds = [1];
  else if (body.round === 2 || body.round === "2") rounds = [2];
  else if (body.round === "both") rounds = [1, 2];
  else return NextResponse.json({ error: "invalid round" }, { status: 400 });

  // Load cohort (for programStartDate)
  const cohort: Cohort | null = await getCohort(cohortId);
  if (!cohort) {
    return NextResponse.json({ error: "cohort not found" }, { status: 404 });
  }

  const [allApps, responses] = await Promise.all([
    listApplications(),
    listMatchResponses(cohortId),
  ]);
  const responseByAppId = new Map<string, MatchResponse>();
  for (const r of responses) responseByAppId.set(r.applicationId, r);

  const pool = allApps.filter(
    (a) =>
      a.cohortId === cohortId &&
      a.status === "approved" &&
      responseByAppId.has(a.id),
  );
  const males = pool.filter((a) => a.gender === "male");
  const females = pool.filter((a) => a.gender === "female");

  const exclusions = await listExclusions();
  const exclusionSet = new Set<string>(
    exclusions.map((e) => `${e.phoneA}|${e.phoneB}`),
  );

  const existing = await listMatchings(cohortId);
  const supabase = getSupabaseAdmin();

  const counts: Record<string, number> = { round1: 0, round2: 0 };
  let totalSkippedLowOverlap = 0;
  let totalLlmCalls = 0;

  for (const round of rounds) {
    // 1. Delete existing draft rows for this round (idempotent rerun)
    const draftIds = existing
      .filter((m) => m.round === round && m.status === "draft")
      .map((m) => m.id);
    if (draftIds.length > 0) {
      const { error: delErr } = await supabase
        .from("matchings")
        .delete()
        .in("id", draftIds);
      if (delErr) {
        return NextResponse.json(
          { error: `[delete drafts] ${delErr.message}` },
          { status: 500 },
        );
      }
    }

    // 2. Build avoid-map for round 2 from round-1 (both draft + published)
    let avoid: Map<string, Set<string>> | undefined;
    if (round === 2) {
      const r1 = existing.filter(
        (m) => m.round === 1 && m.status !== "superseded",
      );
      avoid = new Map();
      for (const m of r1) {
        if (!avoid.has(m.maleApplicationId)) {
          avoid.set(m.maleApplicationId, new Set<string>());
        }
        avoid.get(m.maleApplicationId)!.add(m.femaleApplicationId);
      }
    }

    // 3. Exclude slots already held by published matchings in this round.
    const publishedIds = new Set(
      existing
        .filter((m) => m.round === round && m.status === "published")
        .flatMap((m) => [m.maleApplicationId, m.femaleApplicationId]),
    );
    const pairableMales = males.filter((m) => !publishedIds.has(m.id));
    const pairableFemales = females.filter((f) => !publishedIds.has(f.id));

    // 4. Compute round's date list
    const dateList = roundDateList(cohort.programStartDate, round);
    const dateSet = new Set(dateList);

    // 5. Build candidates + greedy pair
    const { pairs, skippedLowOverlap, llmCalls } = await buildAndPair(
      pairableMales,
      pairableFemales,
      responseByAppId,
      dateSet,
      exclusionSet,
      avoid,
    );
    totalSkippedLowOverlap += skippedLowOverlap;
    totalLlmCalls += llmCalls;

    // 6. Insert drafts
    for (const p of pairs) {
      await createMatching({
        cohortId,
        round,
        maleApplicationId: p.maleId,
        femaleApplicationId: p.femaleId,
        score: p.score,
        reasoning: p.reasoning,
      } as Omit<
        Matching,
        "id" | "createdAt" | "updatedAt" | "publishedAt" | "supersededBy" | "status"
      >);
    }

    counts[`round${round}`] = pairs.length;
  }

  return NextResponse.json({
    ok: true,
    cohortId,
    poolSize: pool.length,
    round1: counts.round1 ?? 0,
    round2: counts.round2 ?? 0,
    skippedLowOverlap: totalSkippedLowOverlap,
    llmMode: claudeConfigured ? "claude-haiku-4.5" : "heuristic",
    llmCalls: totalLlmCalls,
    estCostUsd: Number((totalLlmCalls * 0.0004).toFixed(4)),
  });
}
