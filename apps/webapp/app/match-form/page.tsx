import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '../../lib/token';
import {
  getApplication,
  getCohort,
  getMatchResponseByApplication,
} from '@neomokdeul/db';
import { MatchForm } from './MatchForm';

export const dynamic = 'force-dynamic';

export default async function MatchFormPage() {
  const jar = await cookies();
  const token = jar.get('socially_session')?.value;
  if (!token) redirect('/expired');

  const payload = verifyToken(token);
  if (!payload) redirect('/expired');

  const [application, cohort, existingResponse] = await Promise.all([
    getApplication(payload.appId),
    getCohort(payload.cohortId),
    getMatchResponseByApplication(payload.appId),
  ]);

  if (!application || !cohort) redirect('/expired');

  const isOpen = cohort.status === 'recruiting' || cohort.status === 'running';

  if (!isOpen) {
    return (
      <main
        style={{
          maxWidth: 480,
          margin: '0 auto',
          minHeight: '100vh',
          background: 'var(--bg)',
          padding: '80px 24px',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              color: 'var(--ink)',
              marginBottom: 12,
            }}
          >
            매칭 폼은 아직 열리지 않았어요
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--sub)',
              lineHeight: 1.6,
            }}
          >
            매칭 폼은 프로그램 시작 시 열려요. 조금만 기다려 주세요.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: 20,
              padding: '10px 20px',
              background: 'var(--forest)',
              color: '#fff',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}
    >
      <MatchForm
        application={application}
        cohort={cohort}
        existingResponse={existingResponse}
      />
    </main>
  );
}
