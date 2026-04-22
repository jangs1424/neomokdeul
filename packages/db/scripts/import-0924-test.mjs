#!/usr/bin/env node
/**
 * Import the 0924 cohort's matching-form responses into Supabase as a
 * TEST cohort ("test-0924"), so we can dry-run the new algorithm against
 * real past data.
 *
 * SAFETY:
 * - Phone numbers are MASKED to "010-0000-XXXX" (sequential)
 * - Cohort status is `draft` so it doesn't appear on landing
 * - No SMS is sent from this script
 *
 * Usage: node packages/db/scripts/import-0924-test.mjs
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

try {
  const raw = await readFile(resolve(repoRoot, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// ---- CSV parser (handles quoted multi-line cells) --------------------------
function parseCsv(text) {
  const rows = [];
  let cur = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; continue; }
      if (c === '"') { inQuotes = false; continue; }
      field += c;
    } else {
      if (c === '"') { inQuotes = true; continue; }
      if (c === ',') { cur.push(field); field = ''; continue; }
      if (c === '\r') { continue; }
      if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; continue; }
      field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

// ---- Slot mapping ----------------------------------------------------------
// Program: 2025-12-19 금 ~ 2025-12-25 목 (7 days)
const PROGRAM_START = '2025-12-19';
const PROGRAM_END   = '2025-12-25';
const WEEKDAY_DATES = ['2025-12-19', '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-25'];
const WEEKEND_DATES = ['2025-12-20', '2025-12-21'];

// Map original time labels → canonical "HH-HH" block
const TIME_LABEL_MAP = {
  '아침': '09-12', '아침 (08-12시)': '09-12', '아침 (09-12시)': '09-12',
  '낮': '13-18', '낮 (13-18시)': '13-18', '오후': '13-18', '오후 (13-18시)': '13-18',
  '저녁': '18-22', '저녁 (18-22시)': '18-22',
  '밤': '22-02', '밤 (22-02시)': '22-02', '야간': '22-02',
};

function labelToSlot(label) {
  const t = (label || '').trim();
  if (TIME_LABEL_MAP[t]) return TIME_LABEL_MAP[t];
  // Fuzzy: contains a known keyword
  if (/아침/.test(t)) return '09-12';
  if (/낮|오후/.test(t)) return '13-18';
  if (/저녁/.test(t)) return '18-22';
  if (/밤|새벽|심야|야간/.test(t)) return '22-02';
  return null;
}

function parseTimeCell(cell) {
  // Multiple labels can be separated by comma, slash, or newline
  return (cell || '')
    .split(/[,/\n]+/)
    .map(labelToSlot)
    .filter(Boolean);
}

function buildAvailableSlots(weekdayCell, weekendCell) {
  const wd = [...new Set(parseTimeCell(weekdayCell))];
  const we = [...new Set(parseTimeCell(weekendCell))];
  const out = [];
  for (const date of WEEKDAY_DATES) for (const slot of wd) out.push(`${date}_${slot}`);
  for (const date of WEEKEND_DATES) for (const slot of we) out.push(`${date}_${slot}`);
  return out;
}

function mapGender(raw) {
  const s = (raw || '').trim();
  if (/여/.test(s)) return 'female';
  if (/남/.test(s)) return 'male';
  return null;
}

function mapMatchGender(raw) {
  const s = (raw || '').trim();
  if (/이성/.test(s)) return 'opposite';
  if (/동성/.test(s)) return 'same';
  return 'any';
}

function mapPhoneType(raw) {
  const s = (raw || '').trim();
  if (/아이폰|iphone/i.test(s)) return 'iphone';
  if (/갤럭시|galaxy/i.test(s)) return 'galaxy';
  return 'other';
}

// ---- Main ------------------------------------------------------------------
const csvPath = resolve(
  repoRoot,
  '..',
  '🌊너의 목소리가 들려 (0924)_Submissions_2026-04-20.csv',
);

console.log('reading', csvPath);
const text = await readFile(csvPath, 'utf8');
const rows = parseCsv(text);
const header = rows[0];
const data = rows.slice(1).filter((r) => r[3] && r[3].trim()); // must have 이름 in column 3

console.log(`parsed ${data.length} submissions from CSV`);

function col(row, name) {
  const idx = header.findIndex((h) => h.trim() === name);
  return idx >= 0 ? (row[idx] || '').trim() : '';
}

// ---- Upsert test cohort ----------------------------------------------------
const cohortSlug = 'test-0924';

// Clean any previous test data
const { data: existing } = await sb.from('cohorts').select('id').eq('slug', cohortSlug).maybeSingle();
if (existing) {
  console.log('cleaning up previous test-0924 cohort', existing.id);
  await sb.from('match_responses').delete().eq('cohort_id', existing.id);
  await sb.from('matchings').delete().eq('cohort_id', existing.id);
  await sb.from('applications').delete().eq('cohort_id', existing.id);
  await sb.from('cohorts').delete().eq('id', existing.id);
}

const { data: cohort, error: cohortErr } = await sb
  .from('cohorts')
  .insert({
    slug: cohortSlug,
    name: '[TEST] 2025년 9월 기수 (알고리즘 검증용)',
    status: 'draft',
    program_start_date: PROGRAM_START,
    program_end_date: PROGRAM_END,
    apply_opens_at: '2025-09-01T00:00:00+09:00',
    apply_closes_at: '2025-09-23T23:59:00+09:00',
    price_krw: 45000,
    max_male: 30,
    max_female: 30,
  })
  .select('*')
  .single();
if (cohortErr) { console.error(cohortErr); process.exit(1); }
console.log('created test cohort', cohort.id);

// ---- Insert apps + match responses ----------------------------------------
let inserted = 0;
let skippedGender = 0;

for (let i = 0; i < data.length; i++) {
  const r = data[i];
  const name = col(r, '이름');
  const genderRaw = col(r, '성별');
  const gender = mapGender(genderRaw);
  if (!gender) { skippedGender++; continue; }

  const birthYearRaw = col(r, '나이 (년생)');
  const birthYear = parseInt(birthYearRaw.match(/\d{4}/)?.[0] || '1995', 10);

  const phone = `010-0000-${String(1000 + i).padStart(4, '0')}`;
  const applicationId = crypto.randomUUID();

  // App row
  const { error: appErr } = await sb.from('applications').insert({
    id: applicationId,
    cohort_id: cohort.id,
    name,
    phone,
    gender,
    birth_year: birthYear,
    occupation: col(r, '직업') || '미기재',
    region: '서울',
    call_times: [],
    mbti: null,
    previous_cohort: false,
    motivation: '[테스트 임포트]',
    source: '과거 기수',
    voice_file_url: null,
    photo_file_url: null,
    agreed_at: new Date().toISOString(),
    status: 'approved',
  });
  if (appErr) { console.error(`  ${name}: app ${appErr.message}`); continue; }

  // Time cells
  const wdCell = col(r, '통화 가능 시간 (중복선택 가능) [평일]') ||
                 col(r, '통화 가능 시간 (중복선택 가능)\n [평일]') ||
                 col(r, '평일');
  const weCell = col(r, '통화 가능 시간 (중복선택 가능) [주말]') ||
                 col(r, '통화 가능 시간 (중복선택 가능)\n [주말]') ||
                 col(r, '주말');
  const slots = buildAvailableSlots(wdCell, weCell);

  // Response row
  const { error: respErr } = await sb.from('match_responses').insert({
    application_id: applicationId,
    cohort_id: cohort.id,
    nickname: col(r, '새로운 닉네임 (문토 닉네임과 반드시 달라야 합니다!)') || col(r, '전화 닉네임(통화때 쓸 닉네임)') || name,
    munto_nickname: col(r, '문토 닉네임') || null,
    region: '서울',
    mbti: null,
    match_gender: mapMatchGender(col(r, '매칭 희망 성별')),
    phone_type: mapPhoneType(col(r, '휴대폰 타입')),
    conv_style_self: col(r, '저는 대화할 때 이런 사람 같아요!') || null,
    conv_with_strangers: col(r, '낯선이와 함께할 때 저는 이래요!') || null,
    conv_attraction: col(r, '남들에게 칭찬받는 대화할때의 나의 매력 포인트?') || null,
    ideal_important: col(r, '사람을 볼 때 당신이 가장 중요하게 보는 것은?') || null,
    ideal_soulmate_must: col(r, '소울메이트라면 이건 맞아야지!') || null,
    ideal_relationship: col(r, '나의 전화 메이트와 이런 관계를 기대하고 있어요!') || null,
    ideal_partner_q: col(r, '이번 커넥팅 기간 동안 내 파트너에게 꼭 하고 싶은 질문 한가지?') || null,
    day1_soulfood: col(r, '나를 위로하는 최애 음식! 소울푸드는? (Day 1)') || null,
    day2_hobby: col(r, '나의 소소한 취미는? (Day 2)') || null,
    day3_place: col(r, '내가 가장 좋아하는 장소가 있다면? (Day 3)') || null,
    day4_together: col(r, '소울메이트와 이것만은 꼭 같이 하고 싶어요! (Day 4)') || null,
    day5_secret_mission: col(r, '(개인 미션) 전화메이트에게 수행할 당신의 비밀 미션 (Day 5)') || null,
    available_slots: slots,
    gathering_dates: [],
    kakao_openchat_url: col(r, '일대일 오픈채팅방 링크 입력 (남성 참가자만)') || null,
    marketing_agreed: false,
  });
  if (respErr) { console.error(`  ${name}: resp ${respErr.message}`); continue; }

  inserted++;
  if (inserted <= 5 || inserted % 10 === 0) {
    console.log(`  ${inserted.toString().padStart(2)}  ${name}  ${gender}  ${birthYear}  slots=${slots.length}`);
  }
}

console.log(`\n✓ done — inserted ${inserted}, skipped (unmapped gender) ${skippedGender}`);
console.log(`  cohort id: ${cohort.id}`);
console.log(`  slug: ${cohortSlug}`);
console.log(`\nNext: 어드민 /matching 에서 cohort 선택 후 "매칭 실행" 누르거나, 아래 명령으로 직접:`);
console.log(`  curl -X POST http://localhost:3001/api/matching/run -H "content-type: application/json" -d '{"cohortId":"${cohort.id}","round":"both"}'`);
