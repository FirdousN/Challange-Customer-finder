'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import ResultDisplay, { ScanResultData } from '@/components/scanner/ResultDisplay';
import { ZoomIn, ZoomOut } from 'lucide-react';

export default function QRScannerClient() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<ScanResultData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera Capabilities State
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomMin, setZoomMin] = useState(1);
  const [zoomMax, setZoomMax] = useState(4);
  const [zoomStep, setZoomStep] = useState(0.1);
  const [currentZoom, setCurrentZoom] = useState(1);

  const isProcessingRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasAppliedDefaultZoom = useRef(false);
  
  // Keep ref in sync
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const applyCameraEnhancements = useCallback(async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    
    try {
      const capabilities = scannerRef.current.getRunningTrackCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number }, focusMode?: string[] };
      const settings = scannerRef.current.getRunningTrackSettings() as MediaTrackSettings & { focusMode?: string };
      
      const constraints: MediaTrackConstraints = {};
      let constraintsToApply = false;

      // 1. Continuous Autofocus
      if (capabilities.focusMode?.includes('continuous') && settings.focusMode !== 'continuous') {
        constraints.advanced = constraints.advanced || [];
        constraints.advanced.push({ focusMode: 'continuous' } as MediaTrackConstraintSet);
        constraintsToApply = true;
      }

      // 2. Default Zoom to ~2x if not already applied
      if (capabilities.zoom && !hasAppliedDefaultZoom.current) {
        setZoomSupported(true);
        const zMin = capabilities.zoom.min || 1;
        const zMax = capabilities.zoom.max || 4;
        const zStep = capabilities.zoom.step || 0.1;
        
        setZoomMin(zMin);
        setZoomMax(zMax);
        setZoomStep(zStep);

        const desiredZoom = Math.min(Math.max(2, zMin), zMax);
        
        constraints.advanced = constraints.advanced || [];
        constraints.advanced.push({ zoom: desiredZoom } as MediaTrackConstraintSet);
        constraintsToApply = true;
        setCurrentZoom(desiredZoom);
        hasAppliedDefaultZoom.current = true;
      }

      if (constraintsToApply) {
        await scannerRef.current.applyVideoConstraints(constraints);
      }
    } catch (err) {
      console.warn("Could not apply camera enhancements:", err);
      // Graceful fallback - we don't break the scanner if constraints fail
    }
  }, []);

  const handleZoomChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setCurrentZoom(newZoom);
    
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ zoom: newZoom } as MediaTrackConstraintSet]
        });
      } catch (err) {
        console.warn("Failed to apply manual zoom:", err);
      }
    }
  };

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

          hasAppliedDefaultZoom.current = false; // Reset zoom state for new session

          await scannerRef.current.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              if (isProcessingRef.current) return; // Prevent double-scanning
              setIsProcessing(true);

              // Pause scanner rather than fully stopping to prevent cleanup races
              if (scannerRef.current?.isScanning) {
                scannerRef.current.pause(true);
              }

              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const res = await fetch('/api/staff/scan', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ rawPayload: decodedText }),
                  signal: controller.signal,
                });
                
                clearTimeout(timeoutId);
                
                const contentType = res.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                  throw new Error(`Invalid server response (Status: ${res.status})`);
                }

                const data = await res.json();
                
                if (isMounted) {
                  if (!data.success) {
                    setApiResult({
                      success: false,
                      result: 'ERROR',
                      error: data.message || data.error || 'Unable to verify this QR code. Please try again.',
                    });
                  } else {
                    setApiResult(data);
                  }
                }
              } catch (err: unknown) {
                if (isMounted) {
                  const isTimeout = err instanceof Error && err.name === 'AbortError';
                  setApiResult({
                    success: false,
                    result: 'ERROR',
                    error: isTimeout ? 'Network connection timed out. Please try again.' : 'Network connection problem. Please try again.',
                  });
                }
              } finally {
                if (isMounted) {
                  setIsProcessing(false);
                }
              }
            },
            () => {
              // Ignore standard scanning errors when no QR is found
            }
          );
          
          // Once started successfully, try applying enhancements
          if (isMounted) {
            await applyCameraEnhancements();
          }

        } else {
          if (isMounted) {
            setHasCameraPermission(false);
            setErrorMsg('No camera was found on this device.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setHasCameraPermission(false);
          const errName = err instanceof Error ? err.name : '';
          const errMsg = err instanceof Error ? err.message : String(err);
          
          if (errName === 'NotAllowedError' || errMsg.includes('NotAllowedError') || errMsg.toLowerCase().includes('permission')) {
             setErrorMsg('Camera permission is blocked. Please allow camera access in your browser settings.');
          } else if (errName === 'NotFoundError' || errMsg.includes('NotFoundError')) {
             setErrorMsg('No camera was found on this device.');
          } else if (errName === 'NotReadableError' || errMsg.includes('NotReadableError')) {
             setErrorMsg('The camera is currently being used by another application. Close other camera apps and try again.');
          } else if (errName === 'OverconstrainedError' || errMsg.includes('OverconstrainedError')) {
             setErrorMsg('The selected camera configuration is not supported. Using the device\'s default camera.');
          } else if (errName === 'SecurityError' || errMsg.includes('SecurityError')) {
             setErrorMsg('Camera access is blocked by the browser.');
          } else {
             setErrorMsg('Unable to start the camera. Please try again. (' + errMsg + ')');
          }
        }
      }
    };

    // Initialize immediately
    initializeScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [applyCameraEnhancements]); // Dependency allows applying zoom safely

  const handleReset = () => {
    setApiResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
    
    if (scannerRef.current) {
      if (scannerRef.current.getState() === 3 /* Html5QrcodeScannerState.PAUSED */) {
        scannerRef.current.resume();
        // Reapply enhancements if we resume
        applyCameraEnhancements();
      }
    } else {
      // If we don't have scanner running and want to retry permission
      window.location.reload(); 
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none touch-pan-y">
      <div className={`w-full ${(!apiResult && !errorMsg && hasCameraPermission !== false) ? 'block' : 'hidden'}`}>
        <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border-2 border-gray-200 bg-black aspect-[4/5] sm:aspect-square max-w-sm mx-auto">
          <div id="qr-reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
          
          {/* Scanning Overlay UI */}
          {!isProcessing && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
               <div className="w-56 h-56 border-2 border-white/40 rounded-[12%] shadow-[0_0_0_4000px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg -translate-x-[2px] -translate-y-[2px]"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg translate-x-[2px] -translate-y-[2px]"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg -translate-x-[2px] translate-y-[2px]"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg translate-x-[2px] translate-y-[2px]"></div>
                  <div className="w-full h-0.5 bg-green-400/50 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
               </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-10">
               <div className="text-white font-medium flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-white/20 border-t-white border-b-white"></div>
                  <span className="tracking-wide">Processing QR...</span>
               </div>
            </div>
          )}
        </div>
        
        {/* Camera Zoom Controls */}
        {zoomSupported && !isProcessing && (
          <div className="mt-6 max-w-sm mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <ZoomOut size={22} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <input 
                type="range" 
                min={zoomMin} 
                max={zoomMax} 
                step={zoomStep} 
                value={currentZoom} 
                onChange={handleZoomChange}
                className="w-full accent-black h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-bold text-gray-400 px-1 uppercase tracking-wider">
                <span>{zoomMin}x</span>
                <span className="text-black bg-gray-100 px-2.5 py-0.5 rounded-full">{currentZoom.toFixed(1)}x</span>
                <span>{zoomMax}x</span>
              </div>
            </div>
            <ZoomIn size={22} className="text-gray-400 flex-shrink-0" />
          </div>
        )}

        <p className="text-sm font-medium text-center text-gray-500 mt-6 px-4">
          Align the Instagram QR within the frame
        </p>
      </div>

      {/* Permission Denied or General Error State */}
      {(errorMsg || hasCameraPermission === false) && !apiResult && (
        <div className="bg-red-50 text-red-700 p-8 rounded-2xl w-full text-center space-y-5 border border-red-200 max-w-sm mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="font-bold text-xl text-red-800">Scanner Error</h3>
          <p className="text-sm text-red-600 font-medium leading-relaxed">{errorMsg || "Camera access denied."}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 px-4 bg-black hover:bg-gray-800 text-white rounded-xl font-bold transition-colors shadow-md text-lg tracking-wide mt-2"
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Scan Result Component */}
      {apiResult && (
        <div className="w-full max-w-sm mx-auto">
           <ResultDisplay data={apiResult} onReset={handleReset} />
        </div>
      )}

    </div>
  );
}
