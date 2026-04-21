export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export type Gender = 'male' | 'female';

export interface Application {
  id: string;
  name: string;
  phone: string;
  gender: Gender;
  birthYear: number;
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
