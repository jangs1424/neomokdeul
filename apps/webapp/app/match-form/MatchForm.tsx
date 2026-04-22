'use client';

import { useMemo, useState } from 'react';
import type {
  Application,
  Cohort,
  MatchResponse,
} from '@neomokdeul/db';
import { SlotGrid, enumerateDates } from './SlotGrid';
import { ReadOnlyView } from './ReadOnlyView';

// Local aliases — kept in sync with @neomokdeul/db/schema.ts (not re-exported from index.ts).
type MatchGenderPreference = NonNullable<MatchResponse['matchGender']>;
type PhoneType = NonNullable<MatchResponse['phoneType']>;

interface Props {
  application: Application;
  cohort: Cohort;
  existingResponse: MatchResponse | null;
  closed: boolean; // deadline passed
  deadline?: string; // ISO
}

const DEFAULT_DAY_PROMPTS = {
  day1: '나를 위로하는 최애 음식, 소울푸드는?',
  day2: '나의 소소한 취미는?',
  day3: '내가 가장 좋아하는 장소가 있다면?',
  day4: '소울메이트와 이것만은 꼭 같이 하고 싶어요!',
  day5: '(개인 미션) 전화 메이트에게 수행할 당신의 비밀 미션',
};

type FormState = {
  matchGender: MatchGenderPreference | '';
  muntoNickname: string;
  nickname: string;
  phoneType: PhoneType | '';
  convStyleSelf: string;
  convWithStrangers: string;
  convAttraction: string;
  idealImportant: string;
  idealSoulmateMust: string;
  idealRelationship: string;
  idealPartnerQ: string;
  day1Soulfood: string;
  day2Hobby: string;
  day3Place: string;
  day4Together: string;
  day5SecretMission: string;
  availableSlots: string[];
  gatheringDates: string[];
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  kakaoOpenchatUrl: string;
};

function computeDeadlineBadge(deadlineIso?: string): string | null {
  if (!deadlineIso) return null;
  const now = Date.now();
  const dl = new Date(deadlineIso).getTime();
  if (!Number.isFinite(dl)) return null;
  const diffMs = dl - now;
  if (diffMs <= 0) return '수정 마감됨';
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.ceil(diffMs / dayMs);
  if (days <= 1) {
    const hours = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));
    return `${hours}시간 내 수정 마감`;
  }
  return `D-${days} 까지 수정 가능`;
}

export function MatchForm({ application, cohort, existingResponse, closed, deadline }: Props) {
  const isMale = application.gender === 'male';
  const hasExisting = !!existingResponse;

  const initial: FormState = {
    matchGender: existingResponse?.matchGender ?? '',
    muntoNickname: existingResponse?.muntoNickname ?? '',
    nickname: existingResponse?.nickname ?? '',
    phoneType: existingResponse?.phoneType ?? '',
    convStyleSelf: existingResponse?.convStyleSelf ?? '',
    convWithStrangers: existingResponse?.convWithStrangers ?? '',
    convAttraction: existingResponse?.convAttraction ?? '',
    idealImportant: existingResponse?.idealImportant ?? '',
    idealSoulmateMust: existingResponse?.idealSoulmateMust ?? '',
    idealRelationship: existingResponse?.idealRelationship ?? '',
    idealPartnerQ: existingResponse?.idealPartnerQ ?? '',
    day1Soulfood: existingResponse?.day1Soulfood ?? '',
    day2Hobby: existingResponse?.day2Hobby ?? '',
    day3Place: existingResponse?.day3Place ?? '',
    day4Together: existingResponse?.day4Together ?? '',
    day5SecretMission: existingResponse?.day5SecretMission ?? '',
    availableSlots: existingResponse?.availableSlots ?? [],
    gatheringDates: existingResponse?.gatheringDates ?? [],
    privacyAgreed: true, // already agreed at application time; confirm checkbox default on
    marketingAgreed: existingResponse?.marketingAgreed ?? false,
    kakaoOpenchatUrl: existingResponse?.kakaoOpenchatUrl ?? '',
  };

  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  const deadlineBadge = useMemo(() => computeDeadlineBadge(deadline), [deadline]);
  const programDates = useMemo(
    () => enumerateDates(cohort.programStartDate, cohort.programEndDate),
    [cohort.programStartDate, cohort.programEndDate],
  );

  const dayPrompts = {
    day1: cohort.matchDay1Prompt ?? DEFAULT_DAY_PROMPTS.day1,
    day2: cohort.matchDay2Prompt ?? DEFAULT_DAY_PROMPTS.day2,
    day3: cohort.matchDay3Prompt ?? DEFAULT_DAY_PROMPTS.day3,
    day4: cohort.matchDay4Prompt ?? DEFAULT_DAY_PROMPTS.day4,
    day5: cohort.matchDay5Prompt ?? DEFAULT_DAY_PROMPTS.day5,
  };

  // Read-only render conditions
  if (closed && existingResponse) {
    return (
      <ReadOnlyView
        application={application}
        cohort={cohort}
        response={existingResponse}
        closed
      />
    );
  }

  if (viewMode === 'view' && existingResponse) {
    return (
      <ReadOnlyView
        application={application}
        cohort={cohort}
        response={existingResponse}
        closed={false}
        onEdit={() => setViewMode('edit')}
      />
    );
  }

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const toggleGatheringDate = (d: string) => {
    setForm((prev) => ({
      ...prev,
      gatheringDates: prev.gatheringDates.includes(d)
        ? prev.gatheringDates.filter((x) => x !== d)
        : [...prev.gatheringDates, d],
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!form.matchGender) {
      setError('매칭 희망 성별을 선택해 주세요.');
      return;
    }
    const nickname = form.nickname.trim();
    if (nickname.length < 2 || nickname.length > 12) {
      setError('새로운 닉네임은 2~12자로 입력해 주세요.');
      return;
    }
    const munto = form.muntoNickname.trim();
    if (munto && munto === nickname) {
      setError('새로운 닉네임은 문토 닉네임과 달라야 해요.');
      return;
    }
    if (!form.phoneType) {
      setError('휴대폰 타입을 선택해 주세요.');
      return;
    }

    const openTextFields: [keyof FormState, string][] = [
      ['convStyleSelf', '대화 성향 - 저는 이런 사람'],
      ['convWithStrangers', '대화 성향 - 낯선이와 함께할 때'],
      ['convAttraction', '대화 성향 - 매력 포인트'],
      ['idealImportant', '이상형 - 중요하게 보는 것'],
      ['idealSoulmateMust', '이상형 - 소울메이트라면 이건 맞아야지'],
      ['idealRelationship', '이상형 - 기대하는 관계'],
      ['idealPartnerQ', '이상형 - 파트너에게 하고 싶은 질문'],
    ];
    for (const [k, label] of openTextFields) {
      const v = (form[k] as string).trim();
      if (!v) {
        setError(`"${label}" 항목을 작성해 주세요.`);
        return;
      }
    }

    if (form.availableSlots.length < 2) {
      setError('통화 가능 시간은 최소 2개 이상 선택해 주세요.');
      return;
    }

    if (!form.privacyAgreed) {
      setError('개인정보 수집·이용 동의가 필요해요.');
      return;
    }

    if (isMale) {
      const url = form.kakaoOpenchatUrl.trim();
      if (!url) {
        setError('오픈채팅방 링크를 입력해 주세요.');
        return;
      }
      if (!url.startsWith('https://open.kakao.com/')) {
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
          matchGender: form.matchGender,
          muntoNickname: munto || undefined,
          nickname,
          phoneType: form.phoneType,
          convStyleSelf: form.convStyleSelf.trim(),
          convWithStrangers: form.convWithStrangers.trim(),
          convAttraction: form.convAttraction.trim(),
          idealImportant: form.idealImportant.trim(),
          idealSoulmateMust: form.idealSoulmateMust.trim(),
          idealRelationship: form.idealRelationship.trim(),
          idealPartnerQ: form.idealPartnerQ.trim(),
          day1Soulfood: form.day1Soulfood.trim() || undefined,
          day2Hobby: form.day2Hobby.trim() || undefined,
          day3Place: form.day3Place.trim() || undefined,
          day4Together: form.day4Together.trim() || undefined,
          day5SecretMission: form.day5SecretMission.trim() || undefined,
          availableSlots: form.availableSlots,
          gatheringDates: form.gatheringDates,
          marketingAgreed: form.marketingAgreed,
          kakaoOpenchatUrl: isMale ? form.kakaoOpenchatUrl.trim() : undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
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
            답변이 저장됐어요. 마감 전까지 언제든 수정할 수 있어요.
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
      <header style={{ marginBottom: 24 }}>
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
          답변은 파트너 매칭에 쓰여요.{' '}
          {hasExisting && '이미 제출한 내용을 수정할 수 있어요.'}
        </p>
        {deadlineBadge && (
          <p
            style={{
              marginTop: 10,
              display: 'inline-block',
              padding: '4px 10px',
              fontSize: 12,
              color: 'var(--forest-deep)',
              background: 'rgba(90,122,92,0.1)',
              borderRadius: 999,
            }}
          >
            {deadlineBadge}
          </p>
        )}

        {hasExisting && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 14,
              padding: 4,
              background: 'rgba(0,0,0,0.04)',
              borderRadius: 999,
              width: 'fit-content',
            }}
          >
            <ToggleBtn active>수정</ToggleBtn>
            <button
              type="button"
              onClick={() => setViewMode('view')}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '6px 14px',
                fontSize: 12,
                color: 'var(--sub)',
                cursor: 'pointer',
              }}
            >
              내 답변 보기
            </button>
          </div>
        )}
      </header>

      {/* Page 1 — 기본정보 */}
      <Section title="1. 기본 정보">
        <ReadonlyRow label="이름" value={application.name} />
        <ReadonlyRow label="성별" value={application.gender === 'male' ? '남성' : '여성'} />
        <Field label="매칭 희망 성별" required>
          <RadioGroup
            name="matchGender"
            value={form.matchGender}
            onChange={(v) => update('matchGender', v as MatchGenderPreference)}
            options={[
              { value: 'opposite', label: '이성' },
              { value: 'same', label: '동성' },
              { value: 'any', label: '상관없음' },
            ]}
          />
        </Field>
        <ReadonlyRow label="나이 (년생)" value={`${application.birthYear}`} />
        <Field label="문토 닉네임" hint="문토에서 사용하는 닉네임 (선택)">
          <input
            type="text"
            value={form.muntoNickname}
            onChange={(e) => update('muntoNickname', e.target.value)}
            maxLength={40}
            style={inputStyle}
          />
        </Field>
        <Field label="새로운 닉네임" required hint="이번 회차에서 쓸 이름 (2~12자)">
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
        <ReadonlyRow label="직업" value={application.occupation} />
        <Field label="휴대폰 타입" required>
          <RadioGroup
            name="phoneType"
            value={form.phoneType}
            onChange={(v) => update('phoneType', v as PhoneType)}
            options={[
              { value: 'iphone', label: '아이폰' },
              { value: 'galaxy', label: '갤럭시' },
              { value: 'other', label: '기타' },
            ]}
          />
        </Field>
      </Section>

      {/* Page 2 — 대화 성향 */}
      <Section title="2. 대화 성향" subtitle="자유롭게 작성해 주세요.">
        <Field label="저는 대화할 때 이런 사람 같아요!" required>
          <textarea
            value={form.convStyleSelf}
            onChange={(e) => update('convStyleSelf', e.target.value)}
            rows={3}
            required
            style={textareaStyle}
          />
        </Field>
        <Field label="낯선이와 함께할 때 저는 이래요!" required>
          <textarea
            value={form.convWithStrangers}
            onChange={(e) => update('convWithStrangers', e.target.value)}
            rows={3}
            required
            style={textareaStyle}
          />
        </Field>
        <Field label="남들에게 칭찬받는 대화할 때의 나의 매력 포인트?" required>
          <textarea
            value={form.convAttraction}
            onChange={(e) => update('convAttraction', e.target.value)}
            rows={3}
            required
            style={textareaStyle}
          />
        </Field>
      </Section>

      {/* Page 3 — 이상형 */}
      <Section title="3. 이상형·가치관">
        <Field label="사람을 볼 때 당신이 가장 중요하게 보는 것은?" required>
          <textarea
            value={form.idealImportant}
            onChange={(e) => update('idealImportant', e.target.value)}
            rows={3}
            required
            style={textareaStyle}
          />
        </Field>
        <Field label="소울메이트라면 이건 맞아야지!" required>
          <textarea
            value={form.idealSoulmateMust}
            onChange={(e) => update('idealSoulmateMust', e.target.value)}
            rows={3}
            required
            style={textareaStyle}
          />
        </Field>
        <Field label="나의 전화 메이트와 이런 관계를 기대하고 있어요!" required>
          <textarea
            value={form.idealRelationship}
            onChange={(e) => update('idealRelationship', e.target.value)}
            rows={3}
            required
            style={textareaStyle}
          />
        </Field>
        <Field label="이번 커넥팅 기간 동안 내 파트너에게 꼭 하고 싶은 질문 한가지?" required>
          <textarea
            value={form.idealPartnerQ}
            onChange={(e) => update('idealPartnerQ', e.target.value)}
            rows={3}
            required
            style={textareaStyle}
          />
        </Field>
      </Section>

      {/* Page 4 — Day별 */}
      <Section
        title="4. Day별 답변"
        subtitle="프로그램 중 하루 한 주제씩 공유할 답변이에요. 비워두면 '없음'으로 남아요."
      >
        <Field label={dayPrompts.day1}>
          <textarea
            value={form.day1Soulfood}
            onChange={(e) => update('day1Soulfood', e.target.value)}
            rows={3}
            style={textareaStyle}
          />
        </Field>
        <Field label={dayPrompts.day2}>
          <textarea
            value={form.day2Hobby}
            onChange={(e) => update('day2Hobby', e.target.value)}
            rows={3}
            style={textareaStyle}
          />
        </Field>
        <Field label={dayPrompts.day3}>
          <textarea
            value={form.day3Place}
            onChange={(e) => update('day3Place', e.target.value)}
            rows={3}
            style={textareaStyle}
          />
        </Field>
        <Field label={dayPrompts.day4}>
          <textarea
            value={form.day4Together}
            onChange={(e) => update('day4Together', e.target.value)}
            rows={3}
            style={textareaStyle}
          />
        </Field>
        <Field label={dayPrompts.day5}>
          <textarea
            value={form.day5SecretMission}
            onChange={(e) => update('day5SecretMission', e.target.value)}
            rows={3}
            style={textareaStyle}
          />
        </Field>
      </Section>

      {/* Page 5 — 일정 */}
      <Section
        title="5. 일정"
        subtitle="통화 가능한 날짜×시간을 모두 선택해 주세요. 최소 2개 이상."
      >
        <Field label="통화 가능 시간" required hint="날짜 행 × 시간 블록 열">
          <SlotGrid
            startDate={cohort.programStartDate}
            endDate={cohort.programEndDate}
            value={form.availableSlots}
            onChange={(v) => update('availableSlots', v)}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--sub)' }}>
            선택한 슬롯: {form.availableSlots.length}개
            {form.availableSlots.length < 2 && ' (최소 2개 필요)'}
          </p>
        </Field>

        <Field label="오프라인 개더링 참여 희망 날짜" hint="(선택) 참여 가능한 날짜에 체크">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {programDates.map((d) => {
              const checked = form.gatheringDates.includes(d);
              return (
                <label
                  key={d}
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
                    onChange={() => toggleGatheringDate(d)}
                    style={{ accentColor: 'var(--forest)' }}
                  />
                  {d}
                </label>
              );
            })}
          </div>
        </Field>

        <ReadonlyRow label="연락처" value={application.phone} />
      </Section>

      {/* Page 6 — 동의 */}
      <Section title="6. 동의">
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          <input
            type="checkbox"
            checked={form.privacyAgreed}
            onChange={(e) => update('privacyAgreed', e.target.checked)}
            required
            style={{ accentColor: 'var(--forest)' }}
          />
          <span>
            개인정보 수집·이용에 동의합니다. <span style={{ color: 'var(--accent)' }}>*</span>
          </span>
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={form.marketingAgreed}
            onChange={(e) => update('marketingAgreed', e.target.checked)}
            style={{ accentColor: 'var(--forest)' }}
          />
          <span>마케팅 활용에 동의합니다. (선택)</span>
        </label>
      </Section>

      {/* Page 7 — 남성 전용 */}
      {isMale && (
        <Section title="7. 1:1 오픈채팅방 링크">
          <Field
            label="카카오톡 1:1 오픈채팅 링크"
            required
            hint="여자 파트너가 먼저 들어올 수 있도록 1:1 오픈채팅방을 생성해서 붙여 주세요."
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
        {submitting ? '저장 중...' : hasExisting ? '수정해서 다시 저장' : '제출하기'}
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
          lineHeight: 1.45,
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

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 12px',
        marginBottom: 10,
        background: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--sub)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            style={{
              flex: '1 1 0',
              minWidth: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 12px',
              border: `1px solid ${checked ? 'var(--forest)' : 'var(--border)'}`,
              borderRadius: 10,
              background: checked ? 'rgba(90,122,92,0.08)' : 'var(--surface)',
              cursor: 'pointer',
              fontSize: 14,
              color: checked ? 'var(--forest-deep)' : 'var(--ink)',
              fontWeight: checked ? 600 : 400,
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              style={{ accentColor: 'var(--forest)' }}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

function ToggleBtn({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        background: active ? 'var(--forest)' : 'transparent',
        color: active ? '#fff' : 'var(--sub)',
      }}
    >
      {children}
    </span>
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

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 72,
  lineHeight: 1.5,
};
