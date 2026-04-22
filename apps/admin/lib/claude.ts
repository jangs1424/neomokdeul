// -----------------------------------------------------------------------------
// Claude API client + pair scoring (Phase 12)
//
// Called from api/matching/run/route.ts for each eligible (male, female) pair.
// Returns { score: 0..1, reasoning: short Korean sentence }.
//
// Defaults to `claude-sonnet-4-6` (cheap-ish + fast for ~N^2 calls). Swap to
// `claude-opus-4-7` if quality matters more than cost.
//
// TODOs:
//  - Add request timeout via AbortController if Anthropic SDK adds a long tail
//  - Add price/latency cap (e.g. skip LLM if pair count > 200)
//  - Prompt caching: the system prompt is stable — add cache_control once
//    call volume justifies it (break-even at ~2 requests).
// -----------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { MatchResponse } from "@neomokdeul/db";

const KEY = process.env.ANTHROPIC_API_KEY;
export const claudeConfigured = Boolean(KEY);

export interface LlmPairScore {
  score: number; // 0..1
  reasoning: string; // short 한국어 문장
}

const SYSTEM_PROMPT = `당신은 너목들 매칭 호스트의 어시스턴트. 두 참가자의 매칭 폼 답변을 보고 0.0~1.0 궁합 점수와 한국어로 2-3문장의 매칭 사유를 생성한다. 가치관, 대화 스타일, 공통 흥미, 표현 방식의 결을 고려한다. 반드시 JSON으로 {"score": number, "reasoning": string} 형식으로만 답한다.`;

export async function scorePairWithLlm(
  male: MatchResponse,
  female: MatchResponse,
  slotOverlapCount: number,
): Promise<LlmPairScore> {
  if (!KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const client = new Anthropic({ apiKey: KEY });
  const userMsg = formatPairForPrompt(male, female, slotOverlapCount);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  // Collect text content
  const text = res.content
    .map((b) => ("text" in b ? b.text : ""))
    .join("");

  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Claude response missing JSON");

  let parsed: LlmPairScore;
  try {
    parsed = JSON.parse(m[0]) as LlmPairScore;
  } catch (e) {
    throw new Error(
      `Claude JSON parse failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  const rawScore = Number(parsed.score);
  if (!Number.isFinite(rawScore)) {
    throw new Error("Claude score not numeric");
  }
  parsed.score = Math.max(0, Math.min(1, rawScore));
  if (typeof parsed.reasoning !== "string") {
    parsed.reasoning = "Claude 사유 누락";
  }
  return parsed;
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
