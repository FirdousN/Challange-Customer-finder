'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/staff/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-red-50 transition-colors"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}
