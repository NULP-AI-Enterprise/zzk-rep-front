import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/login');
  }

  let session;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect('/login');
  }

  if (session.role === 'DOCTOR') redirect('/doctor');
if (session.role === 'MODERATOR') redirect('/moderator');
  
  redirect('/patient');
}
