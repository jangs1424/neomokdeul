import { NextResponse } from 'next/server';
import { getCohort, createCohort } from '@neomokdeul/db';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const original = await getCohort(id);
    if (!original) {
      return NextResponse.json({ error: '기수를 찾을 수 없습니다.' }, { status: 404 });
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    function addDays(base: string, days: number): string {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    }

    const newCohort = await createCohort({
      slug: original.slug + '-copy-' + Date.now(),
      name: original.name + ' (복사본)',
      description: original.description,
      status: 'draft',
      programStartDate: addDays(today, 30),
      programEndDate: addDays(today, 38),
      applyOpensAt: new Date(today).toISOString(),
      applyClosesAt: new Date(addDays(today, 25)).toISOString(),
      priceKrw: original.priceKrw,
      maxMale: original.maxMale,
      maxFemale: original.maxFemale,
      latpeedPaymentUrl: original.latpeedPaymentUrl,
      heroTitle: original.heroTitle,
      heroSubtitle: original.heroSubtitle,
      heroImageUrl: original.heroImageUrl,
      specialFeatures: original.specialFeatures,
      approvedSmsTemplate: original.approvedSmsTemplate,
      applyIntroText: original.applyIntroText,
      voiceIntroHelp: original.voiceIntroHelp,
      photoHelp: original.photoHelp,
      motivationPrompt: original.motivationPrompt,
    });

    return NextResponse.json({ id: newCohort.id }, { status: 201 });
  } catch (err) {
    console.error('[cohorts clone POST]', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
