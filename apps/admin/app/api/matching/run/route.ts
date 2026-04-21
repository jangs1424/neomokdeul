import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  listApplications,
  listExclusions,
  listMatchings,
  createMatching,
  type Application,
  type Matching,
} from "@neomokdeul/db";

// -----------------------------------------------------------------------------
// Matching algorithm — MVP greedy with heuristic scoring.
//
// TODO(phase-6+): replace scorePair() with a call to Claude (reasoning text)
// using the applicants' motivation + call_times + mbti + region. Keep structure:
//   score 0..1, reasoning string.
// -----------------------------------------------------------------------------

type RunBody = {
  cohortId?: unknown;
  round?: unknown;
};

function normalizePhonePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function scorePair(male: Application, female: Application): number {
  // Age proximity component: within 10 years → 1.0, beyond → decays to 0.
  const ageDelta = Math.abs(male.birthYear - female.birthYear);
  const ageScore = Math.max(0, 1 - ageDelta / 10);

  // Call-time overlap component.
  const maleTimes = new Set(male.callTimes ?? []);
  const sharedCount = (female.callTimes ?? []).filter((t) => maleTimes.has(t)).length;
  const maxLen = Math.max(
    1,
    male.callTimes?.length ?? 0,
    female.callTimes?.length ?? 0,
  );
  const timeScore = sharedCount / maxLen;

  // Blend (both must be decent → multiply). Clamp to [0,1] with 2 decimals.
  const raw = ageScore * (0.25 + 0.75 * timeScore);
  return Math.round(raw * 100) / 100;
}

function reasoningStub(
  male: Application,
  female: Application,
  score: number,
): string {
  const shared =
    (male.callTimes ?? []).filter((t) =>
      (female.callTimes ?? []).includes(t),
    ).join(", ") || "없음";
  return [
    `연령 차이 ${Math.abs(male.birthYear - female.birthYear)}년`,
    `공유 통화 시간대: ${shared}`,
    `MBTI ${male.mbti ?? "—"} × ${female.mbti ?? "—"}`,
    `heuristic score ${score.toFixed(2)} (Claude 미연동 · stub)`,
  ].join(" · ");
}

/**
 * Greedy pairing.
 * - Scores every (male, female) pair.
 * - Sorts descending.
 * - Skips pairs blocked by exclusionSet or the optional "avoid" map
 *   (used to prevent round-2 from reusing round-1 partners).
 */
function greedyPair(
  males: Application[],
  females: Application[],
  exclusionSet: Set<string>,
  avoid?: Map<string, Set<string>>,
): { maleId: string; femaleId: string; score: number }[] {
  type Candidate = {
    maleId: string;
    femaleId: string;
    malePhone: string;
    femalePhone: string;
    score: number;
  };

  const candidates: Candidate[] = [];
  for (const m of males) {
    for (const f of females) {
      const [a, b] = normalizePhonePair(m.phone, f.phone);
      if (exclusionSet.has(`${a}|${b}`)) continue;
      if (avoid?.get(m.id)?.has(f.id)) continue;
      candidates.push({
        maleId: m.id,
        femaleId: f.id,
        malePhone: m.phone,
        femalePhone: f.phone,
        score: scorePair(m, f),
      });
    }
  }

  candidates.sort((x, y) => y.score - x.score);

  const usedMale = new Set<string>();
  const usedFemale = new Set<string>();
  const result: { maleId: string; femaleId: string; score: number }[] = [];

  for (const c of candidates) {
    if (usedMale.has(c.maleId)) continue;
    if (usedFemale.has(c.femaleId)) continue;
    usedMale.add(c.maleId);
    usedFemale.add(c.femaleId);
    result.push({ maleId: c.maleId, femaleId: c.femaleId, score: c.score });
  }

  return result;
}

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

  // Load candidate pool (MVP: approved, payment gate deferred)
  const allApps = await listApplications();
  const pool = allApps.filter(
    (a) => a.cohortId === cohortId && a.status === "approved",
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
      exclusionSet,
      avoid,
    );

    // 5. Insert as drafts
    for (const p of pairs) {
      const male = pairableMales.find((m) => m.id === p.maleId)!;
      const female = pairableFemales.find((f) => f.id === p.femaleId)!;
      await createMatching({
        cohortId,
        round,
        maleApplicationId: p.maleId,
        femaleApplicationId: p.femaleId,
        score: p.score,
        reasoning: reasoningStub(male, female, p.score),
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
    round1: counts.round1 ?? 0,
    round2: counts.round2 ?? 0,
  });
}
