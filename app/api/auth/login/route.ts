import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const res = await fetch(`${BACKEND}/api/v1/auth/send-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => null);
    console.log('[login] backend ←', res.status, body);
    if (!res.ok) {
      const err = body ?? {};
      return NextResponse.json(
        { error: (err as { detail?: string }).detail ?? JSON.stringify(err) ?? 'Failed to send magic link' },
        { status: res.status },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Network error' }, { status: 502 });
  }
}
