import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const c = cookieStore.get('session');
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let session: { token: string; role: string };
  try { session = JSON.parse(c.value); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const res = await backendFetch(`/api/v1/patients/${id}/status`, session.token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('[patients status PATCH]', id, res.status, text);
  const data = text ? JSON.parse(text) : {};
  return NextResponse.json(data, { status: res.status });
}
