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
  const [scanStatus, setScanStatus] = useState<'READY' | 'FOCUSING' | 'ZOOMING' | 'DETECTED'>('READY');

  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasAppliedDefaultZoom = useRef(false);
  const [isAutoZoomEnabled, setIsAutoZoomEnabled] = useState(true);
  const autoZoomEnabledRef = useRef(true);
  const scanLoopRef = useRef<number | null>(null);
  
  // Keep ref in sync
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const startAutoZoomLoop = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window === 'undefined' || !(window as any).BarcodeDetector) return;
    
    // We cannot use getRunningTrack directly on Html5Qrcode if it's not exposed, 
    // but we can query the video element's srcObject.
    const video = document.querySelector('#qr-reader video') as HTMLVideoElement;
    if (!video || !video.srcObject) return;
    const stream = video.srcObject as MediaStream;
    const tracks = stream.getVideoTracks();
    if (tracks.length === 0) return;
    const track = tracks[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let barcodeDetector: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
    } catch (_e) {
      return; // Not supported
    }

    const loop = async () => {
      if (!isMountedRef.current) return;
      if (isProcessingRef.current) {
        if (scanLoopRef.current) clearTimeout(scanLoopRef.current);
        scanLoopRef.current = window.setTimeout(loop, 1000);
        return;
      }
      if (!autoZoomEnabledRef.current) {
        setScanStatus('READY');
        if (scanLoopRef.current) clearTimeout(scanLoopRef.current);
        scanLoopRef.current = window.setTimeout(loop, 1000);
        return;
      }

      try {
        if (video.readyState === 4) {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const qr = barcodes[0];
            const videoWidth = video.videoWidth || video.clientWidth;
            
            // Calculate horizontal ratio
            const qrRatio = qr.boundingBox.width / videoWidth;

            if (qrRatio < 0.25) { 
              setScanStatus('ZOOMING');
              
              const capabilities = track.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } };
              const settings = track.getSettings() as MediaTrackSettings & { zoom?: number };
              
              if (capabilities.zoom && settings.zoom !== undefined) {
                const safeMax = Math.min(capabilities.zoom.max, 3.5); 
                const newZoom = Math.min(settings.zoom + 0.4, safeMax);
                
                if (newZoom > settings.zoom + 0.1) {
                  try {
                    await track.applyConstraints({
                      advanced: [{ zoom: newZoom } as MediaTrackConstraintSet]
                    });
                    setCurrentZoom(newZoom);
                  } catch (e) {
                    console.warn("Auto zoom constraint failed", e);
                  }
                  // Give camera extra time to adjust focus after zooming
                  scanLoopRef.current = window.setTimeout(loop, 1200);
                  return;
                } else {
                  setScanStatus('DETECTED');
                }
              } else {
                setScanStatus('DETECTED');
              }
            } else {
              setScanStatus('DETECTED');
            }
          } else {
            setScanStatus('READY');
          }
        }
      } catch (_err) {
        // Silent failure for loop
      }

      scanLoopRef.current = window.setTimeout(loop, 400);
    };

    scanLoopRef.current = window.setTimeout(loop, 500);
  }, []);

  const applyCameraEnhancements = useCallback(async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return;
    
    try {
      const capabilities = scannerRef.current.getRunningTrackCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number }, focusMode?: string[] };
      const settings = scannerRef.current.getRunningTrackSettings() as MediaTrackSettings & { focusMode?: string };
      
      const constraints: MediaTrackConstraints = {};
      let constraintsToApply = false;

      // 1. Continuous Autofocus
      if (capabilities.focusMode?.includes('continuous') && settings.focusMode !== 'continuous') {
        setScanStatus('FOCUSING');
        constraints.advanced = constraints.advanced || [];
        constraints.advanced.push({ focusMode: 'continuous' } as MediaTrackConstraintSet);
        constraintsToApply = true;
      }

      // 2. Points of Interest (Center Focus Bias)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((capabilities as any).pointsOfInterest) {
        constraints.advanced = constraints.advanced || [];
        constraints.advanced.push({ pointsOfInterest: [{ x: 0.5, y: 0.5 }] } as MediaTrackConstraintSet);
        constraintsToApply = true;
      }

      // 3. Default Zoom to ~2x if not already applied
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
      
      setScanStatus('READY');
      
    } catch (err) {
      console.warn("Could not apply camera enhancements:", err);
      setScanStatus('READY');
      // Graceful fallback - we don't break the scanner if constraints fail
    }
  }, []);

  const handleZoomChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setCurrentZoom(newZoom);
    setIsAutoZoomEnabled(false);
    autoZoomEnabledRef.current = false; // Disable auto zoom if manual override
    
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

          hasAppliedDefaultZoom.current = false; 
          setIsAutoZoomEnabled(true);
          autoZoomEnabledRef.current = true;

          await scannerRef.current.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              if (isProcessingRef.current) return; // Prevent double-scanning
              setIsProcessing(true);

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
          
          if (isMounted) {
            await applyCameraEnhancements();
            startAutoZoomLoop();
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
             setErrorMsg("The selected camera configuration is not supported. Using the device's default camera.");
          } else if (errName === 'SecurityError' || errMsg.includes('SecurityError')) {
             setErrorMsg('Camera access is blocked by the browser.');
          } else {
             setErrorMsg('Unable to start the camera. Please try again. (' + errMsg + ')');
          }
        }
      }
    };

    initializeScanner();

    return () => {
      isMounted = false;
      if (scanLoopRef.current) clearTimeout(scanLoopRef.current);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [applyCameraEnhancements, startAutoZoomLoop]); 

  const handleReset = () => {
    setApiResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
    setIsAutoZoomEnabled(true);
    autoZoomEnabledRef.current = true; // Re-enable auto zoom on scan another
    setScanStatus('READY');
    
    if (scannerRef.current) {
      if (scannerRef.current.getState() === 3 /* Html5QrcodeScannerState.PAUSED */) {
        scannerRef.current.resume();
        applyCameraEnhancements();
      }
    } else {
      window.location.reload(); 
    }
  };

  const getStatusMessage = () => {
    if (isProcessing) return "Checking customer...";
    switch(scanStatus) {
      case 'FOCUSING': return "Adjusting focus...";
      case 'ZOOMING': return "QR detected — Zooming in...";
      case 'DETECTED': return "QR detected";
      default: return "Point camera at Instagram QR";
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none touch-pan-y">
      <div className={`w-full ${(!apiResult && !errorMsg && hasCameraPermission !== false) ? 'block' : 'hidden'}`}>
        
        {/* Status Indicator */}
        <div className="mb-4 flex justify-center">
          <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-300 shadow-sm border
            ${isProcessing ? 'bg-black text-white border-black' : 
              scanStatus === 'ZOOMING' || scanStatus === 'DETECTED' ? 'bg-green-100 text-green-700 border-green-200' :
              scanStatus === 'FOCUSING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
              'bg-white text-gray-600 border-gray-200'}
          `}>
            {getStatusMessage()}
          </div>
        </div>

        <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border-2 border-gray-200 bg-black aspect-[4/5] sm:aspect-square max-w-sm mx-auto">
          <div id="qr-reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
          
          {/* Scanning Overlay UI */}
          {!isProcessing && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
               <div className={`w-56 h-56 border-2 transition-all flex items-center justify-center duration-300 rounded-[12%] shadow-[0_0_0_4000px_rgba(0,0,0,0.5)] 
                  ${scanStatus === 'DETECTED' || scanStatus === 'ZOOMING' ? 'border-green-400/80 scale-105' : 'border-white/40'}
               `}>
                  <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg -translate-x-[2px] -translate-y-[2px] transition-colors ${scanStatus === 'DETECTED' || scanStatus === 'ZOOMING' ? 'border-green-500' : 'border-green-400'}`}></div>
                  <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg translate-x-[2px] -translate-y-[2px] transition-colors ${scanStatus === 'DETECTED' || scanStatus === 'ZOOMING' ? 'border-green-500' : 'border-green-400'}`}></div>
                  <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg -translate-x-[2px] translate-y-[2px] transition-colors ${scanStatus === 'DETECTED' || scanStatus === 'ZOOMING' ? 'border-green-500' : 'border-green-400'}`}></div>
                  <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg translate-x-[2px] translate-y-[2px] transition-colors ${scanStatus === 'DETECTED' || scanStatus === 'ZOOMING' ? 'border-green-500' : 'border-green-400'}`}></div>
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
          <div className="mt-6 max-w-sm mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 transition-opacity duration-300">
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
                <span className={`px-2.5 py-0.5 rounded-full transition-colors duration-300 ${!isAutoZoomEnabled ? 'text-white bg-black' : 'text-black bg-gray-100'}`}>
                  {currentZoom.toFixed(1)}x { !isAutoZoomEnabled && ' (MANUAL)' }
                </span>
                <span>{zoomMax}x</span>
              </div>
            </div>
            <ZoomIn size={22} className="text-gray-400 flex-shrink-0" />
          </div>
        )}

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
        <div className="w-full max-w-sm mx-auto mt-4">
           <ResultDisplay data={apiResult} onReset={handleReset} />
        </div>
      )}

    </div>
  );
}
