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

/**
 * Age hard filter — host's matching rule (docs/matching-heuristics.md §8).
 *   - 기본 ±3살, 남자가 연상이면 +4살까지 OK
 *   - 한쪽 ≤23이면 상대 ≤26 (라이프스테이지 차이 컷)
 *   - 동갑/남자연상 우선순위는 ageOrientationBonus()에서 점수로 처리
 */
function agesOk(maleApp: Application, femaleApp: Application, refYear: number): boolean {
  const maleAge = refYear - maleApp.birthYear;
  const femaleAge = refYear - femaleApp.birthYear;
  const diff = maleAge - femaleAge; // >0: male older
  if (diff > 4) return false;
  if (diff < -3) return false;
  if (maleAge <= 23 && femaleAge > 26) return false;
  if (femaleAge <= 23 && maleAge > 26) return false;
  return true;
}

/**
 * 나이 방향 가/감점 — 호스트 우선순위:
 *   1순위 남자 연상(Δ>0): +0.05
 *   2순위 동갑(Δ=0): -0.02 (소폭 디스선호 — 너무 많이 만들지 않게)
 *   3순위 여자 연상(Δ<0): -0.08 (강한 디스선호)
 * 하드필터(agesOk)에서 여자 연상 ≤3살, 남자 연상 ≤4살로 컷됨.
 * 합계가 score를 0..1 범위 밖으로 보낼 수 있으니 호출부에서 clamp 필요.
 */
function ageOrientationBonus(maleApp: Application, femaleApp: Application, refYear: number): number {
  const diff = (refYear - maleApp.birthYear) - (refYear - femaleApp.birthYear);
  if (diff > 0) return 0.05;
  if (diff === 0) return -0.02;
  return -0.08;
}

// ---------------------------------------------------------------------------
// Content-based signal vocabulary (docs/matching-heuristics.md §1-§4)
// 단순 substring match — 정밀도보다 재현율 우선. Claude가 최종 30페어 폴리시.
// ---------------------------------------------------------------------------
const PLACE_KEYWORDS = [
  '한강','카페','서점','전시','미술관','공원','박물관','극장','공연장','도서관',
  '북한산','남산','관악산','청계천','덕수궁','경복궁','창경궁',
  '홍대','이태원','강남','성수','연남','익선동','망원','북촌','삼청동','한남',
  '제주','부산','강릉','속초','여수','경주','전주',
  '바다','숲','해변','야경',
];
const ACTIVITY_KEYWORDS = [
  '산책','달리기','러닝','등산','트레킹','하이킹','자전거','라이딩','드라이브','캠핑','피크닉',
  '맛집','맛집탐방','카페투어','쿠킹','베이킹','요리',
  '여행','국내여행','해외여행','휴가','출사',
  '요가','필라테스','운동','헬스','클라이밍','테니스','수영','골프',
  '독서','글쓰기','사진','드로잉','그림','피아노','기타',
  '영화','전시관람','공연','뮤지컬','콘서트','페스티벌',
  '게임','보드게임','방탈출',
];
const MUSIC_KEYWORDS = ['재즈','클래식','인디','락','힙합','발라드','팝','가요','시티팝'];

const FOOD_CATEGORIES: { label: string; words: string[] }[] = [
  { label: '기름진·고기', words: ['치킨','피자','햄버거','파스타','스테이크','갈비','삼겹살','곱창','고기','기름'] },
  { label: '한식 담백', words: ['된장찌개','김치찌개','청국장','백반','나물','비빔밥','한식','집밥','국밥'] },
  { label: '분식·간편', words: ['떡볶이','마라탕','라면','김밥','분식','우동','컵라면','떡국'] },
  { label: '건강·비건', words: ['샐러드','비건','채식','그릭','프로틴','브런치','과일','건강'] },
  { label: '아시안', words: ['초밥','라멘','카레','타코','팟타이','포','쌀국수','아시안'] },
  { label: '디저트·카페', words: ['디저트','케이크','빵','베이커리','마카롱','도넛','아이스크림','달달','커피'] },
];

const QUIET_LEXICON = ['조용','차분','듣','경청','내향','낯가림','낯선','어색','과묵','수줍','숫기'];
const ACTIVE_LEXICON = ['활발','외향','리액션','먼저 말','잘 웃','발랄','에너지','수다','조잘','시끄','유머'];

function sharedKeywords(a: string, b: string, vocab: string[]): string[] {
  const hit: string[] = [];
  for (const kw of vocab) {
    if (a.includes(kw) && b.includes(kw)) hit.push(kw);
  }
  return hit;
}

/** 장소·활동·음악 키워드 공유 */
function keywordOverlapSignal(mr: MatchResponse, fr: MatchResponse): { bonus: number; matched: string[] } {
  const mText = [mr.day3Place, mr.day4Together, mr.day2Hobby, mr.convAttraction, mr.idealSoulmateMust]
    .filter(Boolean).join(' ').toLowerCase();
  const fText = [fr.day3Place, fr.day4Together, fr.day2Hobby, fr.convAttraction, fr.idealSoulmateMust]
    .filter(Boolean).join(' ').toLowerCase();
  const all = [
    ...sharedKeywords(mText, fText, PLACE_KEYWORDS),
    ...sharedKeywords(mText, fText, ACTIVITY_KEYWORDS),
    ...sharedKeywords(mText, fText, MUSIC_KEYWORDS),
  ];
  const deduped = Array.from(new Set(all));
  // 공통 키워드 1개당 +0.03, 상한 0.15
  return { bonus: Math.min(0.15, deduped.length * 0.03), matched: deduped };
}

/** 소울푸드 같은 카테고리 */
function foodAffinitySignal(mr: MatchResponse, fr: MatchResponse): { bonus: number; category: string | null } {
  const m = (mr.day1Soulfood ?? '').toLowerCase();
  const f = (fr.day1Soulfood ?? '').toLowerCase();
  if (!m || !f) return { bonus: 0, category: null };
  for (const cat of FOOD_CATEGORIES) {
    if (cat.words.some(w => m.includes(w)) && cat.words.some(w => f.includes(w))) {
      return { bonus: 0.06, category: cat.label };
    }
  }
  return { bonus: 0, category: null };
}

/** 답변 분량 매칭 (성의·에너지 일치) */
function effortMatchSignal(mr: MatchResponse, fr: MatchResponse): { bonus: number; ratio: number } {
  const fields = [
    'convStyleSelf','convWithStrangers','convAttraction',
    'idealImportant','idealSoulmateMust','idealRelationship','idealPartnerQ',
    'day1Soulfood','day2Hobby','day3Place','day4Together',
  ] as const;
  let mLen = 0, fLen = 0;
  for (const k of fields) {
    mLen += (mr[k] as string | undefined)?.length ?? 0;
    fLen += (fr[k] as string | undefined)?.length ?? 0;
  }
  if (mLen === 0 || fLen === 0) return { bonus: 0, ratio: 0 };
  const ratio = Math.min(mLen, fLen) / Math.max(mLen, fLen); // 0..1
  // ratio 0.5 이하면 0, 1.0이면 +0.05 (선형)
  const bonus = ratio >= 0.5 ? 0.05 * ((ratio - 0.5) / 0.5) : 0;
  return { bonus, ratio };
}

/** 낯가림×활발 성격 보완 or 같은 톤 */
function personalityComplementSignal(mr: MatchResponse, fr: MatchResponse): { bonus: number; note: string | null } {
  const m = [mr.convStyleSelf, mr.convWithStrangers].filter(Boolean).join(' ').toLowerCase();
  const f = [fr.convStyleSelf, fr.convWithStrangers].filter(Boolean).join(' ').toLowerCase();
  const mQuiet = QUIET_LEXICON.some(w => m.includes(w));
  const mActive = ACTIVE_LEXICON.some(w => m.includes(w));
  const fQuiet = QUIET_LEXICON.some(w => f.includes(w));
  const fActive = ACTIVE_LEXICON.some(w => f.includes(w));
  if ((mQuiet && !mActive && fActive && !fQuiet) || (fQuiet && !fActive && mActive && !mQuiet)) {
    return { bonus: 0.08, note: '성격 보완형(차분×활발)' };
  }
  if (mActive && fActive && !mQuiet && !fQuiet) return { bonus: 0.03, note: '둘 다 활발' };
  if (mQuiet && fQuiet && !mActive && !fActive) return { bonus: 0.03, note: '둘 다 차분' };
  return { bonus: 0, note: null };
}

// ---------------------------------------------------------------------------
// 종합 휴리스틱 — 슬롯 + 나이방향 + 내용 시그널 (greedy가 이걸로 정렬)
// ---------------------------------------------------------------------------
function computeHeuristicScore(
  maleApp: Application,
  femaleApp: Application,
  mr: MatchResponse,
  fr: MatchResponse,
  slotOverlap: number,
  refYear: number,
): { rawScore: number; reasoning: string } {
  // 슬롯은 작은 기여(이미 ≥2 하드필터 통과): 0.35..0.45
  const slotBase = 0.35 + Math.min(4, slotOverlap) * 0.025;
  const kw = keywordOverlapSignal(mr, fr);
  const food = foodAffinitySignal(mr, fr);
  const effort = effortMatchSignal(mr, fr);
  const personality = personalityComplementSignal(mr, fr);
  const ageBonus = ageOrientationBonus(maleApp, femaleApp, refYear);

  const rawScore = slotBase + kw.bonus + food.bonus + effort.bonus + personality.bonus + ageBonus;

  const parts: string[] = [`슬롯 ${slotOverlap}개`];
  if (kw.matched.length) parts.push(`키워드[${kw.matched.slice(0, 4).join(',')}]`);
  if (food.category) parts.push(`소울푸드 ${food.category}`);
  if (effort.ratio >= 0.7) parts.push(`분량 비슷(${Math.round(effort.ratio * 100)}%)`);
  if (personality.note) parts.push(personality.note);
  if (ageBonus > 0) parts.push('남자 연상');
  else if (ageBonus === -0.02) parts.push('동갑');
  else if (ageBonus < -0.02) parts.push('여자 연상');

  return { rawScore, reasoning: parts.join(' · ') };
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
  refYear: number,
): Promise<{ pairs: Candidate[]; skippedLowOverlap: number; skippedAge: number; skippedNoOpenchat: number; llmCalls: number }> {
  // ---- Step 1: build heuristic candidates ----
  const candidates: Candidate[] = [];
  let skippedLowOverlap = 0;
  let skippedAge = 0;
  let skippedNoOpenchat = 0;

  for (const m of males) {
    const mr = responseByAppId.get(m.id);
    if (!mr) continue;

    // Safety net: male must have a 1:1 KakaoTalk openchat URL
    // (form already enforces required, but block at algorithm level too).
    if (!mr.kakaoOpenchatUrl || !mr.kakaoOpenchatUrl.trim()) {
      skippedNoOpenchat++;
      continue;
    }

    for (const f of females) {
      const fr = responseByAppId.get(f.id);
      if (!fr) continue;

      if (!genderPrefsOk(mr, fr)) continue;

      if (!agesOk(m, f, refYear)) {
        skippedAge++;
        continue;
      }

      const [a, b] = normalizePhonePair(m.phone, f.phone);
      if (exclusionSet.has(`${a}|${b}`)) continue;

      if (avoid?.get(m.id)?.has(f.id)) continue;

      const overlap = roundSlotOverlap(mr, fr, dateSet);
      if (overlap < 2) {
        skippedLowOverlap++;
        continue;
      }

      const h = computeHeuristicScore(m, f, mr, fr, overlap, refYear);
      candidates.push({
        maleId: m.id,
        femaleId: f.id,
        mr,
        fr,
        overlap,
        score: h.rawScore, // greedy 정렬용 — 스토리지 직전에 clamp
        reasoning: h.reasoning,
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

  // ---- Step 3: LLM-rescore final pairs (concurrency-limited to avoid 429s) ----
  let llmCalls = 0;
  if (claudeConfigured && pairs.length > 0) {
    const toScore = pairs.slice(0, MAX_LLM_CALLS_PER_ROUND);
    // Run in batches of 5 to stay well under Haiku rate limits
    const BATCH_SIZE = 5;
    for (let batchStart = 0; batchStart < toScore.length; batchStart += BATCH_SIZE) {
      const batch = toScore.slice(batchStart, batchStart + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((p) => scorePairWithLlm(p.mr, p.fr, p.overlap)),
      );
      for (let j = 0; j < batch.length; j++) {
        const res = results[j];
        const i = batchStart + j;
        llmCalls++;
        if (res.status === "fulfilled") {
          toScore[i].score = Math.round(res.value.score * 100) / 100;
          toScore[i].reasoning = res.value.reasoning;
        } else {
          console.error("[matching/run] LLM call failed for pair", i, ":", res.reason);
          toScore[i].reasoning = `${toScore[i].reasoning} · LLM 실패`;
        }
      }
      // Small inter-batch delay to avoid burst rate limiting
      if (batchStart + BATCH_SIZE < toScore.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  return { pairs, skippedLowOverlap, skippedAge, skippedNoOpenchat, llmCalls };
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
  let totalSkippedAge = 0;
  let totalSkippedNoOpenchat = 0;
  let totalLlmCalls = 0;

  // refYear: program start year — deterministic across runs of the same cohort
  const refYear = Number(cohort.programStartDate.slice(0, 4)) || new Date().getFullYear();

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
    const { pairs, skippedLowOverlap, skippedAge, skippedNoOpenchat, llmCalls } = await buildAndPair(
      pairableMales,
      pairableFemales,
      responseByAppId,
      dateSet,
      exclusionSet,
      avoid,
      refYear,
    );
    totalSkippedLowOverlap += skippedLowOverlap;
    totalSkippedAge += skippedAge;
    totalSkippedNoOpenchat += skippedNoOpenchat;
    totalLlmCalls += llmCalls;

    // 6. Insert drafts
    for (const p of pairs) {
      // clamp raw greedy score to 0..1 for DB storage
      const storedScore = Math.round(Math.max(0, Math.min(1, p.score)) * 100) / 100;
      await createMatching({
        cohortId,
        round,
        maleApplicationId: p.maleId,
        femaleApplicationId: p.femaleId,
        score: storedScore,
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
    skippedAge: totalSkippedAge,
    skippedNoOpenchat: totalSkippedNoOpenchat,
    llmMode: claudeConfigured ? "claude-haiku-4.5" : "heuristic",
    llmCalls: totalLlmCalls,
    estCostUsd: Number((totalLlmCalls * 0.0004).toFixed(4)),
  });
}
