"use client";

import type { Application } from "@neomokdeul/db";
import { AudioPlayer } from "./AudioPlayer";

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
}: {
  app: Application;
  voiceUrl: string | null;
  photoUrl: string | null;
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
      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${app.name} 사진`}
            style={{
              width: 160,
              height: 160,
              borderRadius: 10,
              objectFit: "cover",
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 160,
              height: 160,
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
    </div>
  );
}
