import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = JSON.parse(sessionCookie.value);

    // patient_id is the patient profile ID; fall back to user id if not set
    const patientId = session.patient_id ?? session.id;

    const body = await request.json();
    const res = await backendFetch(
      `/api/v1/patients/${patientId}/self-assessments`,
      session.token,
      { method: 'POST', body: JSON.stringify(body) },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
}
