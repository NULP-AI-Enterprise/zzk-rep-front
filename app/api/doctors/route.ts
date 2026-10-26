import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';
import { formatDetail } from '@/lib/format';

// Doctors a patient can be attached to (ADMIN: all, MODERATOR: own region)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const res = await backendFetch('/api/v1/users/doctors', session.token);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json({ error: formatDetail(data?.detail, 'Не вдалося завантажити лікарів') }, { status: res.status });
    }
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json({ error: 'Не вдалося завантажити лікарів' }, { status: 502 });
  }
}
