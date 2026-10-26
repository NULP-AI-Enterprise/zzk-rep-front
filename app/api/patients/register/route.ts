import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

// Public patient self-registration (no session)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/api/v1/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: 'Сервер недоступний. Спробуйте пізніше' }, { status: 502 });
  }
}
