import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

const roleHome: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  MODERATOR: '/moderator',
  PATIENT: '/patient',
};

export async function POST(request: Request) {
  let token: unknown;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Невалідний запит' }, { status: 400 });
  }
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'Невалідне посилання' }, { status: 400 });
  }

  try {
    const tokenRes = await fetch(`${BACKEND}/api/v1/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const tokenBody = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok) {
      console.warn('[verify] backend rejected token, status', tokenRes.status);
      const detail = typeof tokenBody?.detail === 'string' ? tokenBody.detail : 'Невалідне або протерміноване посилання';
      return NextResponse.json({ error: detail }, { status: tokenRes.status >= 500 ? 502 : 400 });
    }
    const { access_token } = tokenBody;

    const meRes = await fetch(`${BACKEND}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!meRes.ok) {
      console.error('[verify] /auth/me failed, status', meRes.status);
      return NextResponse.json({ error: 'Посилання використано, але профіль не завантажився. Запросіть нове посилання для входу.' }, { status: 502 });
    }
    const me = await meRes.json();

    // For patients /auth/me already returns the patient profile (id = patient profile id)
    const isPatient = me.role === 'PATIENT';

    const cookieStore = await cookies();
    cookieStore.set(
      'session',
      JSON.stringify({
        role: me.role,
        id: me.id,
        token: access_token,
        region_id: me.region?.id ?? null,
        patient_id: isPatient ? me.id : null,
        diagnosis: isPatient ? (me.diagnosis ?? null) : null,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    return NextResponse.json({ success: true, role: me.role, home: roleHome[me.role] ?? '/' });
  } catch (err) {
    console.error('[verify] unexpected error', err);
    return NextResponse.json({ error: 'Сервер недоступний. Спробуйте ще раз' }, { status: 502 });
  }
}
