import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = JSON.parse(sessionCookie.value);

    const res = await backendFetch('/api/v1/regions', session.token);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  }
}
