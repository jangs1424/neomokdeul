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
  voiceFileName?: string;
  photoFileName?: string;
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
