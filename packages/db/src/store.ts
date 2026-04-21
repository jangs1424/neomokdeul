import { getSupabaseAdmin } from './supabase';
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
  Cohort,
  CohortStatus,
} from './schema';

// ---------------------------------------------------------------------------
// Row shapes (snake_case, matches Postgres columns)
// ---------------------------------------------------------------------------
type ApplicationRow = {
  id: string;
  cohort_id: string;
  name: string;
  phone: string;
  gender: 'male' | 'female';
  birth_year: number;
  occupation: string;
  region: string;
  call_times: string[];
  mbti: string | null;
  previous_cohort: boolean;
  previous_cohort_id: string | null;
  motivation: string;
  source: string;
  voice_file_url: string | null;
  photo_file_url: string | null;
  agreed_at: string;
  status: ApplicationStatus;
  note: string | null;
  payment_link_sent_at: string | null;
  payment_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CohortRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: CohortStatus;
  program_start_date: string;
  program_end_date: string;
  apply_opens_at: string;
  apply_closes_at: string;
  price_krw: number;
  max_male: number;
  max_female: number;
  latpeed_payment_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  special_features: string[];
  approved_sms_template: string | null;
  apply_intro_text: string | null;
  voice_intro_help: string | null;
  photo_help: string | null;
  motivation_prompt: string | null;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Row <-> camelCase object mappers
// ---------------------------------------------------------------------------
function rowToApplication(r: ApplicationRow): Application {
  return {
    id: r.id,
    cohortId: r.cohort_id,
    name: r.name,
    phone: r.phone,
    gender: r.gender,
    birthYear: r.birth_year,
    occupation: r.occupation,
    region: r.region,
    callTimes: r.call_times,
    mbti: r.mbti ?? undefined,
    previousCohort: r.previous_cohort,
    motivation: r.motivation,
    source: r.source,
    voiceFileName: r.voice_file_url ?? undefined,
    photoFileName: r.photo_file_url ?? undefined,
    agreed: Boolean(r.agreed_at),
    status: r.status,
    note: r.note ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToCohort(r: CohortRow): Cohort {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? undefined,
    status: r.status,
    programStartDate: r.program_start_date,
    programEndDate: r.program_end_date,
    applyOpensAt: r.apply_opens_at,
    applyClosesAt: r.apply_closes_at,
    priceKrw: r.price_krw,
    maxMale: r.max_male,
    maxFemale: r.max_female,
    latpeedPaymentUrl: r.latpeed_payment_url ?? undefined,
    heroTitle: r.hero_title ?? undefined,
    heroSubtitle: r.hero_subtitle ?? undefined,
    heroImageUrl: r.hero_image_url ?? undefined,
    specialFeatures: r.special_features ?? [],
    approvedSmsTemplate: r.approved_sms_template ?? undefined,
    applyIntroText: r.apply_intro_text ?? undefined,
    voiceIntroHelp: r.voice_intro_help ?? undefined,
    photoHelp: r.photo_help ?? undefined,
    motivationPrompt: r.motivation_prompt ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------
export async function listApplications(): Promise<Application[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`[listApplications] ${error.message}`);
  return (data ?? []).map((r) => rowToApplication(r as ApplicationRow));
}

export async function getApplication(id: string): Promise<Application | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`[getApplication] ${error.message}`);
  return data ? rowToApplication(data as ApplicationRow) : null;
}

export async function createApplication(
  input: ApplicationInput,
): Promise<Application> {
  const row: Partial<ApplicationRow> = {
    cohort_id: input.cohortId,
    name: input.name,
    phone: input.phone,
    gender: input.gender,
    birth_year: input.birthYear,
    occupation: input.occupation,
    region: input.region,
    call_times: input.callTimes,
    mbti: input.mbti ?? null,
    previous_cohort: input.previousCohort,
    motivation: input.motivation,
    source: input.source,
    voice_file_url: input.voiceFileName ?? null,
    photo_file_url: input.photoFileName ?? null,
    agreed_at: input.agreed ? new Date().toISOString() : '',
  };

  if (!input.agreed) {
    throw new Error('[createApplication] agreed must be true');
  }

  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .insert(row)
    .select('*')
    .single();

  if (error) {
    // Friendly message for duplicate-per-cohort violation
    if (error.code === '23505') {
      throw new Error('이미 같은 전화번호로 이 기수에 신청한 내역이 있어요.');
    }
    throw new Error(`[createApplication] ${error.message}`);
  }
  return rowToApplication(data as ApplicationRow);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  note?: string,
): Promise<Application | null> {
  const patch: Partial<ApplicationRow> = { status };
  if (note !== undefined) patch.note = note;

  const { data, error } = await getSupabaseAdmin()
    .from('applications')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`[updateApplicationStatus] ${error.message}`);
  return data ? rowToApplication(data as ApplicationRow) : null;
}

// ---------------------------------------------------------------------------
// Cohorts
// ---------------------------------------------------------------------------
export async function listCohorts(filter?: {
  status?: CohortStatus;
}): Promise<Cohort[]> {
  let query = getSupabaseAdmin().from('cohorts').select('*').order('program_start_date', { ascending: true });
  if (filter?.status) query = query.eq('status', filter.status);
  const { data, error } = await query;
  if (error) throw new Error(`[listCohorts] ${error.message}`);
  return (data ?? []).map((r) => rowToCohort(r as CohortRow));
}

export async function getCohort(id: string): Promise<Cohort | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('cohorts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`[getCohort] ${error.message}`);
  return data ? rowToCohort(data as CohortRow) : null;
}

export async function getCohortBySlug(slug: string): Promise<Cohort | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('cohorts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`[getCohortBySlug] ${error.message}`);
  return data ? rowToCohort(data as CohortRow) : null;
}

export async function getActiveCohort(): Promise<Cohort | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from('cohorts')
    .select('*')
    .eq('status', 'recruiting')
    .lte('apply_opens_at', nowIso)
    .gt('apply_closes_at', nowIso)
    .order('program_start_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[getActiveCohort] ${error.message}`);
  return data ? rowToCohort(data as CohortRow) : null;
}

export async function createCohort(
  input: Omit<Cohort, 'id'>,
): Promise<Cohort> {
  const row: Partial<CohortRow> = {
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    program_start_date: input.programStartDate,
    program_end_date: input.programEndDate,
    apply_opens_at: input.applyOpensAt,
    apply_closes_at: input.applyClosesAt,
    price_krw: input.priceKrw,
    max_male: input.maxMale,
    max_female: input.maxFemale,
    latpeed_payment_url: input.latpeedPaymentUrl ?? null,
    hero_title: input.heroTitle ?? null,
    hero_subtitle: input.heroSubtitle ?? null,
    hero_image_url: input.heroImageUrl ?? null,
    special_features: input.specialFeatures ?? [],
    approved_sms_template: input.approvedSmsTemplate ?? null,
    apply_intro_text: input.applyIntroText ?? null,
    voice_intro_help: input.voiceIntroHelp ?? null,
    photo_help: input.photoHelp ?? null,
    motivation_prompt: input.motivationPrompt ?? null,
  };

  const { data, error } = await getSupabaseAdmin()
    .from('cohorts')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new Error(`[createCohort] ${error.message}`);
  return rowToCohort(data as CohortRow);
}

export async function updateCohort(
  id: string,
  patch: Partial<Omit<Cohort, 'id'>>,
): Promise<Cohort | null> {
  const row: Partial<CohortRow> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description ?? null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.programStartDate !== undefined) row.program_start_date = patch.programStartDate;
  if (patch.programEndDate !== undefined) row.program_end_date = patch.programEndDate;
  if (patch.applyOpensAt !== undefined) row.apply_opens_at = patch.applyOpensAt;
  if (patch.applyClosesAt !== undefined) row.apply_closes_at = patch.applyClosesAt;
  if (patch.priceKrw !== undefined) row.price_krw = patch.priceKrw;
  if (patch.maxMale !== undefined) row.max_male = patch.maxMale;
  if (patch.maxFemale !== undefined) row.max_female = patch.maxFemale;
  if (patch.latpeedPaymentUrl !== undefined) row.latpeed_payment_url = patch.latpeedPaymentUrl ?? null;
  if (patch.heroTitle !== undefined) row.hero_title = patch.heroTitle ?? null;
  if (patch.heroSubtitle !== undefined) row.hero_subtitle = patch.heroSubtitle ?? null;
  if (patch.heroImageUrl !== undefined) row.hero_image_url = patch.heroImageUrl ?? null;
  if (patch.specialFeatures !== undefined) row.special_features = patch.specialFeatures;
  if (patch.approvedSmsTemplate !== undefined) row.approved_sms_template = patch.approvedSmsTemplate ?? null;
  if (patch.applyIntroText !== undefined) row.apply_intro_text = patch.applyIntroText ?? null;
  if (patch.voiceIntroHelp !== undefined) row.voice_intro_help = patch.voiceIntroHelp ?? null;
  if (patch.photoHelp !== undefined) row.photo_help = patch.photoHelp ?? null;
  if (patch.motivationPrompt !== undefined) row.motivation_prompt = patch.motivationPrompt ?? null;

  const { data, error } = await getSupabaseAdmin()
    .from('cohorts')
    .update(row)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`[updateCohort] ${error.message}`);
  return data ? rowToCohort(data as CohortRow) : null;
}
