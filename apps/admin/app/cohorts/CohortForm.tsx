"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Cohort } from "@neomokdeul/db";

type Props = {
  mode: "create" | "edit";
  cohort?: Cohort;
};

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  // iso may be full ISO or just date
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function datetimeLocalToISO(local: string): string {
  if (!local) return "";
  // YYYY-MM-DDTHH:mm → treat as local time and convert to ISO
  return new Date(local).toISOString();
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--forest)",
  fontSize: 14,
  color: "var(--ink)",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--sub)",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const sectionStyle: React.CSSProperties = {
  borderTop: "1px solid var(--line)",
  paddingTop: 20,
  marginTop: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--forest)",
  marginBottom: 16,
  letterSpacing: "0.02em",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px 24px",
};

export default function CohortForm({ mode, cohort }: Props) {
  const router = useRouter();

  const [slug, setSlug] = useState(cohort?.slug ?? "");
  const [name, setName] = useState(cohort?.name ?? "");
  const [description, setDescription] = useState(cohort?.description ?? "");
  const [status, setStatus] = useState<string>(cohort?.status ?? "draft");

  const [programStartDate, setProgramStartDate] = useState(toDateInput(cohort?.programStartDate ?? ""));
  const [programEndDate, setProgramEndDate] = useState(toDateInput(cohort?.programEndDate ?? ""));
  const [applyOpensAt, setApplyOpensAt] = useState(toDatetimeLocal(cohort?.applyOpensAt ?? ""));
  const [applyClosesAt, setApplyClosesAt] = useState(toDatetimeLocal(cohort?.applyClosesAt ?? ""));

  const [priceKrw, setPriceKrw] = useState(String(cohort?.priceKrw ?? 45000));
  const [maxMale, setMaxMale] = useState(String(cohort?.maxMale ?? 15));
  const [maxFemale, setMaxFemale] = useState(String(cohort?.maxFemale ?? 15));
  const [latpeedPaymentUrl, setLatpeedPaymentUrl] = useState(cohort?.latpeedPaymentUrl ?? "");

  const [heroTitle, setHeroTitle] = useState(cohort?.heroTitle ?? "");
  const [heroSubtitle, setHeroSubtitle] = useState(cohort?.heroSubtitle ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(cohort?.heroImageUrl ?? "");
  const [specialFeatures, setSpecialFeatures] = useState(
    cohort?.specialFeatures?.join(", ") ?? ""
  );

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validateClient(): string | null {
    if (!slug) return "슬러그는 필수입니다.";
    if (!/^[a-z0-9-]+$/.test(slug)) return "슬러그는 소문자/숫자/하이픈만 허용됩니다.";
    if (!name) return "기수명은 필수입니다.";
    if (!status) return "상태는 필수입니다.";
    if (!programStartDate) return "프로그램 시작일은 필수입니다.";
    if (!programEndDate) return "프로그램 종료일은 필수입니다.";
    if (!applyOpensAt) return "모집 시작일시는 필수입니다.";
    if (!applyClosesAt) return "모집 마감일시는 필수입니다.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateClient();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const body = {
      slug,
      name,
      description: description || undefined,
      status,
      programStartDate,
      programEndDate,
      applyOpensAt: datetimeLocalToISO(applyOpensAt),
      applyClosesAt: datetimeLocalToISO(applyClosesAt),
      priceKrw: Number(priceKrw),
      maxMale: Number(maxMale),
      maxFemale: Number(maxFemale),
      latpeedPaymentUrl: latpeedPaymentUrl || undefined,
      heroTitle: heroTitle || undefined,
      heroSubtitle: heroSubtitle || undefined,
      heroImageUrl: heroImageUrl || undefined,
      specialFeatures: specialFeatures
        ? specialFeatures.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      const url =
        mode === "create"
          ? "/api/cohorts"
          : `/api/cohorts/${cohort!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "알 수 없는 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }

      router.push("/cohorts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
      {/* 기본 정보 */}
      <div>
        <div style={sectionTitleStyle}>기본 정보</div>
        <div style={gridStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>슬러그 *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="may-2026"
              style={inputStyle}
              required
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>기수명 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="2026년 5월 기수"
              style={inputStyle}
              required
            />
          </div>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>상태 *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="draft">초안 (draft)</option>
            <option value="recruiting">모집중 (recruiting)</option>
            <option value="closed">마감 (closed)</option>
            <option value="running">진행중 (running)</option>
            <option value="completed">완료 (completed)</option>
          </select>
        </div>
      </div>

      {/* 일정 */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>일정</div>
        <div style={gridStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>프로그램 시작일 *</label>
            <input
              type="date"
              value={programStartDate}
              onChange={(e) => setProgramStartDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>프로그램 종료일 *</label>
            <input
              type="date"
              value={programEndDate}
              onChange={(e) => setProgramEndDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>모집 시작 일시 *</label>
            <input
              type="datetime-local"
              value={applyOpensAt}
              onChange={(e) => setApplyOpensAt(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>모집 마감 일시 *</label>
            <input
              type="datetime-local"
              value={applyClosesAt}
              onChange={(e) => setApplyClosesAt(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
        </div>
      </div>

      {/* 운영 조건 */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>운영 조건</div>
        <div style={gridStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>참가비 (원) *</label>
            <input
              type="number"
              min={0}
              value={priceKrw}
              onChange={(e) => setPriceKrw(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={fieldStyle}>
            {/* spacer */}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>남성 정원 *</label>
            <input
              type="number"
              min={1}
              value={maxMale}
              onChange={(e) => setMaxMale(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>여성 정원 *</label>
            <input
              type="number"
              min={1}
              value={maxFemale}
              onChange={(e) => setMaxFemale(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>Latpeed 결제 URL</label>
          <input
            type="url"
            value={latpeedPaymentUrl}
            onChange={(e) => setLatpeedPaymentUrl(e.target.value)}
            placeholder="https://latpeed.com/..."
            style={inputStyle}
          />
        </div>
      </div>

      {/* 랜딩 오버라이드 */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>랜딩 오버라이드 (선택)</div>
        <div style={gridStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>히어로 타이틀</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>히어로 서브타이틀</label>
            <input
              type="text"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>히어로 이미지 URL</label>
          <input
            type="url"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>특별 피처 (쉼표 구분)</label>
          <input
            type="text"
            value={specialFeatures}
            onChange={(e) => setSpecialFeatures(e.target.value)}
            placeholder="크리스마스 특집, 파티 포함"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 20,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: 13,
            border: "1px solid #fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--line)",
        }}
      >
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "8px 22px",
            borderRadius: 8,
            background: submitting ? "#6b9e7a" : "var(--forest)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting
            ? "저장 중..."
            : mode === "create"
            ? "기수 생성"
            : "변경 저장"}
        </button>
        <a
          href="/cohorts"
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: "transparent",
            color: "var(--sub)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            border: "1px solid var(--line)",
          }}
        >
          취소
        </a>
      </div>
    </form>
  );
}
