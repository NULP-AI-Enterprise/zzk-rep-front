import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) redirect('/login');

  let session: { role: string };
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect('/login');
  }

  return (
    <DashboardShell role={session.role}>
      {children}
    </DashboardShell>
  );
}
