import React from 'react';
import { requireRole, AuthError } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole('ADMIN');
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 403) {
        redirect('/forbidden');
      }
      if (error.statusCode === 401) {
        redirect('/admin/login');
      }
    }
    // For 401 or any other session error, redirect to login
    redirect('/admin/login');
  }

  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}
