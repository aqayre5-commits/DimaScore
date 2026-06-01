import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/admin';

async function AuthGate({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore);
  if (!session) redirect('/admin/login');
  return <>{children}</>;
}

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
