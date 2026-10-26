import { cookies } from 'next/headers';

export type Session = {
  role: 'DOCTOR' | 'PATIENT' | 'MODERATOR' | 'ADMIN';
  id: number;
  token: string;
  region_id: number | null;
  patient_id: number | null;
  diagnosis: 'UC' | 'CD' | 'UNCLASSIFIED' | null;
};

/** The backend JWT lives shorter than the cookie — treat an expired token as "not logged in". */
function isExpired(jwt: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf-8'));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const c = cookieStore.get('session');
  if (!c) return null;
  try {
    const s = JSON.parse(c.value);
    if (!s?.token || !s?.role || isExpired(s.token)) return null;
    return s as Session;
  } catch {
    return null;
  }
}
