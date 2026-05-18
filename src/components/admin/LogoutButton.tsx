'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  return (
    <button onClick={handleLogout} className="text-xs text-text-tertiary hover:text-text-secondary">
      Logout
    </button>
  );
}
