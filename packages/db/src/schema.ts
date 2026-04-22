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
export interface MatchResponse {
  id: string;
  applicationId: string;
  cohortId: string;

  nickname: string;
  region: string;
  callTimes: string[];
  mbti?: string;

  // Conversation style (1-5 Likert)
  convEnergy?: number;   // introvert ↔ extrovert
  convThinking?: number; // logical ↔ emotional
  convPlanning?: number; // planner ↔ spontaneous
  convPace?: number;     // listener ↔ talker
  convDepth?: number;    // light ↔ deep

  // Values (1-5 importance)
  valuesMarriage?: number;
  valuesCareer?: number;
  valuesFamily?: number;
  valuesHobby?: number;
  valuesIndependence?: number;

  // Day-by-day topics
  day2Answer?: string;
  day3Answer?: string;
  day4Answer?: string;
  day5Answer?: string;
  day6Answer?: string;
  day7Answer?: string;

  // Male only
  kakaoOpenchatUrl?: string;

  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchResponseInput = Omit<MatchResponse, 'id' | 'submittedAt' | 'createdAt' | 'updatedAt'>;
