'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScannerClient() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ value: string; format?: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    let isMounted = true;
    
    const initializeScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          if (isMounted) setHasCameraPermission(true);
          
          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode('qr-reader');
          }

          if (scannerRef.current.isScanning) return;

          await scannerRef.current.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText, decodedResult) => {
              // On successful scan
              if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error);
              }
              if (isMounted) {
                const formatName = decodedResult?.result?.format?.formatName || 'Unknown';
                setScanResult({
                  value: decodedText,
                  format: formatName,
                });
              }
            },
            (_errorMessage) => {
              // html5-qrcode calls this a lot when no QR is in frame. Ignore it.
            }
          );
        } else {
          if (isMounted) {
            setHasCameraPermission(false);
            setErrorMsg('No cameras found on this device.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setHasCameraPermission(false);
          setErrorMsg(err instanceof Error ? err.message : 'Camera permission denied or unavailable.');
        }
      }
    };

    initializeScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleReset = () => {
    setScanResult(null);
    setErrorMsg(null);
    setHasCameraPermission(null);
    // Force reload to cleanly restart the scanner stream
    window.location.reload();
  };

  return (
    <div className="w-full">
      {!scanResult && !errorMsg && hasCameraPermission !== false && (
        <div className="mb-4">
          <div id="qr-reader" className="w-full rounded overflow-hidden shadow-sm border bg-black"></div>
          <p className="text-sm text-center text-gray-500 mt-2">Looking for QR code...</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border border-red-200">
          <p className="font-bold">Scanner Error</p>
          <p>{errorMsg}</p>
          <button 
            onClick={handleReset}
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {scanResult && (
        <div className="bg-green-50 p-4 rounded-md border border-green-200 break-words">
          <h3 className="font-bold text-green-800 mb-3">Scan Successful</h3>
          
          <div className="mb-2">
            <span className="text-xs font-semibold uppercase text-green-600 block">Raw Decoded Value:</span>
            <code className="bg-white px-2 py-1 rounded border border-green-100 text-sm block mt-1 break-all whitespace-pre-wrap">
              {scanResult.value}
            </code>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <span className="text-xs font-semibold uppercase text-green-600 block">Length:</span>
              <span className="font-mono text-gray-800">{scanResult.value.length}</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-green-600 block">Type:</span>
              <span className="font-mono text-gray-800">{scanResult.format}</span>
            </div>
          </div>

          <button 
            onClick={handleReset}
            className="w-full mt-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
          >
            Scan Another
          </button>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/staff/login';
            } catch (err) {
              console.error('Logout failed', err);
            }
          }}
          className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
