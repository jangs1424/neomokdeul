// -----------------------------------------------------------------------------
// Claude API client + pair scoring (Phase 12, cost-controlled)
//
// Defaults to claude-haiku-4-5 (~10x cheaper than Sonnet, still fluent KR).
// Caller (run/route.ts) is responsible for capping LLM call count.
//
// Reliability stack (Phase 13 improvements):
//   1. tool_use forced mode → guaranteed structured JSON from the model
//   2. Text-parse fallback with tryExtractJson (existing logic)
//   3. 1 automatic retry with 500ms delay on any failure
//   4. Prompt cache via cache_control: ephemeral on system prompt
// -----------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { MatchResponse } from "@neomokdeul/db";

const KEY = process.env.ANTHROPIC_API_KEY;
export const claudeConfigured = Boolean(KEY);

export interface LlmPairScore {
  score: number; // 0..1
  reasoning: string; // short 한국어 문장
}

// -----------------------------------------------------------------------------
// 호스트 휴리스틱 반영 시스템 프롬프트 (출처: docs/matching-heuristics.md)
//
// 핵심 룰:
//  + 성격 보완(낯가림×활발), 키워드 겹침(한강·카페·산책 등),
//    소울푸드·취미 결, 답변 분량/성의 매칭 → 가산점
//  + 성실하게 자기 설명, 배려 톤 → 가산점
//  − 자기애 과함, 과한 장난기, 자기자랑·외모/스펙 위주 → 감점
//  × MBTI 라벨·직업명으로 어울림 추정 금지 (편향 유발)
//  × 나이차는 라우터에서 하드필터로 이미 처리됨 (여기서 다시 보지 말 것)
// -----------------------------------------------------------------------------
const SYSTEM_PROMPT = `너는 너목들 매칭 호스트의 어시스턴트다.
두 참가자의 매칭 폼 답변을 보고 궁합 점수(0.0~1.0)와 한국어 사유(1~2문장)를 만든다.
반드시 rate_pair 도구를 호출하여 score와 reasoning을 반환한다.

## 가산 신호 (점수 올림)
1. **성격 보완형**: 한쪽이 낯가림·조용·듣는 편이면 다른쪽이 먼저 말 걸고 리액션 풍부 → 대화 리듬이 살아남.
2. **키워드 겹침**: 구체적 장소·활동 키워드(한강·카페·서점·전시·산책·달리기·등산·드라이브·맛집·재즈·인디 등)가 답변에 같이 나오면 큰 +.
3. **소울푸드·취미 결 일치**: Day1 소울푸드 / Day2 취미가 같은 카테고리(예: 기름진 음식끼리, 한식끼리, 운동 vs 감상 vs 생산형 취미별)면 +.
4. **분량·성의 매칭**: 둘 다 길게 정성껏 썼거나 둘 다 짧게 썼으면 +. 한쪽만 길고 한쪽은 한 줄짜리면 -(에너지·기대치 mismatch는 잠수 위험).
5. **성실한 자기 설명·배려 톤**: 자신을 차분히 설명하고 상대 입장 고려한 표현이 보이면 +.

## 감산 신호 (점수 내림)
1. **자기애 과함·자기자랑·외모/스펙 위주**: 톤이 자기 어필에 치우쳐 있으면 -.
2. **과하게 장난스러운 답변**: 진중함이 안 보이고 가볍게 신청한 느낌이면 -.

## 사용 금지 신호
- **MBTI 라벨·직업명으로 어울림 추정 금지**: "INTJ니까 / 개발자니까" 같은 사전 판단은 편향이라 쓰지 말 것. 라벨이 아니라 자유서술 답변(대화 스타일·낯선이 대할 때·매력 포인트)으로 결을 읽어야 한다.

## 사유 작성 규칙
- 1~2문장, 한국어
- 어떤 답변/키워드를 보고 그렇게 점수 매겼는지 구체적으로 (예: "둘 다 한강·산책 키워드 일치, 대화 톤도 차분하게 잘 맞음")`;

const MODEL = "claude-haiku-4-5-20251001";

// Tool definition — forced tool_use guarantees structured JSON output
const RATE_PAIR_TOOL = {
  name: "rate_pair",
  description: "두 참가자의 궁합 점수와 한국어 사유 출력",
  input_schema: {
    type: "object" as const,
    properties: {
      score: {
        type: "number" as const,
        description: "궁합 점수 0.0~1.0",
      },
      reasoning: {
        type: "string" as const,
        description: "한국어 사유 1~2문장",
      },
    },
    required: ["score", "reasoning"],
  },
} as const;

/**
 * Robust JSON extraction — handles Haiku's ```json fence wrapping, prose
 * before/after, and partial truncation. Returns null only if nothing parses.
 * Used as fallback when tool_use mode fails.
 */
function tryExtractJson(text: string): { score: unknown; reasoning: unknown } | null {
  let s = text.trim();
  // Strip ```json ... ``` fences (Haiku style)
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");

  // 1) strict
  try { return JSON.parse(s); } catch {}

  // 2) greedy {...} — captures a full object even with nested values
  const greedy = s.match(/\{[\s\S]*\}/);
  if (greedy) {
    try { return JSON.parse(greedy[0]); } catch {}
  }

  // 3) non-greedy fallback (in case the greedy one captured trailing junk)
  const lazy = s.match(/\{[\s\S]*?\}/);
  if (lazy) {
    try { return JSON.parse(lazy[0]); } catch {}
  }
  return null;
}

/** Single attempt: tool_use first, text-parse fallback */
async function attemptScore(
  client: Anthropic,
  userMsg: string,
): Promise<LlmPairScore> {
  // ── Path A: forced tool_use (guaranteed structured JSON) ──────────────────
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // seed prompt cache on first call
        },
      ],
      tools: [RATE_PAIR_TOOL],
      tool_choice: { type: "tool", name: "rate_pair" },
      messages: [{ role: "user", content: userMsg }],
    });

    const block = res.content.find((b) => b.type === "tool_use");
    if (block && block.type === "tool_use" && block.name === "rate_pair") {
      const input = block.input as { score?: unknown; reasoning?: unknown };
      const rawScore = Number(input.score);
      if (Number.isFinite(rawScore)) {
        return {
          score: Math.max(0, Math.min(1, rawScore)),
          reasoning:
            typeof input.reasoning === "string" ? input.reasoning : "사유 누락",
        };
      }
    }
    // tool_use block missing or malformed — fall through to text path
    console.warn("[claude] tool_use block missing or malformed, falling back to text parse");
  } catch (toolErr) {
    console.warn("[claude] tool_use request failed, falling back to text parse:", toolErr);
  }

  // ── Path B: text-parse fallback (existing logic) ──────────────────────────
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 240,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMsg }],
  });

  const text = res.content
    .map((b) => ("text" in b ? b.text : ""))
    .join("");

  const obj = tryExtractJson(text);
  if (!obj) {
    console.error("[claude] text fallback also failed. Raw response (first 200 chars):", text.slice(0, 200));
    throw new Error(`Claude response missing JSON: ${text.slice(0, 100)}`);
  }

  const rawScore = Number((obj as { score: unknown }).score);
  if (!Number.isFinite(rawScore)) {
    console.error("[claude] score not numeric. Raw response (first 200 chars):", text.slice(0, 200));
    throw new Error("Claude score not numeric");
  }
  const reasoningRaw = (obj as { reasoning: unknown }).reasoning;
  return {
    score: Math.max(0, Math.min(1, rawScore)),
    reasoning: typeof reasoningRaw === "string" ? reasoningRaw : "사유 누락",
  };
}

export async function scorePairWithLlm(
  male: MatchResponse,
  female: MatchResponse,
  slotOverlapCount: number,
): Promise<LlmPairScore> {
  if (!KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const client = new Anthropic({ apiKey: KEY });
  const userMsg = formatPairForPrompt(male, female, slotOverlapCount);

  // First attempt
  try {
    return await attemptScore(client, userMsg);
  } catch (firstErr) {
    console.warn("[claude] First attempt failed, retrying in 500ms:", firstErr);
  }

  // One automatic retry with small delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return attemptScore(client, userMsg); // throws if retry also fails
}

function formatPairForPrompt(
  m: MatchResponse,
  f: MatchResponse,
  slots: number,
): string {
  const render = (label: string, r: MatchResponse) => `## ${label}
닉네임: ${r.nickname}
지역: ${r.region}
MBTI: ${r.mbti ?? ""}
대화 스타일: ${r.convStyleSelf ?? ""}
낯선이와: ${r.convWithStrangers ?? ""}
매력: ${r.convAttraction ?? ""}
중요: ${r.idealImportant ?? ""}
소울메이트 조건: ${r.idealSoulmateMust ?? ""}
기대하는 관계: ${r.idealRelationship ?? ""}
파트너에게 물을 것: ${r.idealPartnerQ ?? ""}
소울푸드: ${r.day1Soulfood ?? ""}
취미: ${r.day2Hobby ?? ""}
좋아하는 장소: ${r.day3Place ?? ""}
같이 하고 싶은 것: ${r.day4Together ?? ""}`;

  return `두 참가자 궁합 점수와 사유를 JSON으로 답하시오. (공통 통화 슬롯: ${slots}개)

${render("남성", m)}

${render("여성", f)}`;
}
