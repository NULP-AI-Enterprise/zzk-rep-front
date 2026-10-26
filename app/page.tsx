import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (session.role === 'ADMIN') redirect('/admin');
  if (session.role === 'DOCTOR') redirect('/doctor');
  if (session.role === 'MODERATOR') redirect('/moderator');
  redirect('/patient');
}
