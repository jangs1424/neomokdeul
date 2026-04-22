export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type Gender = 'male' | 'female';

export interface Application {
  id: string;
  name: string;
  phone: string;
  gender: Gender;
  birthYear: number;
  occupation: string;
  region: string;
  callTimes: string[];
  mbti?: string;
  previousCohort: boolean;
  cohortId: string;
  motivation: string;
  source: string;
  agreed: boolean;
  voiceFilePath?: string;   // Supabase Storage object path, e.g. "1761234567890-uuid.webm"
  photoFilePath?: string;   // e.g. "1761234567890-uuid.jpg"
  status: ApplicationStatus;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ApplicationInput = Omit<Application, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'note'>;

export type CohortStatus = 'draft' | 'recruiting' | 'closed' | 'running' | 'completed';

export interface Cohort {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: CohortStatus;
  programStartDate: string;
  programEndDate: string;
  applyOpensAt: string;
  applyClosesAt: string;
  priceKrw: number;
  maxMale: number;
  maxFemale: number;
  latpeedPaymentUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  specialFeatures: string[];
  approvedSmsTemplate?: string;
  applyIntroText?: string;
  voiceIntroHelp?: string;
  photoHelp?: string;
  motivationPrompt?: string;
  // Phase 12: match form controls
  matchFormClosesAt?: string;  // timestamptz — after this, read-only
  matchDay1Prompt?: string;
  matchDay2Prompt?: string;
  matchDay3Prompt?: string;
  matchDay4Prompt?: string;
  matchDay5Prompt?: string;
}

// ---------------------------------------------------------------------------
// Matching (Phase 5)
// ---------------------------------------------------------------------------
export type MatchingStatus = 'draft' | 'published' | 'superseded';

export interface Matching {
  id: string;
  cohortId: string;
  round: 1 | 2;
  maleApplicationId: string;
  femaleApplicationId: string;
  score?: number;
  reasoning?: string;
  status: MatchingStatus;
  supersededBy?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exclusion {
  id: string;
  phoneA: string;
  phoneB: string;
  reason?: string;
  sourceCohortId?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Match form response (Phase 11) — per-applicant answers filled on Day 1.
// Drives the matching algorithm (not the application form).
// ---------------------------------------------------------------------------
export type MatchGenderPreference = 'opposite' | 'same' | 'any';
export type PhoneType = 'iphone' | 'galaxy' | 'other';

export interface MatchResponse {
  id: string;
  applicationId: string;
  cohortId: string;

  // Basic (Tally p.1)
  nickname: string;              // 새로운 닉네임
  muntoNickname?: string;        // 기존 문토 닉네임
  region: string;
  mbti?: string;
  matchGender?: MatchGenderPreference;
  phoneType?: PhoneType;

  // 대화 성향 (Tally p.2, 3 open-text)
  convStyleSelf?: string;        // 대화할 때 이런 사람
  convWithStrangers?: string;    // 낯선이와 함께할 때
  convAttraction?: string;       // 매력 포인트

  // 이상형·가치관 (Tally p.3, 4 open-text)
  idealImportant?: string;       // 사람 볼 때 중요한 것
  idealSoulmateMust?: string;    // 소울메이트라면 이건 맞아야지
  idealRelationship?: string;    // 기대하는 관계
  idealPartnerQ?: string;        // 파트너에게 하고 싶은 질문

  // Day 1~5 답변 (Tally p.4)
  day1Soulfood?: string;
  day2Hobby?: string;
  day3Place?: string;
  day4Together?: string;
  day5SecretMission?: string;

  // 통화 가능 슬롯 — Phase 12: 날짜×시간 구체 지정
  availableSlots: string[];      // ["YYYY-MM-DD_HH-HH", ...]

  // 개더링·연락
  gatheringDates: string[];      // 참여 가능 날짜들
  kakaoOpenchatUrl?: string;     // 남성만

  // 동의
  marketingAgreed: boolean;

  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchResponseInput = Omit<MatchResponse, 'id' | 'submittedAt' | 'createdAt' | 'updatedAt'>;
