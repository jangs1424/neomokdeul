import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/token';
import {
  getApplication,
  upsertMatchResponse,
  type MatchResponseInput,
} from '@neomokdeul/db';

export const dynamic = 'force-dynamic';

const VALID_CALL_TIMES = new Set([
  '평일저녁',
  '주말오전',
  '주말오후',
  '주말저녁',
]);

const VALID_REGIONS = new Set([
  '서울',
  '경기도',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주도',
]);

const VALID_MBTI = new Set([
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]);

function isInt1to5(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;
}

function optString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const jar = await cookies();
    const token = jar.get('socially_session')?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: '로그인 세션이 없어요. 다시 로그인해 주세요.' },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: '세션이 만료됐어요. 다시 로그인해 주세요.' },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) {
      return NextResponse.json(
        { ok: false, error: '잘못된 요청이에요.' },
        { status: 400 },
      );
    }

    // nickname
    const nickname =
      typeof body.nickname === 'string' ? body.nickname.trim() : '';
    if (nickname.length < 2 || nickname.length > 12) {
      return NextResponse.json(
        { ok: false, error: '닉네임은 2~12자로 입력해 주세요.' },
        { status: 400 },
      );
    }

    // region
    const region = typeof body.region === 'string' ? body.region.trim() : '';
    if (!region || !VALID_REGIONS.has(region)) {
      return NextResponse.json(
        { ok: false, error: '거주 지역을 선택해 주세요.' },
        { status: 400 },
      );
    }

    // callTimes
    const rawCallTimes = body.callTimes;
    if (!Array.isArray(rawCallTimes) || rawCallTimes.length === 0) {
      return NextResponse.json(
        { ok: false, error: '통화 가능 시간대를 1개 이상 선택해 주세요.' },
        { status: 400 },
      );
    }
    const callTimes: string[] = [];
    for (const t of rawCallTimes) {
      if (typeof t !== 'string' || !VALID_CALL_TIMES.has(t)) {
        return NextResponse.json(
          { ok: false, error: '올바르지 않은 통화 시간대가 포함됐어요.' },
          { status: 400 },
        );
      }
      if (!callTimes.includes(t)) callTimes.push(t);
    }

    // mbti
    const mbtiRaw = optString(body.mbti);
    const mbti =
      mbtiRaw && VALID_MBTI.has(mbtiRaw.toUpperCase())
        ? mbtiRaw.toUpperCase()
        : undefined;

    // Likert fields — all required 1-5
    const likertKeys = [
      'convEnergy',
      'convThinking',
      'convPlanning',
      'convPace',
      'convDepth',
      'valuesMarriage',
      'valuesCareer',
      'valuesFamily',
      'valuesHobby',
      'valuesIndependence',
    ] as const;
    const likert: Record<(typeof likertKeys)[number], number> = {} as never;
    for (const k of likertKeys) {
      const v = body[k];
      if (!isInt1to5(v)) {
        return NextResponse.json(
          { ok: false, error: `"${k}" 값은 1~5 사이여야 해요.` },
          { status: 400 },
        );
      }
      likert[k] = v;
    }

    // Day answers (optional)
    const day2Answer = optString(body.day2Answer);
    const day3Answer = optString(body.day3Answer);
    const day4Answer = optString(body.day4Answer);
    const day5Answer = optString(body.day5Answer);
    const day6Answer = optString(body.day6Answer);
    const day7Answer = optString(body.day7Answer);

    // Resolve application & cohort from token
    const application = await getApplication(payload.appId);
    if (!application) {
      return NextResponse.json(
        { ok: false, error: '신청 정보를 찾을 수 없어요.' },
        { status: 400 },
      );
    }

    // Male: openchat URL required
    let kakaoOpenchatUrl: string | undefined;
    if (application.gender === 'male') {
      const raw = typeof body.kakaoOpenchatUrl === 'string' ? body.kakaoOpenchatUrl.trim() : '';
      if (!raw) {
        return NextResponse.json(
          { ok: false, error: '오픈채팅방 링크를 입력해 주세요.' },
          { status: 400 },
        );
      }
      if (!raw.startsWith('https://open.kakao.com/')) {
        return NextResponse.json(
          { ok: false, error: '오픈채팅방 링크는 https://open.kakao.com/ 으로 시작해야 해요.' },
          { status: 400 },
        );
      }
      kakaoOpenchatUrl = raw;
    }

    const input: MatchResponseInput = {
      applicationId: payload.appId,
      cohortId: payload.cohortId || application.cohortId,
      nickname,
      region,
      callTimes,
      mbti,
      convEnergy: likert.convEnergy,
      convThinking: likert.convThinking,
      convPlanning: likert.convPlanning,
      convPace: likert.convPace,
      convDepth: likert.convDepth,
      valuesMarriage: likert.valuesMarriage,
      valuesCareer: likert.valuesCareer,
      valuesFamily: likert.valuesFamily,
      valuesHobby: likert.valuesHobby,
      valuesIndependence: likert.valuesIndependence,
      day2Answer,
      day3Answer,
      day4Answer,
      day5Answer,
      day6Answer,
      day7Answer,
      kakaoOpenchatUrl,
    };

    const saved = await upsertMatchResponse(input);

    return NextResponse.json({
      ok: true,
      submittedAt: saved.submittedAt,
    });
  } catch (err) {
    console.error('[POST /api/match-form]', err);
    return NextResponse.json(
      { ok: false, error: '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
