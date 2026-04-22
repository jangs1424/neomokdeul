import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  listApplications,
  listExclusions,
  listMatchResponses,
  listMatchings,
  createMatching,
  type Application,
  type MatchResponse,
  type Matching,
} from "@neomokdeul/db";

// -----------------------------------------------------------------------------
// Matching algorithm — Phase 11-B rewrite.
//
// Pool: applications where status='approved' AND a match_response row exists
// for that applicationId. The heuristic uses the match_response fields
// (callTimes, conv*, values*, region, mbti) — NOT the application form.
//
// Weighted score (0..1):
//   0.30 callTimeOverlap
//   0.25 convStyleComplement   (actually similarity, for MVP)
//   0.25 valuesAlignment       (cosine similarity, scaled to 0..1)
//   0.10 regionProximity
//   0.10 mbtiCompat
//
// TODO(phase-12+): replace scorePair() with a Claude reasoning pass that
// consumes both applicants' day-by-day answers + motivation and produces
// `{ score, reasoning }`. Keep the greedy pairing harness as-is — only the
// per-pair scorer needs to be swapped in.
// -----------------------------------------------------------------------------

type RunBody = {
  cohortId?: unknown;
  round?: unknown;
};

const METRO_REGIONS = new Set(["서울", "경기도", "경기", "인천"]);

function normalizePhonePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// ---------------------------------------------------------------------------
// Score components
// ---------------------------------------------------------------------------

function callTimeOverlap(mr: MatchResponse, fr: MatchResponse): { score: number; shared: number } {
  const maleTimes = new Set(mr.callTimes ?? []);
  const shared = (fr.callTimes ?? []).filter((t) => maleTimes.has(t)).length;
  const maxLen = Math.max(
    mr.callTimes?.length ?? 0,
    fr.callTimes?.length ?? 0,
  );
  if (maxLen === 0) return { score: 0, shared: 0 };
  return { score: shared / maxLen, shared };
}

/**
 * Per-dim similarity on 1..5 Likert: 1 - |m-f|/4 → 0..1. Missing dims skipped.
 * If no dims, returns 0.5 (neutral).
 */
function convStyleComplement(mr: MatchResponse, fr: MatchResponse): number {
  const dims: [number | undefined, number | undefined][] = [
    [mr.convEnergy, fr.convEnergy],
    [mr.convThinking, fr.convThinking],
    [mr.convPlanning, fr.convPlanning],
    [mr.convPace, fr.convPace],
    [mr.convDepth, fr.convDepth],
  ];
  const present = dims.filter(
    ([a, b]) => typeof a === "number" && typeof b === "number",
  ) as [number, number][];
  if (present.length === 0) return 0.5;
  const sum = present.reduce((acc, [a, b]) => acc + (1 - Math.abs(a - b) / 4), 0);
  return sum / present.length;
}

/**
 * Cosine similarity on the 5-dim values vectors, mapped from [-1,1] to [0,1]
 * via (cos+1)/2. Missing dims default to 3 (neutral midpoint of 1..5 Likert).
 */
function valuesAlignment(mr: MatchResponse, fr: MatchResponse): number {
  const maleVec = [
    mr.valuesMarriage ?? 3,
    mr.valuesCareer ?? 3,
    mr.valuesFamily ?? 3,
    mr.valuesHobby ?? 3,
    mr.valuesIndependence ?? 3,
  ];
  const femaleVec = [
    fr.valuesMarriage ?? 3,
    fr.valuesCareer ?? 3,
    fr.valuesFamily ?? 3,
    fr.valuesHobby ?? 3,
    fr.valuesIndependence ?? 3,
  ];
  let dot = 0;
  let mn = 0;
  let fn = 0;
  for (let i = 0; i < 5; i++) {
    dot += maleVec[i] * femaleVec[i];
    mn += maleVec[i] * maleVec[i];
    fn += femaleVec[i] * femaleVec[i];
  }
  if (mn === 0 || fn === 0) return 0.5;
  const cos = dot / (Math.sqrt(mn) * Math.sqrt(fn));
  return (cos + 1) / 2;
}

function regionProximity(mr: MatchResponse, fr: MatchResponse): number {
  const m = (mr.region ?? "").trim();
  const f = (fr.region ?? "").trim();
  if (!m || !f) return 0.3;
  if (m === f) return 1.0;
  if (METRO_REGIONS.has(m) && METRO_REGIONS.has(f)) return 0.6;
  return 0.3;
}

function mbtiCompat(mr: MatchResponse, fr: MatchResponse): number {
  const m = (mr.mbti ?? "").toUpperCase();
  const f = (fr.mbti ?? "").toUpperCase();
  if (m.length !== 4 || f.length !== 4) return 0.5;
  let score = 0.3; // base
  // I/E + N/S axis
  if (m[0] === f[0] && m[1] === f[1]) score += 0.3;
  // J/P
  if (m[3] === f[3]) score += 0.2;
  // T/F
  if (m[2] === f[2]) score += 0.2;
  return Math.min(1.0, score);
}

// ---------------------------------------------------------------------------
// Composite score + reasoning
// ---------------------------------------------------------------------------

interface ScoreBreakdown {
  total: number;
  callTime: number;
  shared: number;
  convStyle: number;
  values: number;
  region: number;
  mbti: number;
}

function scorePair(mr: MatchResponse, fr: MatchResponse): ScoreBreakdown {
  const { score: ct, shared } = callTimeOverlap(mr, fr);
  const cs = convStyleComplement(mr, fr);
  const va = valuesAlignment(mr, fr);
  const rp = regionProximity(mr, fr);
  const mb = mbtiCompat(mr, fr);
  const total =
    0.30 * ct +
    0.25 * cs +
    0.25 * va +
    0.10 * rp +
    0.10 * mb;
  return {
    total: Math.round(total * 100) / 100,
    callTime: ct,
    shared,
    convStyle: cs,
    values: va,
    region: rp,
    mbti: mb,
  };
}

function reasoningFor(
  mr: MatchResponse,
  fr: MatchResponse,
  b: ScoreBreakdown,
): string {
  const mReg = (mr.region ?? "—").trim() || "—";
  const fReg = (fr.region ?? "—").trim() || "—";
  const regionNote =
    b.region >= 0.99
      ? `${mReg} (동일 지역)`
      : b.region >= 0.59
        ? `${mReg}-${fReg} (수도권 근접)`
        : `${mReg}-${fReg}`;
  return [
    `통화시간 ${b.shared}칸 공유`,
    `대화성향 유사도 ${b.convStyle.toFixed(2)}`,
    `가치관 정렬 ${b.values.toFixed(2)}`,
    regionNote,
  ].join(" · ");
}

// ---------------------------------------------------------------------------
// Greedy pairing (unchanged structure)
// ---------------------------------------------------------------------------

/**
 * Greedy pairing:
 * - Scores every (male, female) pair using match_response data.
 * - Sorts descending.
 * - Skips pairs blocked by exclusionSet or the optional "avoid" map
 *   (used to prevent round-2 from reusing round-1 partners).
 * - Also skips pairs with zero callTime overlap (hard filter).
 */
function greedyPair(
  males: Application[],
  females: Application[],
  responseByAppId: Map<string, MatchResponse>,
  exclusionSet: Set<string>,
  avoid?: Map<string, Set<string>>,
): {
  maleId: string;
  femaleId: string;
  score: number;
  reasoning: string;
}[] {
  type Candidate = {
    maleId: string;
    femaleId: string;
    score: number;
    reasoning: string;
  };

  const candidates: Candidate[] = [];
  for (const m of males) {
    const mr = responseByAppId.get(m.id);
    if (!mr) continue;
    for (const f of females) {
      const fr = responseByAppId.get(f.id);
      if (!fr) continue;
      // Hard filter: must share ≥1 call-time slot
      const maleTimes = new Set(mr.callTimes ?? []);
      const shared = (fr.callTimes ?? []).some((t) => maleTimes.has(t));
      if (!shared) continue;

      const [a, b] = normalizePhonePair(m.phone, f.phone);
      if (exclusionSet.has(`${a}|${b}`)) continue;
      if (avoid?.get(m.id)?.has(f.id)) continue;

      const breakdown = scorePair(mr, fr);
      candidates.push({
        maleId: m.id,
        femaleId: f.id,
        score: breakdown.total,
        reasoning: reasoningFor(mr, fr, breakdown),
      });
    }
  }

  candidates.sort((x, y) => y.score - x.score);

  const usedMale = new Set<string>();
  const usedFemale = new Set<string>();
  const result: {
    maleId: string;
    femaleId: string;
    score: number;
    reasoning: string;
  }[] = [];

  for (const c of candidates) {
    if (usedMale.has(c.maleId)) continue;
    if (usedFemale.has(c.femaleId)) continue;
    usedMale.add(c.maleId);
    usedFemale.add(c.femaleId);
    result.push(c);
  }

  return result;
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

  // Load candidate pool. Eligibility = approved AND has match_response.
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

  // Exclusions
  const exclusions = await listExclusions();
  const exclusionSet = new Set<string>(
    exclusions.map((e) => `${e.phoneA}|${e.phoneB}`),
  );

  // Prior published matchings — can't be overwritten, but we need to avoid
  // their male/female slots. We WILL delete existing draft rows first.
  const existing = await listMatchings(cohortId);
  const supabase = getSupabaseAdmin();

  const counts: Record<string, number> = { round1: 0, round2: 0 };

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

    // 4. Greedy pair
    const pairs = greedyPair(
      pairableMales,
      pairableFemales,
      responseByAppId,
      exclusionSet,
      avoid,
    );

    // 5. Insert as drafts
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
  });
}
