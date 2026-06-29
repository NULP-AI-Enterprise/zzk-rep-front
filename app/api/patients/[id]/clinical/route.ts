import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { backendFetch } from '@/lib/api';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const res = await backendFetch(`/api/v1/patients/${id}/records/clinical`, session.token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('[clinical POST]', id, res.status, text);
  const data = text ? JSON.parse(text) : {};
  return NextResponse.json(data, { status: res.status });
}
