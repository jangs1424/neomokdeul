"use client";

import { useState } from "react";
import type { Application } from "@neomokdeul/db";
import { ActionButtons } from "./ActionButtons";
import { AudioPlayer } from "./AudioPlayer";
import { PhotoModal } from "./PhotoModal";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { RowCheckbox, HeaderCheckbox } from "./BulkActions";

const GRID_COLS =
  "36px 64px 44px 56px 96px 126px 96px 88px 72px 260px 56px 140px 180px";

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
        padding: "3px 8px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatFull(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function DetailField({
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
          color: "var(--text-muted)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: multiline ? 1.7 : 1.4,
          color: "var(--text)",
          whiteSpace: multiline ? "pre-wrap" : "normal",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function RowHeader({ ids }: { ids: string[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID_COLS,
        padding: "10px 12px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-muted)",
        letterSpacing: "0.04em",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span>
        <HeaderCheckbox ids={ids} />
      </span>
      <span>상태</span>
      <span>성별</span>
      <span>년생</span>
      <span>이름</span>
      <span>전화</span>
      <span>직업</span>
      <span>지역</span>
      <span>MBTI</span>
      <span>음성</span>
      <span>사진</span>
      <span>신청일시</span>
      <span>액션</span>
    </div>
  );
}

export function ApplicationRow({
  app,
  voiceSignedUrl,
  photoSignedUrl,
}: {
  app: Application;
  voiceSignedUrl?: string | null;
  photoSignedUrl?: string | null;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS,
          padding: "12px",
          borderBottom: "1px solid var(--border)",
          fontSize: 13,
          color: "var(--text)",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <span onClick={(e) => e.stopPropagation()}>
          <RowCheckbox id={app.id} />
        </span>
        <span>
          <StatusPill status={app.status} />
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          {app.gender === "male" ? "남" : "여"}
        </span>
        <span style={{ color: "var(--text-muted)" }}>{app.birthYear}</span>
        <span style={{ fontWeight: 500 }}>{app.name}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{app.phone}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {app.occupation}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{app.region}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {app.mbti ?? "—"}
        </span>
        <span>
          {voiceSignedUrl ? (
            <AudioPlayer src={voiceSignedUrl} />
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
          )}
        </span>
        <span>
          {photoSignedUrl ? (
            <PhotoModal src={photoSignedUrl} alt={`${app.name} 사진`} />
          ) : (
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
          )}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {formatDate(app.createdAt)}
        </span>
        <span onClick={(e) => e.stopPropagation()}>
          {app.status === "pending" ? (
            <ActionButtons id={app.id} />
          ) : (
            <ActionButtons id={app.id} variant="revert" />
          )}
        </span>
      </div>
      <ApplicationDetailModal
        app={app}
        voiceUrl={voiceSignedUrl ?? null}
        photoUrl={photoSignedUrl ?? null}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
