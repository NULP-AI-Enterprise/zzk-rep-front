import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const body = await request.json();
    const res = await backendFetch(`/api/v1/patients/${id}/records/cd`, session.token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.status === 204) return NextResponse.json({ success: true }, { status: 200 });
    const text = await res.text();
    console.log('[cd POST]', id, res.status);
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch {
      return NextResponse.json({ error: `Backend error (${res.status})` }, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[cd POST]', err);
    return NextResponse.json({ error: 'Failed to create CD record' }, { status: 500 });
  }
}
