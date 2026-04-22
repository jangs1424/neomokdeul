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
  borderRadius: 6,
  border: "1px solid var(--border-strong)",
  fontSize: 14,
  color: "var(--text)",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
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
  borderTop: "1px solid var(--border)",
  paddingTop: 20,
  marginTop: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text)",
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

  const [approvedSmsTemplate, setApprovedSmsTemplate] = useState(cohort?.approvedSmsTemplate ?? "");
  const [applyIntroText, setApplyIntroText] = useState(cohort?.applyIntroText ?? "");
  const [voiceIntroHelp, setVoiceIntroHelp] = useState(cohort?.voiceIntroHelp ?? "");
  const [photoHelp, setPhotoHelp] = useState(cohort?.photoHelp ?? "");
  const [motivationPrompt, setMotivationPrompt] = useState(cohort?.motivationPrompt ?? "");

  // Phase 12 — match form settings
  const [matchFormClosesAt, setMatchFormClosesAt] = useState(
    toDatetimeLocal(cohort?.matchFormClosesAt ?? "")
  );
  const [matchDay1Prompt, setMatchDay1Prompt] = useState(cohort?.matchDay1Prompt ?? "");
  const [matchDay2Prompt, setMatchDay2Prompt] = useState(cohort?.matchDay2Prompt ?? "");
  const [matchDay3Prompt, setMatchDay3Prompt] = useState(cohort?.matchDay3Prompt ?? "");
  const [matchDay4Prompt, setMatchDay4Prompt] = useState(cohort?.matchDay4Prompt ?? "");
  const [matchDay5Prompt, setMatchDay5Prompt] = useState(cohort?.matchDay5Prompt ?? "");
  // Phase 12 Option A — 7 main question prompts
  const [mqConvStyleSelf, setMqConvStyleSelf]         = useState(cohort?.matchQConvStyleSelf ?? "");
  const [mqConvWithStrangers, setMqConvWithStrangers] = useState(cohort?.matchQConvWithStrangers ?? "");
  const [mqConvAttraction, setMqConvAttraction]       = useState(cohort?.matchQConvAttraction ?? "");
  const [mqIdealImportant, setMqIdealImportant]       = useState(cohort?.matchQIdealImportant ?? "");
  const [mqIdealSoulmateMust, setMqIdealSoulmateMust] = useState(cohort?.matchQIdealSoulmateMust ?? "");
  const [mqIdealRelationship, setMqIdealRelationship] = useState(cohort?.matchQIdealRelationship ?? "");
  const [mqIdealPartnerQ, setMqIdealPartnerQ]         = useState(cohort?.matchQIdealPartnerQ ?? "");

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
      approvedSmsTemplate: approvedSmsTemplate || undefined,
      applyIntroText: applyIntroText || undefined,
      voiceIntroHelp: voiceIntroHelp || undefined,
      photoHelp: photoHelp || undefined,
      motivationPrompt: motivationPrompt || undefined,
      matchFormClosesAt: matchFormClosesAt ? datetimeLocalToISO(matchFormClosesAt) : undefined,
      matchDay1Prompt: matchDay1Prompt || undefined,
      matchDay2Prompt: matchDay2Prompt || undefined,
      matchDay3Prompt: matchDay3Prompt || undefined,
      matchDay4Prompt: matchDay4Prompt || undefined,
      matchDay5Prompt: matchDay5Prompt || undefined,
      matchQConvStyleSelf: mqConvStyleSelf || undefined,
      matchQConvWithStrangers: mqConvWithStrangers || undefined,
      matchQConvAttraction: mqConvAttraction || undefined,
      matchQIdealImportant: mqIdealImportant || undefined,
      matchQIdealSoulmateMust: mqIdealSoulmateMust || undefined,
      matchQIdealRelationship: mqIdealRelationship || undefined,
      matchQIdealPartnerQ: mqIdealPartnerQ || undefined,
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
          <label style={labelStyle}>
            Latpeed 결제 URL <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="url"
            value={latpeedPaymentUrl}
            onChange={(e) => setLatpeedPaymentUrl(e.target.value)}
            placeholder="https://latpeed.com/..."
            style={{ ...inputStyle, borderColor: latpeedPaymentUrl ? "var(--border-strong)" : "var(--danger)" }}
          />
          <span style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>
            승인 시 신청자에게 SMS로 발송됨. 비어 있으면 발송 안 됨.
          </span>
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

      {/* 폼 문구 / 메시지 */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>폼 문구 / 메시지 (선택)</div>
        <div style={{ ...fieldStyle }}>
          <label style={labelStyle}>승인 SMS 템플릿</label>
          <textarea
            value={approvedSmsTemplate}
            onChange={(e) => setApprovedSmsTemplate(e.target.value)}
            rows={8}
            placeholder={"변수 사용 가능: {{name}} {{cohort_name}} {{payment_url}} {{deadline}}"}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>폼 상단 인트로 문구</label>
          <textarea
            value={applyIntroText}
            onChange={(e) => setApplyIntroText(e.target.value)}
            rows={2}
            placeholder="신청 폼 맨 위에 표시되는 부제"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>음성 자소 도움말</label>
          <textarea
            value={voiceIntroHelp}
            onChange={(e) => setVoiceIntroHelp(e.target.value)}
            rows={4}
            placeholder="음성 자기소개 필드 아래 설명 문구"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>얼굴 사진 도움말</label>
          <textarea
            value={photoHelp}
            onChange={(e) => setPhotoHelp(e.target.value)}
            rows={3}
            placeholder="얼굴 사진 필드 아래 설명 문구"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>지원 동기 프롬프트</label>
          <textarea
            value={motivationPrompt}
            onChange={(e) => setMotivationPrompt(e.target.value)}
            rows={2}
            placeholder="textarea placeholder로 표시"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      </div>

      {/* 매칭 폼 설정 — Phase 12 */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>매칭 폼 설정</div>
        <div style={fieldStyle}>
          <label style={labelStyle}>매칭 폼 마감 일시</label>
          <input
            type="datetime-local"
            value={matchFormClosesAt}
            onChange={(e) => setMatchFormClosesAt(e.target.value)}
            style={inputStyle}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            이 시각 이후 참가자는 매칭 폼 수정 불가
          </span>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>Day 1 질문</label>
          <textarea
            value={matchDay1Prompt}
            onChange={(e) => setMatchDay1Prompt(e.target.value)}
            rows={2}
            placeholder="나를 위로하는 최애 음식..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Day 1 질문 (비우면 기본값 사용)
          </span>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>Day 2 질문</label>
          <textarea
            value={matchDay2Prompt}
            onChange={(e) => setMatchDay2Prompt(e.target.value)}
            rows={2}
            placeholder="요즘 푹 빠진 취미는?"
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Day 2 질문 (비우면 기본값 사용)
          </span>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>Day 3 질문</label>
          <textarea
            value={matchDay3Prompt}
            onChange={(e) => setMatchDay3Prompt(e.target.value)}
            rows={2}
            placeholder="혼자 있을 때 즐겨 찾는 장소..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Day 3 질문 (비우면 기본값 사용)
          </span>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>Day 4 질문</label>
          <textarea
            value={matchDay4Prompt}
            onChange={(e) => setMatchDay4Prompt(e.target.value)}
            rows={2}
            placeholder="상대와 함께 해보고 싶은 것..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Day 4 질문 (비우면 기본값 사용)
          </span>
        </div>
        <div style={{ ...fieldStyle, marginTop: 16 }}>
          <label style={labelStyle}>Day 5 질문</label>
          <textarea
            value={matchDay5Prompt}
            onChange={(e) => setMatchDay5Prompt(e.target.value)}
            rows={2}
            placeholder="개인적인 미션(하나만 적어주세요)..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Day 5 질문 (비우면 기본값 사용)
          </span>
        </div>
      </div>

      {/* 매칭 폼 본 질문 편집 — Phase 12 Option A (대화성향 3 + 이상형·가치관 4) */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>매칭 폼 본 질문 (7개)</div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -4, marginBottom: 14 }}>
          비우면 기본 Tally 문구로 표시됩니다. 기수별로 질문을 다르게 쓸 때만 채우세요.
        </p>

        <div style={{ ...fieldStyle, marginTop: 4 }}>
          <label style={labelStyle}>[대화성향 1] 나는 대화할 때…</label>
          <textarea
            value={mqConvStyleSelf}
            onChange={(e) => setMqConvStyleSelf(e.target.value)}
            rows={2}
            placeholder="저는 대화할 때 이런 사람 같아요!"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 12 }}>
          <label style={labelStyle}>[대화성향 2] 낯선이와 함께할 때</label>
          <textarea
            value={mqConvWithStrangers}
            onChange={(e) => setMqConvWithStrangers(e.target.value)}
            rows={2}
            placeholder="낯선이와 함께할 때 저는 이래요!"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 12 }}>
          <label style={labelStyle}>[대화성향 3] 매력 포인트</label>
          <textarea
            value={mqConvAttraction}
            onChange={(e) => setMqConvAttraction(e.target.value)}
            rows={2}
            placeholder="남들에게 칭찬받는 대화할 때의 나의 매력 포인트?"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 12 }}>
          <label style={labelStyle}>[가치관 1] 사람 볼 때 중요한 것</label>
          <textarea
            value={mqIdealImportant}
            onChange={(e) => setMqIdealImportant(e.target.value)}
            rows={2}
            placeholder="사람을 볼 때 당신이 가장 중요하게 보는 것은?"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 12 }}>
          <label style={labelStyle}>[가치관 2] 소울메이트라면</label>
          <textarea
            value={mqIdealSoulmateMust}
            onChange={(e) => setMqIdealSoulmateMust(e.target.value)}
            rows={2}
            placeholder="소울메이트라면 이건 맞아야지!"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 12 }}>
          <label style={labelStyle}>[가치관 3] 기대하는 관계</label>
          <textarea
            value={mqIdealRelationship}
            onChange={(e) => setMqIdealRelationship(e.target.value)}
            rows={2}
            placeholder="나의 전화 메이트와 이런 관계를 기대하고 있어요!"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div style={{ ...fieldStyle, marginTop: 12 }}>
          <label style={labelStyle}>[가치관 4] 파트너에게 하고 싶은 질문</label>
          <textarea
            value={mqIdealPartnerQ}
            onChange={(e) => setMqIdealPartnerQ(e.target.value)}
            rows={2}
            placeholder="이번 커넥팅 기간 동안 내 파트너에게 꼭 하고 싶은 질문 한가지?"
            style={{ ...inputStyle, resize: "vertical" }}
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
            background: "var(--danger-soft)",
            color: "#991b1b",
            fontSize: 13,
            border: "1px solid #fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {/* Auto-transition note */}
      <div
        style={{
          marginTop: 24,
          padding: "10px 14px",
          borderRadius: 8,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--text)", fontWeight: 600 }}>자동 상태 전이:</strong>{" "}
        모집 마감일 지나면 <code style={{ fontSize: 11, background: "var(--surface-2)", padding: "1px 4px", borderRadius: 3 }}>closed</code>,
        프로그램 시작일부터 <code style={{ fontSize: 11, background: "var(--surface-2)", padding: "1px 4px", borderRadius: 3 }}>running</code>,
        종료일 이후 <code style={{ fontSize: 11, background: "var(--surface-2)", padding: "1px 4px", borderRadius: 3 }}>completed</code>{" "}
        — 언제든 수동으로 override 가능.
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "8px 22px",
            borderRadius: 8,
            background: submitting ? "var(--text-soft)" : "var(--accent)",
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
            color: "var(--text-muted)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            border: "1px solid var(--border)",
          }}
        >
          취소
        </a>
      </div>
    </form>
  );
}
