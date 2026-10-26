import { NextResponse } from 'next/server';
import { formatDetail } from '@/lib/format';

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
    if (!res.ok) {
      const detail = (body as { detail?: unknown } | null)?.detail;
      return NextResponse.json(
        { error: formatDetail(detail, 'Не вдалося надіслати посилання') },
        { status: res.status },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Network error' }, { status: 502 });
  }
}
