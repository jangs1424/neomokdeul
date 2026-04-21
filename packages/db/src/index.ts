import reviewsData from '../data/reviews.json' with { type: 'json' };
import statsData from '../data/stats.json' with { type: 'json' };

export type Review = {
  id: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
  cohort: string;
  cohortLabel: string;
};

export type CohortStat = {
  id: string;
  label: string;
  n: number;
  avgRating: number;
  recommendRate: number;
};

export type Stats = {
  totalParticipants: number;
  averageRating: number;
  recommendRate: number;
  cohorts: CohortStat[];
};

export const reviews: Review[] = reviewsData as Review[];
export const stats: Stats = statsData as Stats;

export type { Application, ApplicationInput, ApplicationStatus, Gender } from './schema';
export {
  listApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
} from './store';
