import React from 'react';
import { requireRole } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireRole('ADMIN');
  } catch (_error) {
    // If not admin, redirect to staff login
    redirect('/staff/login');
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
