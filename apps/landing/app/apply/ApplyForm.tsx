"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import type { Cohort } from "@neomokdeul/db";

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 20,
};

const labelTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--forest)",
};

const inputStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--forest)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 16,
  color: "var(--ink)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const noteStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--sub)",
  marginTop: 4,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%231a4d2e' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: 36,
  cursor: "pointer",
};

const CALL_TIME_OPTIONS: { label: string; value: string }[] = [
  { label: "평일 저녁 (19~22시)", value: "평일저녁" },
  { label: "주말 오전", value: "주말오전" },
  { label: "주말 오후", value: "주말오후" },
  { label: "주말 저녁", value: "주말저녁" },
];

const MBTI_OPTIONS = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

interface Props {
  cohort: Cohort;
}

export default function ApplyForm({ cohort }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [birthYear, setBirthYear] = useState("");
  const [occupation, setOccupation] = useState("");
  const [region, setRegion] = useState("");
  const [callTimes, setCallTimes] = useState<string[]>([]);
  const [mbti, setMbti] = useState("");
  const [previousCohort, setPreviousCohort] = useState<boolean | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [motivation, setMotivation] = useState("");
  const [source, setSource] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function toggleCallTime(value: string) {
    setCallTimes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (callTimes.length === 0) {
      setError("통화 가능 시간대를 하나 이상 선택해주세요.");
      return;
    }
    if (previousCohort === null) {
      setError("이전 기수 참여 여부를 선택해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          name,
          phone,
          gender,
          birthYear: Number(birthYear),
          occupation,
          region,
          callTimes,
          mbti: mbti || undefined,
          previousCohort,
          cohortId: cohort.id,
          motivation,
          source,
          agreed,
          voiceFileName: voiceFile ? voiceFile.name : undefined,
          photoFileName: photoFile ? photoFile.name : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "오류가 발생했습니다.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 24px",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--forest)",
            color: "#fff",
            fontSize: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          ✓
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--forest)",
            marginBottom: 12,
          }}
        >
          {cohort.name} 신청이 접수되었습니다
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--sub)",
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          48시간 내에 심사 결과를 문자로 알려드릴게요.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "var(--forest)",
            color: "#fff",
            borderRadius: 999,
            padding: "14px 32px",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* 이름 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>
          이름 <span style={{ color: "var(--coral)" }}>*</span>
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="홍길동"
          style={inputStyle}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        />
      </label>

      {/* 전화번호 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>
          전화번호 <span style={{ color: "var(--coral)" }}>*</span>
        </span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          placeholder="010-1234-5678"
          pattern="^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"
          style={inputStyle}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        />
      </label>

      {/* 성별 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...labelTextStyle, marginBottom: 10 }}>
          성별 <span style={{ color: "var(--coral)" }}>*</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {(["male", "female"] as const).map((g) => (
            <label
              key={g}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <input
                type="radio"
                name="gender"
                value={g}
                required
                checked={gender === g}
                onChange={() => setGender(g)}
                style={{ accentColor: "var(--forest)", width: 18, height: 18 }}
              />
              {g === "male" ? "남성" : "여성"}
            </label>
          ))}
        </div>
      </div>

      {/* 출생년도 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>
          출생년도 <span style={{ color: "var(--coral)" }}>*</span>
        </span>
        <input
          type="number"
          required
          value={birthYear}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBirthYear(e.target.value)}
          min={1980}
          max={2008}
          placeholder="1995"
          style={inputStyle}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        />
      </label>

      {/* 직업 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>
          직업 <span style={{ color: "var(--coral)" }}>*</span>
        </span>
        <input
          type="text"
          required
          value={occupation}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setOccupation(e.target.value)}
          placeholder="예: UX 디자이너, 대학원생"
          style={inputStyle}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        />
      </label>

      {/* 거주 지역 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>
          거주 지역 <span style={{ color: "var(--coral)" }}>*</span>
        </span>
        <select
          required
          value={region}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setRegion(e.target.value)}
          style={selectStyle}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        >
          <option value="" disabled>
            선택해주세요
          </option>
          <option value="서울 강남/서초">서울 강남/서초</option>
          <option value="서울 마포/용산">서울 마포/용산</option>
          <option value="서울 기타">서울 기타</option>
          <option value="경기/인천">경기/인천</option>
          <option value="기타 지역">기타 지역</option>
        </select>
      </label>

      {/* 통화 가능 시간대 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...labelTextStyle, marginBottom: 10 }}>
          통화 가능 시간대 <span style={{ color: "var(--coral)" }}>*</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CALL_TIME_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <input
                type="checkbox"
                checked={callTimes.includes(opt.value)}
                onChange={() => toggleCallTime(opt.value)}
                style={{ accentColor: "var(--forest)", width: 18, height: 18 }}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <span style={noteStyle}>복수 선택 가능</span>
      </div>

      {/* MBTI */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>MBTI (선택)</span>
        <select
          value={mbti}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setMbti(e.target.value)}
          style={selectStyle}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        >
          <option value="">모름/안적음</option>
          {MBTI_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {/* 이전 기수 참여 여부 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...labelTextStyle, marginBottom: 10 }}>
          이전에 너목들 참여한 적 있나요?{" "}
          <span style={{ color: "var(--coral)" }}>*</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {(
            [
              { label: "없음", value: false },
              { label: "있음", value: true },
            ] as const
          ).map(({ label, value }) => (
            <label
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              <input
                type="radio"
                name="previousCohort"
                checked={previousCohort === value}
                onChange={() => setPreviousCohort(value)}
                style={{ accentColor: "var(--forest)", width: 18, height: 18 }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* 음성 자기소개 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>음성 자기소개 (30초)</span>
        <input
          type="file"
          accept="audio/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setVoiceFile(e.target.files?.[0] ?? null)
          }
          style={{
            ...inputStyle,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        />
        <span style={noteStyle}>선택사항 — 실제 업로드는 추후 연동</span>
      </label>

      {/* 얼굴 사진 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>얼굴 사진</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPhotoFile(e.target.files?.[0] ?? null)
          }
          style={{
            ...inputStyle,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        />
        <span style={noteStyle}>선택사항 — 실제 업로드는 추후 연동</span>
      </label>

      {/* 지원 동기 */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>
          지원 동기 <span style={{ color: "var(--coral)" }}>*</span>
        </span>
        <textarea
          required
          value={motivation}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMotivation(e.target.value)}
          placeholder="너목들에 지원하게 된 이유를 자유롭게 적어주세요."
          rows={4}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 96,
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        />
      </label>

      {/* 어떻게 알게 되셨나요? */}
      <label style={labelStyle}>
        <span style={labelTextStyle}>
          어떻게 알게 되셨나요? <span style={{ color: "var(--coral)" }}>*</span>
        </span>
        <select
          required
          value={source}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSource(e.target.value)}
          style={selectStyle}
          onFocus={(e) => (e.target.style.outline = "2px solid var(--forest)")}
          onBlur={(e) => (e.target.style.outline = "none")}
        >
          <option value="" disabled>
            선택해주세요
          </option>
          <option value="인스타그램">인스타그램</option>
          <option value="지인 소개">지인 소개</option>
          <option value="검색">검색</option>
          <option value="기타">기타</option>
        </select>
      </label>

      {/* 개인정보 동의 */}
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 32,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          required
          checked={agreed}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAgreed(e.target.checked)}
          style={{
            accentColor: "var(--forest)",
            width: 18,
            height: 18,
            marginTop: 2,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5 }}>
          <strong>개인정보 수집·이용 동의</strong>{" "}
          <span style={{ color: "var(--coral)" }}>*</span>
          <br />
          <span style={{ color: "var(--sub)", fontSize: 13 }}>
            심사를 위해 이름·전화·얼굴·음성을 호스트가 확인합니다
          </span>
        </span>
      </label>

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            color: "var(--coral)",
            fontSize: 14,
            marginBottom: 12,
            padding: "10px 14px",
            background: "#fff0ee",
            borderRadius: 8,
            border: "1px solid var(--coral)",
          }}
        >
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          background: submitting ? "var(--sub)" : "var(--forest)",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "16px 24px",
          fontSize: 16,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        {submitting ? "접수 중..." : "신청 접수하기"}
      </button>
    </form>
  );
}
