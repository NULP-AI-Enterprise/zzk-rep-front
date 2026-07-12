import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await backendFetch(`/api/v1/users/${session.id}`, session.token);
    if (!res.ok) {
      return NextResponse.json({ error: 'Не вдалося завантажити профіль' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      role: data.role,
      region: data.region?.name ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Помилка сервера' }, { status: 500 });
  }
}
