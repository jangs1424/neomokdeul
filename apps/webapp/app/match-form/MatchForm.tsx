'use client';

import { useMemo, useState } from 'react';
import type {
  Application,
  Cohort,
  MatchResponse,
} from '@neomokdeul/db';
import { SlotGrid } from './SlotGrid';
import { ReadOnlyView } from './ReadOnlyView';

// Local aliases — kept in sync with @neomokdeul/db/schema.ts (not re-exported from index.ts).
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
  privacyAgreed: boolean;
  partnerInfoAgreed: boolean;
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
    privacyAgreed: hasExisting,
    partnerInfoAgreed: hasExisting,
    marketingAgreed: existingResponse?.marketingAgreed ?? false,
    kakaoOpenchatUrl: existingResponse?.kakaoOpenchatUrl ?? '',
  };

  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  const deadlineBadge = useMemo(() => computeDeadlineBadge(deadline), [deadline]);

  const dayPrompts = {
    day1: cohort.matchDay1Prompt ?? DEFAULT_DAY_PROMPTS.day1,
    day2: cohort.matchDay2Prompt ?? DEFAULT_DAY_PROMPTS.day2,
    day3: cohort.matchDay3Prompt ?? DEFAULT_DAY_PROMPTS.day3,
    day4: cohort.matchDay4Prompt ?? DEFAULT_DAY_PROMPTS.day4,
    day5: cohort.matchDay5Prompt ?? DEFAULT_DAY_PROMPTS.day5,
  };

  // Phase 12 Option A — per-cohort editable question prompts (fallback to Tally defaults)
  const mainQuestions = {
    convStyleSelf: cohort.matchQConvStyleSelf ?? "저는 대화할 때 이런 사람 같아요!",
    convWithStrangers: cohort.matchQConvWithStrangers ?? "낯선이와 함께할 때 저는 이래요!",
    convAttraction: cohort.matchQConvAttraction ?? "남들에게 칭찬받는 대화할 때의 나의 매력 포인트?",
    idealImportant: cohort.matchQIdealImportant ?? "사람을 볼 때 당신이 가장 중요하게 보는 것은?",
    idealSoulmateMust: cohort.matchQIdealSoulmateMust ?? "소울메이트라면 이건 맞아야지!",
    idealRelationship: cohort.matchQIdealRelationship ?? "나의 전화 메이트와 이런 관계를 기대하고 있어요!",
    idealPartnerQ: cohort.matchQIdealPartnerQ ?? "이번 커넥팅 기간 동안 내 파트너에게 꼭 하고 싶은 질문 한가지?",
  };

  // Phase 16 — 객관식 선택지 (있으면 라디오)
  const mainChoices: Record<keyof typeof mainQuestions, string[] | undefined> = {
    convStyleSelf: cohort.matchQConvStyleSelfChoices,
    convWithStrangers: cohort.matchQConvWithStrangersChoices,
    convAttraction: cohort.matchQConvAttractionChoices,
    idealImportant: cohort.matchQIdealImportantChoices,
    idealSoulmateMust: cohort.matchQIdealSoulmateMustChoices,
    idealRelationship: cohort.matchQIdealRelationshipChoices,
    idealPartnerQ: cohort.matchQIdealPartnerQChoices,
  };

  const openchatHelpImages = cohort.kakaoOpenchatHelpImageUrls ?? [];

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const nickname = form.nickname.trim();
    if (nickname.length < 2 || nickname.length > 12) {
      setError('비밀 닉네임은 2~12자로 입력해 주세요.');
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
    if (!form.partnerInfoAgreed) {
      setError('파트너에게 정보 공개 동의가 필요해요.');
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
          matchGender: 'opposite', // 폼에서 제외 — 항상 이성 매칭
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
          gatheringDates: [],
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
              background: 'rgba(31,138,92,0.1)',
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
        <ReadonlyRow label="나이 (년생)" value={`${application.birthYear}`} />
        <Field
          label="7일간 사용할 비밀 닉네임"
          required
          hint="이번 회차에서 쓸 새로운 이름 (2~12자) — 본명·SNS 아이디 노출 금지"
        >
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
      <Section title="2. 대화 성향" subtitle="가장 가까운 답변을 골라 주세요.">
        <MainQuestion
          label={mainQuestions.convStyleSelf}
          value={form.convStyleSelf}
          onChange={(v) => update('convStyleSelf', v)}
          choices={mainChoices.convStyleSelf}
          name="convStyleSelf"
        />
        <MainQuestion
          label={mainQuestions.convWithStrangers}
          value={form.convWithStrangers}
          onChange={(v) => update('convWithStrangers', v)}
          choices={mainChoices.convWithStrangers}
          name="convWithStrangers"
        />
        <MainQuestion
          label={mainQuestions.convAttraction}
          value={form.convAttraction}
          onChange={(v) => update('convAttraction', v)}
          choices={mainChoices.convAttraction}
          name="convAttraction"
        />
      </Section>

      {/* Page 3 — 이상형 */}
      <Section title="3. 이상형·가치관">
        <MainQuestion
          label={mainQuestions.idealImportant}
          value={form.idealImportant}
          onChange={(v) => update('idealImportant', v)}
          choices={mainChoices.idealImportant}
          name="idealImportant"
        />
        <MainQuestion
          label={mainQuestions.idealSoulmateMust}
          value={form.idealSoulmateMust}
          onChange={(v) => update('idealSoulmateMust', v)}
          choices={mainChoices.idealSoulmateMust}
          name="idealSoulmateMust"
        />
        <MainQuestion
          label={mainQuestions.idealRelationship}
          value={form.idealRelationship}
          onChange={(v) => update('idealRelationship', v)}
          choices={mainChoices.idealRelationship}
          name="idealRelationship"
        />
        <MainQuestion
          label={mainQuestions.idealPartnerQ}
          value={form.idealPartnerQ}
          onChange={(v) => update('idealPartnerQ', v)}
          choices={mainChoices.idealPartnerQ}
          name="idealPartnerQ"
        />
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

        <ReadonlyRow label="연락처" value={application.phone} />
      </Section>

      {/* Page 6 — 동의 */}
      <Section
        title="6. 동의"
        subtitle="아래 내용을 확인하고 체크해 주세요. 마케팅은 선택입니다."
      >
        <ConsentBlock
          required
          checked={form.privacyAgreed}
          onChange={(c) => update('privacyAgreed', c)}
          title="개인정보 수집·이용 동의 (필수)"
          body={
            <>
              <p>· 수집 항목: 이름, 연락처, 생년, 성별, 직업, 거주지, MBTI, 음성·사진 자기소개, 매칭 폼 답변(대화 성향·이상형·소울푸드·취미·장소·미션 등), 통화 가능 시간</p>
              <p>· 이용 목적: 매칭 알고리즘 입력, 파트너 매칭, 프로그램 운영(SMS 안내), 통계·서비스 개선</p>
              <p>· 보유 기간: 프로그램 종료 후 6개월 (분쟁 대응 목적). 이후 즉시 파기. 통계용 비식별 데이터는 별도 보관 가능</p>
              <p>· 동의를 거부할 권리가 있으나, 거부 시 매칭 진행이 불가합니다.</p>
            </>
          }
        />

        <ConsentBlock
          required
          checked={form.partnerInfoAgreed}
          onChange={(c) => update('partnerInfoAgreed', c)}
          title="파트너에게 정보 공개 동의 (필수)"
          body={
            <>
              <p>· 공개 항목 (매칭된 상대방에게만 노출): 비밀 닉네임, 출생연도, 성별, 거주지, MBTI, 음성·사진 자기소개, 매칭 폼 답변, 카카오톡 1:1 오픈채팅방 링크(남자 한정)</p>
              <p>· 본명·전화번호·실제 SNS 계정은 공개되지 않습니다.</p>
              <p>· 프로그램 종료 후 양측 동의 시에만 연락처 교환이 진행됩니다.</p>
            </>
          }
        />

        <ConsentBlock
          checked={form.marketingAgreed}
          onChange={(c) => update('marketingAgreed', c)}
          title="마케팅·후기 활용 동의 (선택)"
          body={
            <>
              <p>· 프로그램 종료 후 후기 요청 SMS 발송 및 SNS·블로그에 익명 후기 활용에 동의합니다. (개인 식별 정보는 사용되지 않습니다)</p>
              <p>· 다음 기수 모집 안내 등 Socially의 프로그램 안내 문자를 수신하는 데 동의합니다.</p>
              <p>· 동의를 거부해도 본 매칭 진행에는 영향이 없습니다.</p>
            </>
          }
        />
      </Section>

      {/* Page 7 — 남성 전용 */}
      {isMale && (
        <Section
          title="7. 1:1 오픈채팅방 링크"
          subtitle="여자 파트너가 먼저 들어올 수 있도록 카카오톡 1:1 오픈채팅방을 만들어 링크를 입력해 주세요."
        >
          {openchatHelpImages.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 18,
                padding: 14,
                background: 'var(--bg-soft, #f7faf8)',
                border: '1px solid var(--border)',
                borderRadius: 12,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--sub)',
                  lineHeight: 1.6,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                ↓ 만드는 방법 (이미지 참고)
              </p>
              {openchatHelpImages.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`오픈채팅 만들기 ${i + 1}단계`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: '#fff',
                  }}
                  loading="lazy"
                />
              ))}
            </div>
          )}
          <Field
            label="카카오톡 1:1 오픈채팅 링크"
            required
            hint="https://open.kakao.com/ 으로 시작해야 해요."
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
              background: checked ? 'rgba(31,138,92,0.08)' : 'var(--surface)',
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

/**
 * ConsentBlock — 약관 본문 + 동의 체크박스.
 */
function ConsentBlock({
  required,
  checked,
  onChange,
  title,
  body,
}: {
  required?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        background: 'var(--surface)',
        border: `1px solid ${checked ? 'var(--forest)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 14px 10px',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
        {required && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>*</span>}
      </div>
      <div
        style={{
          padding: '0 14px 10px',
          fontSize: 12.5,
          color: 'var(--sub)',
          lineHeight: 1.7,
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        {body}
      </div>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: checked ? 'rgba(31,138,92,0.06)' : 'rgba(0,0,0,0.02)',
          borderTop: '1px solid var(--border)',
          fontSize: 13,
          fontWeight: 600,
          color: checked ? 'var(--forest-deep)' : 'var(--ink)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          style={{ accentColor: 'var(--forest)' }}
        />
        위 내용을 확인하고 동의합니다
      </label>
    </div>
  );
}

/**
 * MainQuestion — textarea OR vertical radio list 분기.
 * choices가 비어있으면 textarea, 1개 이상이면 라디오.
 */
function MainQuestion({
  label,
  value,
  onChange,
  choices,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  choices: string[] | undefined;
  name: string;
}) {
  const isRadio = Array.isArray(choices) && choices.length > 0;
  return (
    <Field label={label} required>
      {isRadio ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {choices!.map((opt) => {
            const checked = value === opt;
            return (
              <label
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  border: `1px solid ${checked ? 'var(--forest)' : 'var(--border)'}`,
                  borderRadius: 12,
                  background: checked ? 'rgba(31,138,92,0.08)' : 'var(--surface)',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: checked ? 'var(--forest-deep)' : 'var(--ink)',
                  fontWeight: checked ? 600 : 400,
                }}
              >
                <input
                  type="radio"
                  name={name}
                  value={opt}
                  checked={checked}
                  onChange={() => onChange(opt)}
                  style={{ accentColor: 'var(--forest)', marginTop: 3 }}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          required
          style={textareaStyle}
        />
      )}
    </Field>
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
