import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import { Users, Activity, ShieldCheck, Clock } from 'lucide-react';

type PatientListItem = { diagnosis: string; status: string };
type UserOut = { role: string };

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const [patientsRes, usersRes] = await Promise.all([
    backendFetch('/api/v1/patients', session.token),
    backendFetch('/api/v1/users', session.token),
  ]);
  if (patientsRes.status === 401 || usersRes.status === 401) redirect('/login');

  const patients: PatientListItem[] = await patientsRes.json().catch(() => []);
  const users: UserOut[] = await usersRes.json().catch(() => []);

  const ucCount    = patients.filter(p => p.diagnosis === 'UC').length;
  const cdCount    = patients.filter(p => p.diagnosis === 'CD').length;
  const pending    = patients.filter(p => p.status === 'PENDING').length;
  const attached   = patients.filter(p => p.status === 'ATTACHED').length;
  const doctorCount= users.filter(u => u.role === 'DOCTOR').length;
  const modCount   = users.filter(u => u.role === 'MODERATOR').length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Адмін-панель</h1>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Пацієнти</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users size={28} />} iconCls="bg-blue-50 text-blue-500"
            label="Виразковий коліт" value={ucCount} />
          <StatCard icon={<Activity size={28} />} iconCls="bg-orange-50 text-orange-500"
            label="Хвороба Крона" value={cdCount} />
          <StatCard icon={<Clock size={28} />} iconCls="bg-yellow-50 text-yellow-600"
            label="Очікують" value={pending} />
          <StatCard icon={<Users size={28} />} iconCls="bg-green-50 text-green-600"
            label="Активних" value={attached} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Користувачі</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard icon={<ShieldCheck size={28} />} iconCls="bg-brand/10 text-brand"
            label="Лікарів" value={doctorCount} />
          <StatCard icon={<ShieldCheck size={28} />} iconCls="bg-purple-50 text-purple-500"
            label="Модераторів" value={modCount} />
          <StatCard icon={<Users size={28} />} iconCls="bg-gray-50 text-gray-500"
            label="Всього пацієнтів" value={patients.length} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, iconCls, label, value }: {
  icon: React.ReactNode; iconCls: string; label: string; value: number;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconCls}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
