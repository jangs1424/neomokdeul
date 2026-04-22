'use client';

import { useState } from 'react';
import type {
  Application,
  Cohort,
  MatchResponse,
} from '@neomokdeul/db';

interface Props {
  application: Application;
  cohort: Cohort;
  existingResponse: MatchResponse | null;
}

const REGION_OPTIONS = [
  '서울',
  '경기도',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주도',
];

const CALL_TIME_OPTIONS = [
  { label: '평일 저녁 (19~22시)', value: '평일저녁' },
  { label: '주말 오전', value: '주말오전' },
  { label: '주말 오후', value: '주말오후' },
  { label: '주말 저녁', value: '주말저녁' },
];

const MBTI_OPTIONS = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];

const CONV_ROWS: {
  key:
    | 'convEnergy'
    | 'convThinking'
    | 'convPlanning'
    | 'convPace'
    | 'convDepth';
  left: string;
  right: string;
}[] = [
  { key: 'convEnergy', left: '내향 (혼자 충전)', right: '외향 (사람 만나면 에너지)' },
  { key: 'convThinking', left: '논리', right: '감정' },
  { key: 'convPlanning', left: '계획형', right: '즉흥형' },
  { key: 'convPace', left: '듣는 편', right: '말하는 편' },
  { key: 'convDepth', left: '가벼운 수다', right: '깊은 대화' },
];

const VALUE_ROWS: {
  key:
    | 'valuesMarriage'
    | 'valuesCareer'
    | 'valuesFamily'
    | 'valuesHobby'
    | 'valuesIndependence';
  label: string;
}[] = [
  { key: 'valuesMarriage', label: '결혼·진지한 관계' },
  { key: 'valuesCareer', label: '커리어·일' },
  { key: 'valuesFamily', label: '가족·친척' },
  { key: 'valuesHobby', label: '취미·개인 시간' },
  { key: 'valuesIndependence', label: '개인 공간·자율성' },
];

const DAY_FIELDS: {
  key: 'day2Answer' | 'day3Answer' | 'day4Answer' | 'day5Answer' | 'day6Answer' | 'day7Answer';
  day: number;
  prompt: string;
}[] = [
  { key: 'day2Answer', day: 2, prompt: '나를 한 문장으로 소개한다면?' },
  { key: 'day3Answer', day: 3, prompt: '요즘 가장 많이 듣는 노래 한 곡 + 이유' },
  { key: 'day4Answer', day: 4, prompt: '인생 영화 또는 드라마' },
  { key: 'day5Answer', day: 5, prompt: '최근 재밌게 읽은 책 / 기사 / 콘텐츠' },
  { key: 'day6Answer', day: 6, prompt: '이상적인 주말 하루' },
  { key: 'day7Answer', day: 7, prompt: '상대에게 먼저 묻고 싶은 질문 하나' },
];

type FormState = {
  nickname: string;
  region: string;
  callTimes: string[];
  mbti: string;
  convEnergy: number;
  convThinking: number;
  convPlanning: number;
  convPace: number;
  convDepth: number;
  valuesMarriage: number;
  valuesCareer: number;
  valuesFamily: number;
  valuesHobby: number;
  valuesIndependence: number;
  day2Answer: string;
  day3Answer: string;
  day4Answer: string;
  day5Answer: string;
  day6Answer: string;
  day7Answer: string;
  kakaoOpenchatUrl: string;
};

export function MatchForm({ application, cohort, existingResponse }: Props) {
  const initial: FormState = {
    nickname: existingResponse?.nickname ?? application.name ?? '',
    region: existingResponse?.region ?? application.region ?? '',
    callTimes: existingResponse?.callTimes ?? application.callTimes ?? [],
    mbti: existingResponse?.mbti ?? application.mbti ?? '',
    convEnergy: existingResponse?.convEnergy ?? 3,
    convThinking: existingResponse?.convThinking ?? 3,
    convPlanning: existingResponse?.convPlanning ?? 3,
    convPace: existingResponse?.convPace ?? 3,
    convDepth: existingResponse?.convDepth ?? 3,
    valuesMarriage: existingResponse?.valuesMarriage ?? 3,
    valuesCareer: existingResponse?.valuesCareer ?? 3,
    valuesFamily: existingResponse?.valuesFamily ?? 3,
    valuesHobby: existingResponse?.valuesHobby ?? 3,
    valuesIndependence: existingResponse?.valuesIndependence ?? 3,
    day2Answer: existingResponse?.day2Answer ?? '',
    day3Answer: existingResponse?.day3Answer ?? '',
    day4Answer: existingResponse?.day4Answer ?? '',
    day5Answer: existingResponse?.day5Answer ?? '',
    day6Answer: existingResponse?.day6Answer ?? '',
    day7Answer: existingResponse?.day7Answer ?? '',
    kakaoOpenchatUrl: existingResponse?.kakaoOpenchatUrl ?? '',
  };

  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isMale = application.gender === 'male';
  const hasExisting = !!existingResponse;

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const toggleCallTime = (v: string) => {
    setForm((prev) => ({
      ...prev,
      callTimes: prev.callTimes.includes(v)
        ? prev.callTimes.filter((x) => x !== v)
        : [...prev.callTimes, v],
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (form.nickname.trim().length < 2 || form.nickname.trim().length > 12) {
      setError('닉네임은 2~12자로 입력해 주세요.');
      return;
    }
    if (!form.region) {
      setError('거주 지역을 선택해 주세요.');
      return;
    }
    if (form.callTimes.length === 0) {
      setError('통화 가능 시간대를 1개 이상 선택해 주세요.');
      return;
    }
    if (isMale) {
      if (!form.kakaoOpenchatUrl.trim()) {
        setError('오픈채팅방 링크를 입력해 주세요.');
        return;
      }
      if (!form.kakaoOpenchatUrl.startsWith('https://open.kakao.com/')) {
        setError('오픈채팅방 링크는 https://open.kakao.com/ 으로 시작해야 해요.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/match-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: form.nickname.trim(),
          region: form.region,
          callTimes: form.callTimes,
          mbti: form.mbti || undefined,
          convEnergy: form.convEnergy,
          convThinking: form.convThinking,
          convPlanning: form.convPlanning,
          convPace: form.convPace,
          convDepth: form.convDepth,
          valuesMarriage: form.valuesMarriage,
          valuesCareer: form.valuesCareer,
          valuesFamily: form.valuesFamily,
          valuesHobby: form.valuesHobby,
          valuesIndependence: form.valuesIndependence,
          day2Answer: form.day2Answer.trim() || undefined,
          day3Answer: form.day3Answer.trim() || undefined,
          day4Answer: form.day4Answer.trim() || undefined,
          day5Answer: form.day5Answer.trim() || undefined,
          day6Answer: form.day6Answer.trim() || undefined,
          day7Answer: form.day7Answer.trim() || undefined,
          kakaoOpenchatUrl: isMale ? form.kakaoOpenchatUrl.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error || '제출에 실패했어요. 잠시 후 다시 시도해 주세요.');
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
    } catch {
      setError('네트워크 오류가 발생했어요.');
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '40px 24px',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: 'var(--forest)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              marginBottom: 10,
              color: 'var(--ink)',
            }}
          >
            제출 완료
          </h1>
          <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.6 }}>
            매칭 결과는 Day 2 저녁에 공개돼요.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: 24,
              padding: '12px 24px',
              background: 'var(--forest)',
              color: '#fff',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ padding: '24px 20px 48px' }}>
      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 6 }}>
          {cohort.name}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            color: 'var(--ink)',
            lineHeight: 1.35,
            marginBottom: 8,
          }}
        >
          매칭 폼
        </h1>
        <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6 }}>
          답변은 파트너 매칭과 Day별 공유에 쓰여요. {hasExisting && '이미 제출한 내용을 수정할 수 있어요.'}
        </p>
      </header>

      {/* Section 1: 기본 정보 */}
      <Section title="1. 기본 정보">
        <Field label="닉네임" required hint="참가자들이 서로 부를 이름 (2~12자)">
          <input
            type="text"
            value={form.nickname}
            onChange={(e) => update('nickname', e.target.value)}
            minLength={2}
            maxLength={12}
            required
            style={inputStyle}
          />
        </Field>

        <Field label="거주 지역" required>
          <select
            required
            value={form.region}
            onChange={(e) => update('region', e.target.value)}
            style={inputStyle}
          >
            <option value="" disabled>
              지역 선택
            </option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="통화 가능 시간대" required hint="1개 이상 선택">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CALL_TIME_OPTIONS.map((opt) => {
              const checked = form.callTimes.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    border: `1px solid ${checked ? 'var(--forest)' : 'var(--border)'}`,
                    borderRadius: 10,
                    background: checked ? 'rgba(90,122,92,0.08)' : 'var(--surface)',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCallTime(opt.value)}
                    style={{ accentColor: 'var(--forest)' }}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </Field>

        <Field label="MBTI" hint="선택">
          <select
            value={form.mbti}
            onChange={(e) => update('mbti', e.target.value)}
            style={inputStyle}
          >
            <option value="">모름</option>
            {MBTI_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Section 2: 대화 성향 */}
      <Section
        title="2. 대화 성향"
        subtitle="가까운 쪽에 체크해 주세요 (1~5)"
      >
        {CONV_ROWS.map((row) => (
          <LikertRow
            key={row.key}
            left={row.left}
            right={row.right}
            value={form[row.key]}
            onChange={(v) => update(row.key, v)}
          />
        ))}
      </Section>

      {/* Section 3: 가치관 */}
      <Section
        title="3. 가치관 — 중요도"
        subtitle="1 = 별로, 5 = 매우 중요"
      >
        {VALUE_ROWS.map((row) => (
          <LikertRow
            key={row.key}
            left={row.label}
            right=""
            value={form[row.key]}
            onChange={(v) => update(row.key, v)}
            singleLabel
          />
        ))}
      </Section>

      {/* Section 4: Day별 공유 주제 */}
      <Section
        title="4. Day별 공유 주제"
        subtitle="프로그램 중 하루 한 주제씩 공유할 답변입니다. 비워두면 '없음'으로 남아요."
      >
        {DAY_FIELDS.map((d) => (
          <Field key={d.key} label={`Day ${d.day} — ${d.prompt}`}>
            <textarea
              value={form[d.key]}
              onChange={(e) => update(d.key, e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.5 }}
            />
          </Field>
        ))}
      </Section>

      {/* Section 5: 오픈채팅방 */}
      {isMale && (
        <Section title="5. 오픈채팅방 링크">
          <Field
            label="1:1 오픈채팅방 URL"
            required
            hint="여자 파트너가 먼저 들어올 수 있도록, 참가자만 볼 수 있는 1:1 오픈채팅방 링크를 생성해서 붙여주세요."
          >
            <input
              type="url"
              value={form.kakaoOpenchatUrl}
              onChange={(e) => update('kakaoOpenchatUrl', e.target.value)}
              placeholder="https://open.kakao.com/..."
              required
              style={inputStyle}
            />
          </Field>
        </Section>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 14px',
            border: '1px solid #e07c6d',
            background: '#fff3ef',
            borderRadius: 10,
            fontSize: 13,
            color: '#b8402e',
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 24,
          width: '100%',
          padding: '16px',
          background: submitting ? 'var(--sub)' : 'var(--forest)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting
          ? '저장 중...'
          : hasExisting
            ? '수정해서 다시 저장'
            : '제출하기'}
      </button>

      <a
        href="/"
        style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 14,
          fontSize: 13,
          color: 'var(--sub)',
        }}
      >
        ← 홈으로
      </a>
    </form>
  );
}

// ---------- Sub-components ----------

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom: 20,
        padding: '20px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          color: 'var(--ink)',
          marginBottom: subtitle ? 4 : 14,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--sub)',
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink)',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {hint && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--sub)',
            marginBottom: 6,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function LikertRow({
  left,
  right,
  value,
  onChange,
  singleLabel = false,
}: {
  left: string;
  right: string;
  value: number;
  onChange: (v: number) => void;
  singleLabel?: boolean;
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        paddingBottom: 14,
        borderBottom: '1px dashed var(--border)',
      }}
    >
      {singleLabel ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink)',
            marginBottom: 10,
          }}
        >
          {left}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--sub)',
            marginBottom: 8,
            gap: 10,
          }}
        >
          <span style={{ flex: 1 }}>{left}</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{right}</span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 999,
                border: `1px solid ${active ? 'var(--forest)' : 'var(--border)'}`,
                background: active ? 'var(--forest)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--sub)',
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'none',
                maxWidth: 48,
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 14,
  background: 'var(--surface)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  outline: 'none',
};
