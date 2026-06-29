import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity } from 'lucide-react';

type SelfAssessmentOut = {
  id: number;
  created_at: string;
  assessment_type: string;
  pro2_score: number | null;
};

export default async function PatientDashboard() {
  const session = await getSession();
  if (!session) redirect('/login');

  const res = await backendFetch(
    `/api/v1/patients/${session.id}/self-assessments`,
    session.token,
  );
  if (res.status === 401) redirect('/login');
  const raw = await res.json().catch(() => []);
  console.log('[patient] assessments raw:', JSON.stringify(raw));
  const assessments: SelfAssessmentOut[] = Array.isArray(raw) ? raw : (raw.items ?? raw.data ?? raw.results ?? []);
  const latest = assessments.at(-1) ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мій кабінет</h1>

      <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Ваш стан</h2>
        <p className="text-gray-500 mb-6">
          Будь ласка, регулярно заповнюйте анкету самооцінки для моніторингу вашого стану.
        </p>
        <Link
          href="/patient/self-assessment"
          className="inline-flex items-center gap-3 bg-brand text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-light transition-colors active:scale-95"
        >
          <Activity size={20} />
          Пройти самооцінку (PRO2)
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Історія оцінок</h2>
        {latest ? (
          <div className="space-y-1">
            <p className="text-sm text-gray-500">
              Остання оцінка:{' '}
              <span className="font-medium text-gray-700">
                {new Date(latest.created_at).toLocaleDateString('uk-UA')}
              </span>
              {latest.pro2_score !== null && (
                <span className="ml-2 font-medium text-brand">PRO2: {latest.pro2_score}</span>
              )}
            </p>
            {assessments.length > 1 && (
              <p className="text-xs text-gray-400">Всього оцінок: {assessments.length}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Ви ще не проходили самооцінку.</p>
        )}
      </div>
    </div>
  );
}
