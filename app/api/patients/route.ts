import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = JSON.parse(sessionCookie.value);

    const body = await request.json();
    if (session.role === 'DOCTOR' && !body.doctor_id) {
      body.doctor_id = session.id;
    }

    const res = await backendFetch('/api/v1/patients', session.token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log('[patients POST] status', res.status, text);
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[patients POST] error', err);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
