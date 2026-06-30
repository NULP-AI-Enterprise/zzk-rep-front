import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserActions from '@/components/UserActions';

type RegionOut = { id: number; name: string };
type UserOut = {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  region: RegionOut | null;
  job_position: string | null;
  job_place: string | null;
  created_at: string;
};

const roleLabel: Record<string, { label: string; cls: string }> = {
  ADMIN:     { label: 'Адмін',     cls: 'bg-red-50 text-red-600'      },
  MODERATOR: { label: 'Модератор', cls: 'bg-purple-50 text-purple-600' },
  DOCTOR:    { label: 'Лікар',     cls: 'bg-blue-50 text-blue-600'    },
  PATIENT:   { label: 'Пацієнт',  cls: 'bg-gray-100 text-gray-600'   },
};

export default async function AdminUsers() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const res = await backendFetch('/api/v1/users', session.token);
  if (res.status === 401) redirect('/login');
  const raw = await res.json().catch(() => []);
  const users: UserOut[] = Array.isArray(raw) ? raw : (raw.items ?? raw.data ?? raw.results ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Користувачі</h1>
        <Link href="/admin/users/new"
          className="bg-brand text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-light transition-colors">
          + Новий користувач
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
            <tr>
              <th className="px-5 py-4 font-medium">ПІБ</th>
              <th className="px-5 py-4 font-medium hidden sm:table-cell">Email</th>
              <th className="px-5 py-4 font-medium">Роль</th>
              <th className="px-5 py-4 font-medium hidden md:table-cell">Регіон</th>
              <th className="px-5 py-4 font-medium hidden lg:table-cell">Посада</th>
              <th className="px-5 py-4 font-medium hidden lg:table-cell">Доданий</th>
              <th className="px-5 py-4 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => {
              const r = roleLabel[u.role] ?? { label: u.role, cls: 'bg-gray-100 text-gray-600' };
              const fullName = [u.last_name, u.first_name, u.patronymic].filter(Boolean).join(' ');
              return (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium">{fullName}</td>
                  <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.cls}`}>
                      {r.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 hidden md:table-cell">{u.region?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">{u.job_position ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500 hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-5 py-4">
                    <UserActions user={u} />
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                  Користувачів не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
