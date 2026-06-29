import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatusAction from '@/components/StatusAction';

type RegionOut = { id: number; name: string };
type UserOut   = { id: number; first_name: string; last_name: string };
type PatientListItem = {
  id: number;
  initials: string;
  diagnosis: string;
  status: string;
  birth_year: number;
  sex: string;
  doctor: UserOut | null;
  region: RegionOut | null;
};

const diagnosisLabel: Record<string, string> = {
  UC: 'ВК', CD: 'ХК', UNCLASSIFIED: 'ЗЗК-н',
};
const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Очікує',       cls: 'bg-yellow-50 text-yellow-700' },
  ATTACHED: { label: 'Активний',     cls: 'bg-green-50 text-green-700'  },
  DETACHED: { label: 'Відкріплений', cls: 'bg-gray-100 text-gray-600'   },
};

export default async function AdminPatients() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const res = await backendFetch('/api/v1/patients', session.token);
  if (res.status === 401) redirect('/login');
  const patients: PatientListItem[] = await res.json().catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Всі пацієнти</h1>
        <span className="text-sm text-gray-500">{patients.length} записів</span>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-5 py-4 font-medium">Пацієнт</th>
              <th className="px-5 py-4 font-medium hidden md:table-cell">Стать</th>
              <th className="px-5 py-4 font-medium">Діагноз</th>
              <th className="px-5 py-4 font-medium hidden md:table-cell">Рік нар.</th>
              <th className="px-5 py-4 font-medium">Статус</th>
              <th className="px-5 py-4 font-medium hidden lg:table-cell">Лікар</th>
              <th className="px-5 py-4 font-medium hidden lg:table-cell">Регіон</th>
              <th className="px-5 py-4 font-medium">Деталі</th>
              <th className="px-5 py-4 font-medium">Дія</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map(p => {
              const s = statusMap[p.status] ?? { label: p.status, cls: 'bg-gray-100 text-gray-600' };
              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium">{p.initials}</td>
                  <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{p.sex === 'M' ? 'Ч' : 'Ж'}</td>
                  <td className="px-5 py-4">{diagnosisLabel[p.diagnosis] ?? p.diagnosis}</td>
                  <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{p.birth_year}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">
                    {p.doctor ? `${p.doctor.last_name} ${p.doctor.first_name[0]}.` : '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">{p.region?.name ?? '—'}</td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/patients/${p.id}`} className="text-brand hover:underline font-medium text-sm">
                      Деталі
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    {p.status === 'PENDING' && <StatusAction patientId={p.id} />}
                  </td>
                </tr>
              );
            })}
            {patients.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-gray-500">
                  Пацієнтів не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
