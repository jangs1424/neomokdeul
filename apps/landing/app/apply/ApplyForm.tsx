"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

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

export default function ApplyForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [birthYear, setBirthYear] = useState("");
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [motivation, setMotivation] = useState("");
  const [source, setSource] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          gender,
          birthYear: Number(birthYear),
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
          신청이 접수되었습니다
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
          style={{
            ...inputStyle,
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%231a4d2e' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            paddingRight: 36,
            cursor: "pointer",
          }}
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
