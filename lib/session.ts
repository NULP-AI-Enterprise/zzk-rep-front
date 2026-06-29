import { cookies } from 'next/headers';

export type Session = {
  role: 'DOCTOR' | 'PATIENT' | 'MODERATOR' | 'ADMIN';
  id: number;
  token: string;
  region_id: number | null;
  patient_id: number | null;
  diagnosis: 'UC' | 'CD' | 'UNCLASSIFIED' | null;
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const c = cookieStore.get('session');
  if (!c) return null;
  try {
    const s = JSON.parse(c.value);
    if (!s?.token || !s?.role) return null;
    return s as Session;
  } catch {
    return null;
  }
}
