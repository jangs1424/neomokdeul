import { NextResponse } from 'next/server';
import { getCohort, updateCohort, type CohortStatus } from '@neomokdeul/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check cohort exists
    const existing = await getCohort(id);
    if (!existing) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 });
    }

    const body = await req.json();

    // Build partial patch — only include fields present in body
    const patch: Parameters<typeof updateCohort>[1] = {};

    if (body.slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(body.slug)) {
        return NextResponse.json({ error: 'slug은 소문자/숫자/하이픈만' }, { status: 400 });
      }
      patch.slug = String(body.slug);
    }
    if (body.name !== undefined) patch.name = String(body.name);
    if (body.description !== undefined) patch.description = body.description ? String(body.description) : undefined;
    if (body.status !== undefined) {
      if (!['draft', 'recruiting', 'closed', 'running', 'completed'].includes(body.status)) {
        return NextResponse.json({ error: 'status invalid' }, { status: 400 });
      }
      patch.status = body.status as CohortStatus;
    }
    if (body.programStartDate !== undefined) patch.programStartDate = String(body.programStartDate);
    if (body.programEndDate !== undefined) patch.programEndDate = String(body.programEndDate);
    if (body.applyOpensAt !== undefined) patch.applyOpensAt = String(body.applyOpensAt);
    if (body.applyClosesAt !== undefined) patch.applyClosesAt = String(body.applyClosesAt);
    if (body.priceKrw !== undefined) patch.priceKrw = Number(body.priceKrw);
    if (body.maxMale !== undefined) patch.maxMale = Number(body.maxMale);
    if (body.maxFemale !== undefined) patch.maxFemale = Number(body.maxFemale);
    if (body.latpeedPaymentUrl !== undefined) patch.latpeedPaymentUrl = body.latpeedPaymentUrl || undefined;
    if (body.heroTitle !== undefined) patch.heroTitle = body.heroTitle || undefined;
    if (body.heroSubtitle !== undefined) patch.heroSubtitle = body.heroSubtitle || undefined;
    if (body.heroImageUrl !== undefined) patch.heroImageUrl = body.heroImageUrl || undefined;
    if (body.specialFeatures !== undefined) {
      patch.specialFeatures = Array.isArray(body.specialFeatures) ? body.specialFeatures : [];
    }
    if (body.approvedSmsTemplate !== undefined) patch.approvedSmsTemplate = body.approvedSmsTemplate || undefined;
    if (body.applyIntroText !== undefined) patch.applyIntroText = body.applyIntroText || undefined;
    if (body.voiceIntroHelp !== undefined) patch.voiceIntroHelp = body.voiceIntroHelp || undefined;
    if (body.photoHelp !== undefined) patch.photoHelp = body.photoHelp || undefined;
    if (body.motivationPrompt !== undefined) patch.motivationPrompt = body.motivationPrompt || undefined;
    if (body.matchFormClosesAt !== undefined) patch.matchFormClosesAt = body.matchFormClosesAt || undefined;
    if (body.matchDay1Prompt !== undefined) patch.matchDay1Prompt = body.matchDay1Prompt || undefined;
    if (body.matchDay2Prompt !== undefined) patch.matchDay2Prompt = body.matchDay2Prompt || undefined;
    if (body.matchDay3Prompt !== undefined) patch.matchDay3Prompt = body.matchDay3Prompt || undefined;
    if (body.matchDay4Prompt !== undefined) patch.matchDay4Prompt = body.matchDay4Prompt || undefined;
    if (body.matchDay5Prompt !== undefined) patch.matchDay5Prompt = body.matchDay5Prompt || undefined;

    const updated = await updateCohort(id, patch);
    if (!updated) {
      return NextResponse.json({ error: '업데이트 실패' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, cohort: updated }, { status: 200 });
  } catch (err) {
    console.error('[cohorts PATCH]', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
