import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

// Public (the self-registration form needs it before login)
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/v1/regions`, { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Не вдалося завантажити регіони' }, { status: res.ok ? 502 : res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Не вдалося завантажити регіони' }, { status: 502 });
  }
}
