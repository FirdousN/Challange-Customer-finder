import { requireAuth } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import QRScannerClient from './QRScannerClient';
import LogoutButton from './LogoutButton';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function ScannerPage() {
  let session;
  try {
    await requireAuth();
    session = await getSession();
  } catch (_error) {
    redirect('/staff/login'); // If auth fails, redirect to login
  }

  const content = (
    <div className="min-h-screen bg-gray-50 relative flex flex-col items-center py-10 px-4">
      {session.role !== 'ADMIN' && <LogoutButton />}
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Staff Scanner</h1>
        <p className="text-gray-600 mb-6 text-center">Scan customer Instagram QR to verify challenge eligibility.</p>
        
        <QRScannerClient />
      </div>
    </div>
  );

  if (session.role === 'ADMIN') {
    return (
      <AdminLayoutClient>
        {content}
      </AdminLayoutClient>
    );
  }

  return content;
}
