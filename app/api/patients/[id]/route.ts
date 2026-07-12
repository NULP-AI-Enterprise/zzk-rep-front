import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const res = await backendFetch(`/api/v1/patients/${id}`, session.token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (res.status === 204) return NextResponse.json({ success: true }, { status: 200 });
    const text = await res.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch {
      return NextResponse.json({ error: `Backend error (${res.status})` }, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[patients PATCH]', err);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}
