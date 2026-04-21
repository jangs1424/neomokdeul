import { NextResponse } from 'next/server';
import { createCohort, type CohortStatus } from '@neomokdeul/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Validate required
    const required = ['slug', 'name', 'status', 'programStartDate', 'programEndDate', 'applyOpensAt', 'applyClosesAt'];
    for (const k of required) {
      if (!body[k]) return NextResponse.json({ error: `필수: ${k}` }, { status: 400 });
    }
    if (!['draft', 'recruiting', 'closed', 'running', 'completed'].includes(body.status)) {
      return NextResponse.json({ error: 'status invalid' }, { status: 400 });
    }
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json({ error: 'slug은 소문자/숫자/하이픈만' }, { status: 400 });
    }

    const cohort = await createCohort({
      slug: String(body.slug),
      name: String(body.name),
      description: body.description ? String(body.description) : undefined,
      status: body.status as CohortStatus,
      programStartDate: String(body.programStartDate),
      programEndDate: String(body.programEndDate),
      applyOpensAt: String(body.applyOpensAt),
      applyClosesAt: String(body.applyClosesAt),
      priceKrw: Number(body.priceKrw ?? 45000),
      maxMale: Number(body.maxMale ?? 15),
      maxFemale: Number(body.maxFemale ?? 15),
      latpeedPaymentUrl: body.latpeedPaymentUrl || undefined,
      heroTitle: body.heroTitle || undefined,
      heroSubtitle: body.heroSubtitle || undefined,
      heroImageUrl: body.heroImageUrl || undefined,
      specialFeatures: Array.isArray(body.specialFeatures) ? body.specialFeatures : [],
    });
    return NextResponse.json({ ok: true, cohort }, { status: 201 });
  } catch (err) {
    console.error('[cohorts POST]', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
