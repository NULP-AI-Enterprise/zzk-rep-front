import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    console.log('[verify] → POST', `${BACKEND}/api/v1/auth/verify`);
    const tokenRes = await fetch(`${BACKEND}/api/v1/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const tokenBody = await tokenRes.json().catch(() => null);
    console.log('[verify] ← status', tokenRes.status, tokenBody);
    if (!tokenRes.ok) {
      return NextResponse.json({ error: tokenBody?.detail ?? 'Invalid or expired link' }, { status: 401 });
    }
    const { access_token } = tokenBody;

    const meRes = await fetch(`${BACKEND}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!meRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 401 });
    }
    const me = await meRes.json();

    let patient_id: number | null = null;
    let diagnosis: string | null = null;

    if (me.role === 'PATIENT') {
      const profileRes = await fetch(`${BACKEND}/api/v1/patients/my`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json().catch(() => null);
        patient_id = profile?.id ?? null;
        diagnosis = profile?.diagnosis ?? null;
      } else {
        // fallback: assume patient profile id equals user id
        patient_id = me.id;
      }
    }

    const cookieStore = await cookies();
    cookieStore.set(
      'session',
      JSON.stringify({
        role: me.role,
        id: me.id,
        token: access_token,
        region_id: me.region?.id ?? null,
        patient_id,
        diagnosis,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    return NextResponse.json({ success: true, role: me.role });
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
  }
}
