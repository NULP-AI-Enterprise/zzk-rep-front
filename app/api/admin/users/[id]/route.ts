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
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await backendFetch(`/api/v1/users/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log('[admin/users PATCH]', id, res.status, text.slice(0, 200));
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/users PATCH]', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const res = await backendFetch(`/api/v1/users/${id}`, token, { method: 'DELETE' });
    // 204 No Content — no body to parse
    if (res.status === 204) return NextResponse.json({ success: true }, { status: 200 });
    const text = await res.text();
    console.log('[admin/users DELETE]', id, res.status, text.slice(0, 200));
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/users DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
