import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const res = await backendFetch(`/api/v1/patients/${id}/lab-results`, session.token);
  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : []; } catch {
    return NextResponse.json({ error: `Backend error (${res.status})` }, { status: res.status });
  }
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const res = await backendFetch(`/api/v1/patients/${id}/lab-results`, session.token, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch {
      return NextResponse.json({ error: `Backend error (${res.status})` }, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[lab-results POST]', err);
    return NextResponse.json({ error: 'Failed to add lab result' }, { status: 500 });
  }
}
