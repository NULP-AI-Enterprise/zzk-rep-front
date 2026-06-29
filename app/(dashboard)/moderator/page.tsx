import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import { Activity, Users } from 'lucide-react';

type PatientListItem = { diagnosis: string };

export default async function ModeratorDashboard() {
  const session = await getSession();
  if (!session) redirect('/login');

  const res = await backendFetch('/api/v1/patients', session.token);
  if (res.status === 401) redirect('/login');
  const raw = await res.json().catch(() => []);
  const patients: PatientListItem[] = Array.isArray(raw) ? raw : (raw.items ?? raw.data ?? raw.results ?? []);

  const ucCount = patients.filter(p => p.diagnosis === 'UC').length;
  const cdCount = patients.filter(p => p.diagnosis === 'CD').length;
  const total = patients.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Глобальна статистика</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Users size={32} />}
          iconCls="bg-blue-50 text-blue-500"
          label="Виразковий коліт (ВК)"
          value={ucCount}
        />
        <StatCard
          icon={<Activity size={32} />}
          iconCls="bg-orange-50 text-orange-500"
          label="Хвороба Крона (ХК)"
          value={cdCount}
        />
        <StatCard
          icon={<Users size={32} />}
          iconCls="bg-brand/10 text-brand"
          label="Всього пацієнтів"
          value={total}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconCls,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconCls: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-4">
      <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${iconCls}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
