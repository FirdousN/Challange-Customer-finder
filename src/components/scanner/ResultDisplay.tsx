import React from 'react';

export interface ScanResultData {
  success: boolean;
  result: 'NEW' | 'ALREADY_PLAYED' | 'ERROR';
  error?: string;
  customer?: {
    id: string;
    instagramUsername: string;
    instagramProfileUrl?: string;
    firstSeenAt: string;
    lastSeenAt?: string;
    scanCount: number;
  };
  participation?: {
    playedAt: string;
    chancesEarned: number;
    chancesUsed: number;
    status: string;
  };
}

interface ResultDisplayProps {
  data: ScanResultData;
  onReset: () => void;
}

function formatIST(dateString?: string) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return 'Invalid Date';
  }
}

export default function ResultDisplay({ data, onReset }: ResultDisplayProps) {
  if (!data.success || data.result === 'ERROR') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center space-y-4">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Scan Error</h3>
        <p className="text-gray-700 dark:text-gray-300">
          {data.error || 'An unknown error occurred while processing the QR code.'}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 px-4 bg-black text-white dark:bg-white dark:text-black rounded-md font-medium"
        >
          SCAN ANOTHER
        </button>
      </div>
    );
  }

  const { customer, participation } = data;
  const isAlreadyPlayed = data.result === 'ALREADY_PLAYED';

  return (
    <div
      className={`border rounded-lg p-6 space-y-6 ${
        isAlreadyPlayed
          ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800'
      }`}
    >
      <div className="text-center space-y-2">
        <h2
          className={`text-2xl font-black ${
            isAlreadyPlayed ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
          }`}
        >
          {isAlreadyPlayed ? 'ALREADY PLAYED' : 'ELIGIBLE TO PLAY'}
        </h2>
        {customer && (
          <div className="text-lg font-medium text-gray-900 dark:text-white">
            @{customer.instagramUsername}
          </div>
        )}
      </div>

      {customer && (
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          {isAlreadyPlayed && participation ? (
            <>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-zinc-700">
                <span className="font-semibold text-red-600 dark:text-red-400">Previous Challenge:</span>
                <span>{formatIST(participation.playedAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-zinc-700">
                <span className="font-semibold">Chances:</span>
                <span>{participation.chancesEarned}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-zinc-700">
                <span className="font-semibold">Used:</span>
                <span>{participation.chancesUsed}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-zinc-700">
              <span className="font-semibold text-green-600 dark:text-green-400">Status:</span>
              <span>Not Played</span>
            </div>
          )}

          <div className="flex justify-between py-1 border-b border-gray-200 dark:border-zinc-700">
            <span className="font-semibold">First Seen:</span>
            <span>{formatIST(customer.firstSeenAt)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-200 dark:border-zinc-700">
            <span className="font-semibold">Scan Count:</span>
            <span>{customer.scanCount}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="w-full py-4 px-4 bg-black text-white dark:bg-white dark:text-black rounded-md font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
      >
        SCAN ANOTHER
      </button>
    </div>
  );
}
