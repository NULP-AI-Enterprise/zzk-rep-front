import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api';

async function getToken() {
  const cookieStore = await cookies();
  const c = cookieStore.get('session');
  if (!c) return null;
  try { return JSON.parse(c.value).token as string; } catch { return null; }
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const res = await backendFetch('/api/v1/users', token);
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/users GET]', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const res = await backendFetch('/api/v1/users', token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log('[admin/users POST] status', res.status, text.slice(0, 200));
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin/users POST]', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
