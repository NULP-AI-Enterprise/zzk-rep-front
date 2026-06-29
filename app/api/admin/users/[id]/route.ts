import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api';

async function getToken() {
  const cookieStore = await cookies();
  const c = cookieStore.get('session');
  if (!c) return null;
  try { return JSON.parse(c.value).token as string; } catch { return null; }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const res = await backendFetch(`/api/v1/users/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const res = await backendFetch(`/api/v1/users/${id}`, token, { method: 'DELETE' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
