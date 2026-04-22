#!/usr/bin/env node
/**
 * Seed 20 realistic test applications with voice + photo files uploaded to
 * Supabase Storage. Idempotent-ish: only runs if fewer than 5 apps exist.
 *
 * Generates:
 *  - 10 male, 10 female
 *  - Unique 010-XXXX-XXXX phones
 *  - Random occupations, regions, MBTIs, call-time subsets, motivations
 *  - Tiny silent WAV per applicant (1s @ 8kHz mono)
 *  - Tiny 400x400 SVG with colored background + initial per applicant
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

try {
  const raw = await readFile(resolve(repoRoot, '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !svc) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, svc, { auth: { persistSession: false } });

// ---- content pools --------------------------------------------------------
const NAMES_M = ['김민준','박도윤','최지훈','정하준','강지우','조서준','장지호','신은우','황현우','송시우'];
const NAMES_F = ['이서연','정수민','최서윤','윤하은','임수아','권지아','안예은','류지원','전서윤','배하윤'];
const OCCUPATIONS = [
  'UX 디자이너','스타트업 마케터','초등학교 교사','프론트엔드 개발자','변호사',
  '약사','간호사','브랜드 기획자','광고 AE','번역가',
  '경영 컨설턴트','요리사','MD','편집 기자','치과위생사',
  'PR 매니저','대학원생','데이터 분석가','피아노 강사','물리치료사',
];
const REGIONS = ['서울','경기도','인천','부산','대구','광주','대전'];
const MBTIS = [null,'INFP','ENFP','INFJ','ENFJ','INTP','ENTP','INTJ','ENTJ','ISFP','ESFP','ISFJ','ESFJ','ISTP','ESTP','ISTJ','ESTJ'];
const CALLTIMES = [
  ['평일저녁'],['주말오전'],['주말오후'],['주말저녁'],
  ['평일저녁','주말오후'],['주말오전','주말저녁'],
  ['평일저녁','주말오전','주말오후'],['주말오전','주말오후','주말저녁'],
];
const SOURCES = ['인스타그램','지인 소개','검색','기타'];
const MOTIVATIONS = [
  '소개팅앱에 지친 상태에서 친구가 추천해줘서 왔어요. 대화가 잘 통하는 사람을 만나고 싶습니다.',
  '얼굴보다 대화 결이 맞는 사람이랑 자연스럽게 이어지고 싶어요.',
  '진지한 만남을 원하는데 주변엔 기회가 많지 않아서 신청합니다.',
  '새로운 사람을 만나는 걸 좋아하는데, 외모 중심이 아닌 만남이 궁금해서요.',
  '서른 되기 전에 의미있는 경험 하나 해보고 싶어서 용기 냈어요.',
  '목소리로 먼저 교감한다는 컨셉이 흥미로워 보여서 도전해봅니다.',
  '주변 지인들 결혼 소식 들으니 조급해져서 프로그램 찾아왔어요.',
  '일에만 몰두하느라 연애가 뒷전이었는데 이번 기수로 시작해보고 싶어요.',
  '전 기수 참여한 친구가 너무 좋았다고 추천해줬어요.',
  '외모 프리미엄 없는 매칭이 제일 공정할 것 같아서 지원합니다.',
];
const COLORS = ['#5a7a5c','#d67a63','#3f5a43','#8a6d52','#c4a772','#6b8a9c','#a85a5a','#7a5a8a','#5a8a7a','#8a8a5a'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function genSvgPhoto(name, color) {
  const initial = name[0];
  return `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${color}"/>
  <text x="200" y="245" font-family="sans-serif" font-size="180" font-weight="700" text-anchor="middle" fill="white">${initial}</text>
</svg>`;
}

function genSilentWav() {
  const sampleRate = 8000, duration = 1;
  const numSamples = sampleRate * duration;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  return buf;
}

// ---- main -----------------------------------------------------------------
const { data: cohort, error: ce } = await sb
  .from('cohorts')
  .select('id, slug, name')
  .eq('slug', 'may-2026')
  .maybeSingle();
if (ce || !cohort) {
  console.error('may-2026 cohort not found', ce);
  process.exit(1);
}
console.log(`→ seeding into cohort: ${cohort.name} (${cohort.id})`);

const { count: existingCount } = await sb
  .from('applications')
  .select('*', { count: 'exact', head: true })
  .eq('cohort_id', cohort.id);
if ((existingCount ?? 0) >= 15) {
  console.log(`⚠  already has ${existingCount} applications in this cohort — skipping to avoid double-seed. Pass --force to override.`);
  if (!process.argv.includes('--force')) process.exit(0);
}

const usedPhones = new Set();
let inserted = 0, failed = 0;

for (let i = 0; i < 20; i++) {
  const gender = i < 10 ? 'male' : 'female';
  const names = gender === 'male' ? NAMES_M : NAMES_F;
  const name = names[i % names.length];

  let phone;
  do {
    const mid4 = String(3000 + Math.floor(Math.random() * 6999)).padStart(4, '0');
    const last4 = String(1000 + Math.floor(Math.random() * 8999)).padStart(4, '0');
    phone = `010-${mid4}-${last4}`;
  } while (usedPhones.has(phone));
  usedPhones.add(phone);

  const birthYear = 1994 + Math.floor(Math.random() * 8);
  const color = COLORS[i % COLORS.length];

  try {
    // photo (svg)
    const photoPath = `${Date.now()}-${randomUUID()}.svg`;
    const svg = genSvgPhoto(name, color);
    const { error: pe } = await sb.storage.from('photos').upload(photoPath, svg, {
      contentType: 'image/svg+xml',
    });
    if (pe) throw new Error(`photo: ${pe.message}`);

    // voice (wav)
    const voicePath = `${Date.now()}-${randomUUID()}.wav`;
    const wav = genSilentWav();
    const { error: ve } = await sb.storage.from('voice-intros').upload(voicePath, wav, {
      contentType: 'audio/wav',
    });
    if (ve) throw new Error(`voice: ${ve.message}`);

    const { error: ie } = await sb.from('applications').insert({
      cohort_id: cohort.id,
      name,
      phone,
      gender,
      birth_year: birthYear,
      occupation: pick(OCCUPATIONS),
      region: pick(REGIONS),
      call_times: pick(CALLTIMES),
      mbti: pick(MBTIS),
      previous_cohort: Math.random() < 0.15,
      motivation: pick(MOTIVATIONS),
      source: pick(SOURCES),
      voice_file_url: voicePath,
      photo_file_url: photoPath,
      agreed_at: new Date().toISOString(),
    });
    if (ie) throw new Error(`insert: ${ie.message}`);

    inserted++;
    console.log(`  ${inserted.toString().padStart(2)}/20  ${name}  ${gender === 'male' ? '남' : '여'}  ${birthYear}  ${phone}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name} ${phone}: ${err.message}`);
  }
}

console.log(`\n✓ done — inserted ${inserted}, failed ${failed}`);
