import { requireAuth } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import QRScannerClient from './QRScannerClient';

export default async function QRTestPage() {
  try {
    await requireAuth();
  } catch (_error) {
    redirect('/staff/login'); // If auth fails, redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">QR TEST</h1>
        <p className="text-gray-600 mb-6 text-center">Scan a QR code to discover its exact payload.</p>
        
        <QRScannerClient />
      </div>
    </div>
  );
}
