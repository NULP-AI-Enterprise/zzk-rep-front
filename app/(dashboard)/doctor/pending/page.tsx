import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatusAction from '@/components/StatusAction';

type PatientListItem = {
  id: number;
  initials: string;
  diagnosis: string;
  created_at: string;
  region: { id: number; name: string } | null;
};

const diagnosisLabel: Record<string, string> = {
  UC: 'Виразковий коліт (ВК)',
  CD: 'Хвороба Крона (ХК)',
  UNCLASSIFIED: 'ЗЗК-некласифіковане',
};

export default async function DoctorPending() {
  const session = await getSession();
  if (!session) redirect('/login');

  const res = await backendFetch('/api/v1/patients/pending', session.token);
  if (res.status === 401) redirect('/login');
  const raw = await res.json().catch(() => []);
  const pending: PatientListItem[] = Array.isArray(raw) ? raw : (raw.items ?? raw.data ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Очікують дії</h1>
          <p className="text-gray-500 text-sm mt-1">Пацієнти зі статусом PENDING, що потребують прикріплення.</p>
        </div>
        {pending.length > 0 && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700">
            {pending.length} очікують
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 text-center text-gray-500">
          Немає пацієнтів, що очікують.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-4 md:px-6 py-4 font-medium">Пацієнт</th>
                <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Діагноз</th>
                <th className="px-4 md:px-6 py-4 font-medium hidden md:table-cell">Регіон</th>
                <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Дата реєстрації</th>
                <th className="px-4 md:px-6 py-4 font-medium">Картка</th>
                <th className="px-4 md:px-6 py-4 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map(p => (
                <tr key={p.id} className="hover:bg-yellow-50/30 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-medium">{p.initials}</td>
                  <td className="px-4 md:px-6 py-4 hidden sm:table-cell text-gray-600">
                    {diagnosisLabel[p.diagnosis] ?? p.diagnosis}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-gray-500 hidden md:table-cell">
                    {p.region?.name ?? '—'}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-gray-500 hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <Link href={`/doctor/patients/${p.id}`}
                      className="text-brand hover:underline font-medium text-sm">
                      Деталі
                    </Link>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <StatusAction patientId={p.id} currentStatus="PENDING" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
