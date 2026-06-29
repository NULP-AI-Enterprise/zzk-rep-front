import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { pro2Severity } from '@/lib/pro2';

type PatientListItem = {
  id: number; initials: string; diagnosis: string; status: string; birth_year: number;
};
type LatestAssessment = {
  pro2_score: number | null; assessment_type: 'CD' | 'UC'; created_at: string;
} | null;

const diagnosisLabel: Record<string, string> = {
  UC: 'ВК', CD: 'ХК', UNCLASSIFIED: 'ЗЗК-н',
};
const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Очікує',       cls: 'bg-yellow-50 text-yellow-700' },
  ATTACHED: { label: 'Активний',     cls: 'bg-green-50 text-green-700'   },
  DETACHED: { label: 'Відкріплений', cls: 'bg-gray-100 text-gray-600'    },
};

export default async function DoctorDashboard() {
  const session = await getSession();
  if (!session) redirect('/login');

  const res = await backendFetch('/api/v1/patients', session.token);
  if (res.status === 401) redirect('/login');
  const raw = await res.json().catch(() => []);
  const patients: PatientListItem[] = Array.isArray(raw) ? raw : (raw.items ?? raw.data ?? raw.results ?? []);

  // Fetch latest assessment for each patient in parallel
  const latestScores = await Promise.all(
    patients.map(p =>
      backendFetch(`/api/v1/patients/${p.id}/self-assessments/latest`, session.token)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null) as Promise<LatestAssessment>
    )
  );

  const criticalCount = latestScores.filter(a =>
    a?.pro2_score != null && pro2Severity(a.pro2_score, a.assessment_type).label === 'Тяжка'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Мої пацієнти</h1>
          {criticalCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
              ⚠ {criticalCount} критичних
            </span>
          )}
        </div>
        <Link href="/doctor/patients/new"
          className="bg-brand text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-light transition-colors">
          + Новий пацієнт
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-4 md:px-6 py-4 font-medium">Пацієнт</th>
              <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Діагноз</th>
              <th className="px-4 md:px-6 py-4 font-medium hidden md:table-cell">Рік нар.</th>
              <th className="px-4 md:px-6 py-4 font-medium">Статус</th>
              <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">PRO2</th>
              <th className="px-4 md:px-6 py-4 font-medium">Дія</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map((p, i) => {
              const s = statusMap[p.status] ?? { label: p.status, cls: 'bg-gray-100 text-gray-600' };
              const latest = latestScores[i];
              const sev = latest?.pro2_score != null
                ? pro2Severity(latest.pro2_score, latest.assessment_type)
                : null;
              return (
                <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${sev?.label === 'Тяжка' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 md:px-6 py-4 font-medium">
                    <div className="flex items-center gap-2">
                      {p.initials}
                      {sev?.label === 'Тяжка' && <span className="text-red-500 text-xs">⚠</span>}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 hidden sm:table-cell">{diagnosisLabel[p.diagnosis] ?? p.diagnosis}</td>
                  <td className="px-4 md:px-6 py-4 text-gray-500 hidden md:table-cell">{p.birth_year}</td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    {sev && latest?.pro2_score != null ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sev.bg} ${sev.text}`}>
                        {latest.pro2_score} · <span className="hidden sm:inline">{sev.label}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <Link href={`/doctor/patients/${p.id}`} className="text-brand hover:underline font-medium">
                      Деталі
                    </Link>
                  </td>
                </tr>
              );
            })}
            {patients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  У вас поки немає зареєстрованих пацієнтів.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
