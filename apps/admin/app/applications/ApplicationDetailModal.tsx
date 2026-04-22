"use client";

import { useEffect } from "react";
import type { Application } from "@neomokdeul/db";
import { ActionButtons } from "./ActionButtons";
import { AudioPlayer } from "./AudioPlayer";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  pending: { background: "var(--warning-soft)", color: "#92400e" },
  approved: { background: "var(--accent-soft)", color: "#065f46" },
  rejected: { background: "var(--danger-soft)", color: "#991b1b" },
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        ...STATUS_STYLE[status],
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
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

export function ApplicationDetailModal({
  app,
  voiceUrl,
  photoUrl,
  open,
  onClose,
}: {
  app: Application;
  voiceUrl: string | null;
  photoUrl: string | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 24px 24px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          maxWidth: 760,
          width: "100%",
          boxShadow: "0 24px 60px -20px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 16,
            background: "var(--surface-2)",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        <div style={{ padding: "32px 36px" }}>
          {/* Header: photo + basic info + actions */}
          <div style={{ display: "flex", gap: 24, marginBottom: 28 }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${app.name} 사진`}
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 12,
                  objectFit: "cover",
                  border: "1px solid var(--border)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 12,
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: "var(--text)",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {app.name}
                </h2>
                <StatusPill status={app.status} />
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 14 }}>
                {app.gender === "male" ? "남성" : "여성"} · {app.birthYear}년생
                {app.mbti ? ` · ${app.mbti}` : ""}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13, marginBottom: 16 }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>직업</span>{" "}
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{app.occupation}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>지역</span>{" "}
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{app.region}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>전화</span>{" "}
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{app.phone}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>유입</span>{" "}
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{app.source}</span>
                </div>
              </div>
              <div>
                {app.status === "pending" ? (
                  <ActionButtons id={app.id} />
                ) : (
                  <ActionButtons id={app.id} variant="revert" />
                )}
              </div>
            </div>
          </div>

          {/* Voice */}
          <section style={{ marginBottom: 24 }}>
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
          </section>

          {/* Motivation */}
          <section style={{ marginBottom: 24 }}>
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
                padding: "14px 16px",
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
          </section>

          {/* Grid of remaining fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px 24px",
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
      </div>
    </div>
  );
}
