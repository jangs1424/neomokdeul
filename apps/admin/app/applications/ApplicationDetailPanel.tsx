"use client";

import type { Application, MatchResponse } from "@neomokdeul/db";
import { AudioPlayer } from "./AudioPlayer";
import { PhotoModal } from "./PhotoModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KOREAN_DOW = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * "2026-05-15_18-22" → "5/15(목) 18-22시"
 * Defensive: returns the raw string if parsing fails.
 */
function formatSlot(s: string): string {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})_(\d{1,2})-(\d{1,2})$/);
  if (!m) return s;
  const [, y, mo, d, sh, eh] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (isNaN(date.getTime())) return s;
  const dow = KOREAN_DOW[date.getDay()];
  return `${Number(mo)}/${Number(d)}(${dow}) ${Number(sh)}-${Number(eh)}시`;
}

const CONV_FIELDS: [string, keyof MatchResponse][] = [
  ["대화할 때 이런 사람", "convStyleSelf"],
  ["낯선이와 함께할 때", "convWithStrangers"],
  ["매력 포인트", "convAttraction"],
];

const IDEAL_FIELDS: [string, keyof MatchResponse][] = [
  ["사람 볼 때 중요한 것", "idealImportant"],
  ["소울메이트라면", "idealSoulmateMust"],
  ["기대하는 관계", "idealRelationship"],
  ["파트너에게 하고 싶은 질문", "idealPartnerQ"],
];

const DAY_FIELDS: [string, keyof MatchResponse][] = [
  ["Day 1 소울푸드", "day1Soulfood"],
  ["Day 2 취미", "day2Hobby"],
  ["Day 3 장소", "day3Place"],
  ["Day 4 함께하고 싶은 것", "day4Together"],
  ["Day 5 개인 미션", "day5SecretMission"],
];

// ---------------------------------------------------------------------------
// Prose row for label + text
// ---------------------------------------------------------------------------

function ProseRow({ label, value }: { label: string; value?: string }) {
  const v = (value ?? "").trim();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 12, alignItems: "baseline" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: v ? "var(--text)" : "var(--text-muted)",
          lineHeight: 1.7,
          fontStyle: v ? "normal" : "italic",
          whiteSpace: "pre-wrap",
        }}
      >
        {v || "— 미작성"}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match form section (Tally shape)
// ---------------------------------------------------------------------------

function MatchResponseSection({ r }: { r: MatchResponse }) {
  const matchGenderLabel =
    r.matchGender === "opposite"
      ? "이성"
      : r.matchGender === "same"
        ? "동성"
        : r.matchGender === "any"
          ? "무관"
          : "—";

  const phoneTypeLabel =
    r.phoneType === "iphone"
      ? "아이폰"
      : r.phoneType === "galaxy"
        ? "갤럭시"
        : r.phoneType === "other"
          ? "기타"
          : "—";

  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 20,
        borderTop: "2px dashed var(--border)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <h4
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#065f46",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          ✉ 매칭 폼 답변
        </h4>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          제출: {new Date(r.submittedAt).toLocaleString("ko-KR")}
        </span>
      </div>

      {/* Chip line: nickname · 문토닉 · region · MBTI · matchGender · phoneType · openchat */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: "var(--text)",
        }}
      >
        <span>
          <strong>닉네임:</strong> {r.nickname}
        </span>
        {r.muntoNickname && (
          <span>
            <strong>문토닉:</strong> {r.muntoNickname}
          </span>
        )}
        <span>
          <strong>지역:</strong> {r.region}
        </span>
        {r.mbti && (
          <span>
            <strong>MBTI:</strong> {r.mbti}
          </span>
        )}
        <span>
          <strong>매칭희망:</strong> {matchGenderLabel}
        </span>
        <span>
          <strong>휴대폰:</strong> {phoneTypeLabel}
        </span>
        {r.kakaoOpenchatUrl && (
          <span>
            <strong>오픈채팅:</strong>{" "}
            <a
              href={r.kakaoOpenchatUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#1e40af", textDecoration: "underline" }}
            >
              열기 ↗
            </a>
          </span>
        )}
      </div>

      {/* 대화 성향 */}
      <div style={{ marginBottom: 20 }}>
        <SectionHeader>대화 성향</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CONV_FIELDS.map(([label, key]) => (
            <ProseRow key={key} label={label} value={r[key] as string | undefined} />
          ))}
        </div>
      </div>

      {/* 이상형·가치관 */}
      <div style={{ marginBottom: 20 }}>
        <SectionHeader>이상형·가치관</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {IDEAL_FIELDS.map(([label, key]) => (
            <ProseRow key={key} label={label} value={r[key] as string | undefined} />
          ))}
        </div>
      </div>

      {/* Day별 답변 */}
      <div style={{ marginBottom: 20 }}>
        <SectionHeader>Day별 답변</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DAY_FIELDS.map(([label, key]) => (
            <ProseRow key={key} label={label} value={r[key] as string | undefined} />
          ))}
        </div>
      </div>

      {/* 일정 */}
      <div>
        <SectionHeader>일정</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ProseRow
            label="통화 가능"
            value={
              r.availableSlots && r.availableSlots.length > 0
                ? r.availableSlots.map(formatSlot).join(", ")
                : ""
            }
          />
          <ProseRow
            label="개더링 참여"
            value={
              r.gatheringDates && r.gatheringDates.length > 0
                ? r.gatheringDates.join(", ")
                : ""
            }
          />
          <ProseRow
            label="마케팅 동의"
            value={r.marketingAgreed ? "동의" : "거부"}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: multiline ? 1.7 : 1.5,
          color: "var(--text)",
          whiteSpace: multiline ? "pre-wrap" : "normal",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function ApplicationDetailPanel({
  app,
  voiceUrl,
  photoUrl,
  matchResponse,
}: {
  app: Application;
  voiceUrl: string | null;
  photoUrl: string | null;
  matchResponse?: MatchResponse | null;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "24px 28px 28px",
      }}
    >
      {/* Photo + voice + motivation */}
      <div style={{ display: "flex", gap: 28, marginBottom: 24 }}>
        {photoUrl ? (
          <div style={{ flexShrink: 0, position: "relative" }}>
            <PhotoModal
              src={photoUrl}
              alt={`${app.name} 사진`}
              thumbSize={260}
            />
            <div
              style={{
                position: "absolute",
                right: 8,
                bottom: 8,
                padding: "3px 8px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 11,
                letterSpacing: ".03em",
                pointerEvents: "none",
              }}
            >
              클릭하면 크게 🔍
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 260,
              height: 260,
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            사진 없음
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              음성 자기소개
            </div>
            {voiceUrl ? (
              <AudioPlayer src={voiceUrl} />
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>— 업로드 없음</div>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              지원 동기
            </div>
            <div
              style={{
                padding: "12px 14px",
                background: "var(--surface-2)",
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                color: "var(--text)",
              }}
            >
              {app.motivation}
            </div>
          </div>
        </div>
      </div>

      {/* Remaining fields grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px 24px",
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
        <Field
          label="통화 가능 시간대"
          value={app.callTimes?.length ? app.callTimes.join(" · ") : "—"}
        />
        <Field
          label="이전 기수 참여"
          value={app.previousCohort ? "있음" : "없음"}
        />
        <Field label="유입경로" value={app.source} />
        <Field
          label="신청 일시"
          value={new Date(app.createdAt).toLocaleString("ko-KR")}
        />
        {app.updatedAt && (
          <Field
            label="최근 처리"
            value={new Date(app.updatedAt).toLocaleString("ko-KR")}
          />
        )}
        {app.note && (
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="메모" value={app.note} multiline />
          </div>
        )}
      </div>

      {/* Match form answers section */}
      {matchResponse ? (
        <MatchResponseSection r={matchResponse} />
      ) : (
        <div
          style={{
            marginTop: 20,
            padding: "10px 14px",
            background: "var(--warning-soft)",
            color: "#92400e",
            borderRadius: 6,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          ⚠ 매칭 폼 미제출 — 매칭 대상에서 제외됩니다
        </div>
      )}
    </div>
  );
}
