'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import ResultDisplay, { ScanResultData } from '@/components/scanner/ResultDisplay';

export default function QRScannerClient() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<ScanResultData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
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
            async (decodedText) => {
              if (isProcessing) return; // Prevent double-scanning
              setIsProcessing(true);

              if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(console.error);
              }

              try {
                const res = await fetch('/api/staff/scan', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rawPayload: decodedText }),
                });
                
                const data = await res.json();
                if (isMounted) {
                  setApiResult(data);
                }
              } catch (err: unknown) {
                if (isMounted) {
                  setApiResult({
                    success: false,
                    result: 'ERROR',
                    error: err instanceof Error ? err.message : 'Network error during scan processing',
                  });
                }
              } finally {
                if (isMounted) {
                  setIsProcessing(false);
                }
              }
            },
            (_errorMessage) => {
              // Ignore standard scanning errors when no QR is found
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

    if (!apiResult && !isProcessing) {
      initializeScanner();
    }

    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [apiResult, isProcessing]);

  const handleReset = () => {
    setApiResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
  };

  return (
    <div className="w-full">
      {!apiResult && !errorMsg && hasCameraPermission !== false && (
        <div className="mb-4">
          <div id="qr-reader" className="w-full rounded overflow-hidden shadow-sm border bg-black"></div>
          <p className="text-sm text-center text-gray-500 mt-2">
            {isProcessing ? 'Processing QR code...' : 'Looking for Instagram QR code...'}
          </p>
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

      {apiResult && (
        <ResultDisplay data={apiResult} onReset={handleReset} />
      )}

      <div className="mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
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
