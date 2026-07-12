import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    const res = await fetch(`${BACKEND}/api/v1/auth/confirm-email-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const text = await res.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch {
      return NextResponse.json({ error: `Backend error (${res.status})` }, { status: res.status });
    }

    if (!res.ok) {
      return NextResponse.json({ error: (data as { detail?: string })?.detail ?? 'Invalid token' }, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}
