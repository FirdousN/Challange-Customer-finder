import React from 'react';
import { formatIST } from '@/lib/utils/date';

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
    playedByStaffName: string;
  };
}

interface ResultDisplayProps {
  data: ScanResultData;
  onReset: () => void;
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
          TRY AGAIN
        </button>
      </div>
    );
  }

  const { customer, participation } = data;
  const isAlreadyPlayed = data.result === 'ALREADY_PLAYED';

  return (
    <div
      className={`border rounded-lg p-6 space-y-6 shadow-sm ${
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
          {isAlreadyPlayed ? 'ALREADY PLAYED' : 'CUSTOMER VERIFIED'}
        </h2>
        
        {customer && (
          <div className="text-xl font-medium text-gray-900 dark:text-white mt-1">
            @{customer.instagramUsername}
          </div>
        )}
      </div>

      {customer && participation && (
        <div className="space-y-3 text-[15px] text-gray-800 dark:text-gray-200 bg-white dark:bg-zinc-900/50 rounded p-4 border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="font-semibold">Status:</span>
            <span className={`font-bold ${isAlreadyPlayed ? 'text-red-600' : 'text-green-600'}`}>
              {isAlreadyPlayed ? 'ALREADY PLAYED' : 'ELIGIBLE / PLAY RECORDED'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="font-semibold">{isAlreadyPlayed ? 'Played on:' : 'Scanned:'}</span>
            <span>{formatIST(participation.playedAt)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="font-semibold">{isAlreadyPlayed ? 'Played by:' : 'Staff:'}</span>
            <span>{participation.playedByStaffName}</span>
          </div>

          {isAlreadyPlayed && (
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800 pb-2">
              <span className="font-semibold">First scan:</span>
              <span>{formatIST(customer.firstSeenAt)}</span>
            </div>
          )}

          <div className="flex justify-between py-1 pt-1">
            <span className="font-semibold">Total scans:</span>
            <span>{customer.scanCount}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="w-full py-4 px-4 bg-black text-white dark:bg-white dark:text-black rounded-md font-bold text-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
      >
        SCAN ANOTHER
      </button>
    </div>
  );
}
