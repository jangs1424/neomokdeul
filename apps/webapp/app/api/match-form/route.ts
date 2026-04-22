import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/token';
import {
  getApplication,
  getCohort,
  upsertMatchResponse,
  type MatchResponseInput,
} from '@neomokdeul/db';

export const dynamic = 'force-dynamic';

const VALID_MATCH_GENDER = new Set(['opposite', 'same', 'any']);
const VALID_PHONE_TYPE = new Set(['iphone', 'galaxy', 'other']);
const SLOT_RE = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/;

function optString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function reqString(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function enumerateDates(startStr: string, endStr: string): Set<string> {
  const out = new Set<string>();
  const [sy, sm, sd] = startStr.split('-').map((x) => parseInt(x, 10));
  const [ey, em, ed] = endStr.split('-').map((x) => parseInt(x, 10));
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    out.add(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
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

    // Resolve application & cohort from token
    const [application, cohort] = await Promise.all([
      getApplication(payload.appId),
      getCohort(payload.cohortId),
    ]);
    if (!application) {
      return NextResponse.json(
        { ok: false, error: '신청 정보를 찾을 수 없어요.' },
        { status: 400 },
      );
    }
    if (!cohort) {
      return NextResponse.json(
        { ok: false, error: '회차 정보를 찾을 수 없어요.' },
        { status: 400 },
      );
    }

    // Deadline check
    if (cohort.matchFormClosesAt) {
      const dl = new Date(cohort.matchFormClosesAt).getTime();
      if (Number.isFinite(dl) && Date.now() > dl) {
        return NextResponse.json(
          { ok: false, error: '수정 마감 시각이 지나 더 이상 저장할 수 없어요.' },
          { status: 403 },
        );
      }
    }

    // matchGender
    const matchGenderRaw = typeof body.matchGender === 'string' ? body.matchGender : '';
    if (!VALID_MATCH_GENDER.has(matchGenderRaw)) {
      return NextResponse.json(
        { ok: false, error: '매칭 희망 성별을 선택해 주세요.' },
        { status: 400 },
      );
    }
    const matchGender = matchGenderRaw as MatchResponseInput['matchGender'];

    // phoneType
    const phoneTypeRaw = typeof body.phoneType === 'string' ? body.phoneType : '';
    if (!VALID_PHONE_TYPE.has(phoneTypeRaw)) {
      return NextResponse.json(
        { ok: false, error: '휴대폰 타입을 선택해 주세요.' },
        { status: 400 },
      );
    }
    const phoneType = phoneTypeRaw as MatchResponseInput['phoneType'];

    // nickname (required, 2-12)
    const nickname = reqString(body.nickname);
    if (!nickname || nickname.length < 2 || nickname.length > 12) {
      return NextResponse.json(
        { ok: false, error: '새로운 닉네임은 2~12자로 입력해 주세요.' },
        { status: 400 },
      );
    }

    const muntoNickname = optString(body.muntoNickname);
    if (muntoNickname && muntoNickname === nickname) {
      return NextResponse.json(
        { ok: false, error: '새로운 닉네임은 문토 닉네임과 달라야 해요.' },
        { status: 400 },
      );
    }

    // 7 open-text fields required
    const openTextMap: Record<string, string> = {
      convStyleSelf: '저는 대화할 때 이런 사람 같아요!',
      convWithStrangers: '낯선이와 함께할 때 저는 이래요!',
      convAttraction: '남들에게 칭찬받는 대화 매력 포인트',
      idealImportant: '사람을 볼 때 가장 중요하게 보는 것',
      idealSoulmateMust: '소울메이트라면 이건 맞아야지',
      idealRelationship: '기대하는 관계',
      idealPartnerQ: '파트너에게 하고 싶은 질문',
    };
    const openTexts: Record<string, string> = {};
    for (const [key, label] of Object.entries(openTextMap)) {
      const v = reqString(body[key]);
      if (!v) {
        return NextResponse.json(
          { ok: false, error: `"${label}" 항목을 작성해 주세요.` },
          { status: 400 },
        );
      }
      openTexts[key] = v;
    }

    // Day answers (optional)
    const day1Soulfood = optString(body.day1Soulfood);
    const day2Hobby = optString(body.day2Hobby);
    const day3Place = optString(body.day3Place);
    const day4Together = optString(body.day4Together);
    const day5SecretMission = optString(body.day5SecretMission);

    // availableSlots — array of "YYYY-MM-DD_HH-HH", min 2
    const rawSlots = body.availableSlots;
    if (!Array.isArray(rawSlots) || rawSlots.length < 2) {
      return NextResponse.json(
        { ok: false, error: '통화 가능 시간은 최소 2개 이상 선택해 주세요.' },
        { status: 400 },
      );
    }
    const programDates = enumerateDates(cohort.programStartDate, cohort.programEndDate);
    const availableSlots: string[] = [];
    const seenSlots = new Set<string>();
    for (const s of rawSlots) {
      if (typeof s !== 'string' || !SLOT_RE.test(s)) {
        return NextResponse.json(
          { ok: false, error: '통화 슬롯 형식이 올바르지 않아요.' },
          { status: 400 },
        );
      }
      const datePart = s.split('_')[0];
      if (!programDates.has(datePart)) {
        return NextResponse.json(
          { ok: false, error: '프로그램 기간 밖의 날짜가 포함됐어요.' },
          { status: 400 },
        );
      }
      if (!seenSlots.has(s)) {
        seenSlots.add(s);
        availableSlots.push(s);
      }
    }

    // gatheringDates — optional, must be within program
    const rawGathering = body.gatheringDates;
    const gatheringDates: string[] = [];
    if (Array.isArray(rawGathering)) {
      const seen = new Set<string>();
      for (const d of rawGathering) {
        if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
        if (!programDates.has(d)) continue;
        if (seen.has(d)) continue;
        seen.add(d);
        gatheringDates.push(d);
      }
    }

    // marketingAgreed
    const marketingAgreed = body.marketingAgreed === true;

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
      muntoNickname,
      region: application.region,
      mbti: application.mbti,
      matchGender,
      phoneType,
      convStyleSelf: openTexts.convStyleSelf,
      convWithStrangers: openTexts.convWithStrangers,
      convAttraction: openTexts.convAttraction,
      idealImportant: openTexts.idealImportant,
      idealSoulmateMust: openTexts.idealSoulmateMust,
      idealRelationship: openTexts.idealRelationship,
      idealPartnerQ: openTexts.idealPartnerQ,
      day1Soulfood,
      day2Hobby,
      day3Place,
      day4Together,
      day5SecretMission,
      availableSlots,
      gatheringDates,
      kakaoOpenchatUrl,
      marketingAgreed,
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
