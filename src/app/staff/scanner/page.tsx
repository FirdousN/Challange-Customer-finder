import { requireAuth } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import QRScannerClient from './QRScannerClient';
import LogoutButton from './LogoutButton';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function ScannerPage() {
  try {
    await requireAuth();
  } catch (_error) {
    redirect('/staff/login'); // If auth fails, redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 relative flex flex-col items-center py-10 px-4">
      <LogoutButton />
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Staff Scanner</h1>
        <p className="text-gray-600 mb-6 text-center">Scan customer Instagram QR to verify challenge eligibility.</p>
        
        <QRScannerClient />
      </div>
    </div>
  );
}
