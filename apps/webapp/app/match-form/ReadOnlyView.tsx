'use client';

import type {
  Application,
  Cohort,
  MatchResponse,
} from '@neomokdeul/db';
import { SlotGrid, enumerateDates } from './SlotGrid';

const GENDER_LABEL: Record<string, string> = {
  opposite: '이성',
  same: '동성',
  any: '상관없음',
};

const PHONE_LABEL: Record<string, string> = {
  iphone: '아이폰',
  galaxy: '갤럭시',
  other: '기타',
};

interface Props {
  application: Application;
  cohort: Cohort;
  response: MatchResponse;
  closed: boolean;
  onEdit?: () => void;
}

export function ReadOnlyView({ application, cohort, response, closed, onEdit }: Props) {
  const dates = enumerateDates(cohort.programStartDate, cohort.programEndDate);

  return (
    <div style={{ padding: '24px 20px 48px' }}>
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
          내 답변 보기
        </h1>
        {closed ? (
          <div
            style={{
              marginTop: 10,
              padding: '10px 12px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--accent)',
            }}
          >
            수정 마감됐어요. 더 이상 답변을 수정할 수 없어요.
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6 }}>
            제출한 답변입니다. 필요하면 수정할 수 있어요.
          </p>
        )}
      </header>

      <Section title="기본 정보">
        <Row label="이름" value={application.name} />
        <Row label="성별" value={application.gender === 'male' ? '남성' : '여성'} />
        <Row
          label="매칭 희망 성별"
          value={response.matchGender ? GENDER_LABEL[response.matchGender] : '—'}
        />
        <Row label="나이 (년생)" value={`${application.birthYear}`} />
        <Row label="문토 닉네임" value={response.muntoNickname ?? '—'} />
        <Row label="새로운 닉네임" value={response.nickname} />
        <Row label="직업" value={application.occupation} />
        <Row
          label="휴대폰 타입"
          value={response.phoneType ? PHONE_LABEL[response.phoneType] : '—'}
        />
      </Section>

      <Section title="대화 성향">
        <Block label="대화할 때 이런 사람" value={response.convStyleSelf} />
        <Block label="낯선이와 함께할 때" value={response.convWithStrangers} />
        <Block label="매력 포인트" value={response.convAttraction} />
      </Section>

      <Section title="이상형·가치관">
        <Block label="가장 중요하게 보는 것" value={response.idealImportant} />
        <Block label="소울메이트라면 이건 맞아야지" value={response.idealSoulmateMust} />
        <Block label="기대하는 관계" value={response.idealRelationship} />
        <Block label="파트너에게 하고 싶은 질문" value={response.idealPartnerQ} />
      </Section>

      <Section title="Day별 답변">
        <Block label={cohort.matchDay1Prompt ?? 'Day1 소울푸드'} value={response.day1Soulfood} />
        <Block label={cohort.matchDay2Prompt ?? 'Day2 취미'} value={response.day2Hobby} />
        <Block label={cohort.matchDay3Prompt ?? 'Day3 장소'} value={response.day3Place} />
        <Block label={cohort.matchDay4Prompt ?? 'Day4 함께 하고 싶은 것'} value={response.day4Together} />
        <Block label={cohort.matchDay5Prompt ?? 'Day5 비밀 미션'} value={response.day5SecretMission} />
      </Section>

      <Section title="통화 가능 시간">
        <SlotGrid
          startDate={cohort.programStartDate}
          endDate={cohort.programEndDate}
          value={response.availableSlots}
          onChange={() => {}}
          readOnly
        />
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--sub)' }}>
          선택한 슬롯: {response.availableSlots.length}개
        </p>
      </Section>

      <Section title="오프라인 개더링 참여 희망 날짜">
        {response.gatheringDates.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--sub)' }}>선택한 날짜 없음</p>
        ) : (
          <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--ink)' }}>
            {response.gatheringDates
              .filter((d) => dates.includes(d))
              .map((d) => (
                <li key={d}>{d}</li>
              ))}
          </ul>
        )}
      </Section>

      <Section title="연락·동의">
        <Row label="연락처" value={application.phone} />
        <Row label="개인정보 수집·이용" value="동의함" />
        <Row label="마케팅 활용" value={response.marketingAgreed ? '동의' : '미동의'} />
        {application.gender === 'male' && (
          <Row label="1:1 오픈채팅방 링크" value={response.kakaoOpenchatUrl ?? '—'} />
        )}
      </Section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {!closed && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              padding: '14px',
              background: 'var(--forest)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            수정하러 가기
          </button>
        )}
        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '12px',
            fontSize: 14,
            color: 'var(--sub)',
          }}
        >
          ← 홈으로
        </a>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
                    fontSize: 18,
          color: 'var(--ink)',
          marginBottom: 14,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 0',
        borderBottom: '1px dashed var(--border)',
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--sub)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--sub)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: 'var(--ink)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.55,
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          minHeight: 40,
        }}
      >
        {value && value.trim().length > 0 ? value : '—'}
      </div>
    </div>
  );
}
