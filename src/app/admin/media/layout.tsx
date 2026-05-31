import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore);
  if (!session) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
