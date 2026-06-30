import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import StatusAction from '@/components/StatusAction';

type PatientListItem = {
  id: number;
  initials: string;
  diagnosis: string;
  status: 'PENDING' | 'ATTACHED' | 'DETACHED';
  birth_year: number;
  region: { id: number; name: string } | null;
  created_at: string;
  doctor_id: number | null;
};

const diagnosisLabel: Record<string, string> = {
  UC: 'ВК', CD: 'ХК', UNCLASSIFIED: 'ЗЗК-н',
};
const statusMap: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Очікує',       cls: 'bg-yellow-50 text-yellow-700' },
  ATTACHED: { label: 'Активний',     cls: 'bg-green-50 text-green-700'   },
  DETACHED: { label: 'Відкріплений', cls: 'bg-gray-100 text-gray-600'    },
};

function parseList(raw: unknown): PatientListItem[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    for (const k of ['items', 'data', 'results']) {
      if (Array.isArray((r as Record<string, unknown>)[k])) return (r as Record<string, unknown>)[k] as PatientListItem[];
    }
  }
  return [];
}

export default async function ModeratorPatients() {
  const session = await getSession();
  if (!session || session.role !== 'MODERATOR') redirect('/login');

  const regionQ = session.region_id ? `?region_id=${session.region_id}` : '';

  // Fetch all three: pending (no doctor), all (with region filter query param)
  const [pendingRes, attachedRes] = await Promise.all([
    backendFetch(`/api/v1/patients/pending${regionQ}`, session.token),
    backendFetch(`/api/v1/patients${regionQ}`, session.token),
  ]);

  if (pendingRes.status === 401 || attachedRes.status === 401) redirect('/login');

  const pendingRaw  = await pendingRes.json().catch(() => []);
  const attachedRaw = await attachedRes.json().catch(() => []);

  const pendingList  = parseList(pendingRaw);
  const attachedList = parseList(attachedRaw);

  // For PENDING: backend may not support region_id param — filter client-side too
  const pending = session.region_id
    ? pendingList.filter(p => p.region?.id === session.region_id)
    : pendingList;

  // For ATTACHED/DETACHED: filter by patient region client-side as fallback
  const others = session.region_id
    ? attachedList.filter(p => p.status !== 'PENDING' && p.region?.id === session.region_id)
    : attachedList.filter(p => p.status !== 'PENDING');

  // Merge, deduplicate, pending first
  const seen = new Set<number>();
  const patients: PatientListItem[] = [];
  for (const p of [...pending, ...others]) {
    if (!seen.has(p.id)) { seen.add(p.id); patients.push(p); }
  }

  const pendingCount = patients.filter(p => p.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Пацієнти регіону</h1>
          <p className="text-sm text-gray-500 mt-1">Управління статусами · всі пацієнти вашого регіону</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700">
              {pendingCount} очікують
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            {patients.length} всього
          </span>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 text-center text-gray-500">
          Немає пацієнтів у вашому регіоні.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-4 md:px-6 py-4 font-medium">Пацієнт</th>
                <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Діагноз</th>
                <th className="px-4 md:px-6 py-4 font-medium hidden md:table-cell">Рік нар.</th>
                <th className="px-4 md:px-6 py-4 font-medium hidden md:table-cell">Регіон</th>
                <th className="px-4 md:px-6 py-4 font-medium">Статус</th>
                <th className="px-4 md:px-6 py-4 font-medium hidden sm:table-cell">Реєстрація</th>
                <th className="px-4 md:px-6 py-4 font-medium">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map(p => {
                const s = statusMap[p.status] ?? { label: p.status, cls: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={p.id}
                    className={`transition-colors ${p.status === 'PENDING' ? 'hover:bg-yellow-50/30' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-4 md:px-6 py-4 font-medium">{p.initials}</td>
                    <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                      {diagnosisLabel[p.diagnosis] ?? p.diagnosis}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-gray-500 hidden md:table-cell">{p.birth_year}</td>
                    <td className="px-4 md:px-6 py-4 text-gray-500 hidden md:table-cell">
                      {p.region?.name ?? '—'}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-gray-500 hidden sm:table-cell">
                      {new Date(p.created_at).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <StatusAction
                        patientId={p.id}
                        currentStatus={p.status}
                        suggestedDoctorId={p.doctor_id ?? undefined}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
