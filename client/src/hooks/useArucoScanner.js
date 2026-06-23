import { useRef, useEffect, useCallback, useState } from 'react';

const CONSECUTIVE_FRAMES_REQUIRED = 3;

/**
 * Hook that manages camera access and ArUco marker detection.
 * Uses js-aruco for detection and requires 3 consecutive matching frames
 * before reporting a detection to prevent noise.
 *
 * @param {(markerId: number) => void} onDetected - Callback when stable marker detected
 * @returns {{ videoRef, canvasRef, isScanning, startScanning, stopScanning, error }}
 */
export function useArucoScanner(onDetected) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const consecutiveRef = useRef({ id: null, count: 0 });
  const detectorRef = useRef(null);
  const onDetectedRef = useRef(onDetected);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  // Keep callback ref current
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const detector = detectorRef.current;
      const markers = detector.detect(imageData);

      if (markers.length > 0) {
        const markerId = markers[0].id;
        const cons = consecutiveRef.current;

        if (cons.id === markerId) {
          cons.count += 1;
          if (cons.count >= CONSECUTIVE_FRAMES_REQUIRED) {
            // Stable detection — fire callback and stop scanning
            onDetectedRef.current(markerId);
            return; // Don't request next frame — scanning complete
          }
        } else {
          consecutiveRef.current = { id: markerId, count: 1 };
        }
      } else {
        // Reset consecutive count if no marker visible
        if (consecutiveRef.current.count > 0) {
          consecutiveRef.current = { id: null, count: 0 };
        }
      }
    } catch (err) {
      // Silently ignore detection errors on individual frames
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);

    try {
      // Dynamically import js-aruco
      // js-aruco2 is a legacy script that attaches itself to the global
      // object (`this.AR = ...`) instead of using real module.exports.
      // Under Node/dev this happened to also land on the CJS exports object,
      // but Vite's production bundler resolves that `this` to `window` —
      // so the library only ever actually shows up on window.AR.
      await import('js-aruco2');
      const AR = window.AR;
      if (!AR || !AR.Detector) {
        throw new Error('AR library did not attach to window as expected');
      }
      detectorRef.current = new AR.Detector();
    } catch (err) {
      console.error('[ArUco] Failed to init detector:', err);
      setError('Failed to load ArUco library. Please refresh and try again.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      consecutiveRef.current = { id: null, count: 0 };
      setIsScanning(true);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  }, [processFrame]);

  const stopScanning = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    consecutiveRef.current = { id: null, count: 0 };
    setIsScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return { videoRef, canvasRef, isScanning, startScanning, stopScanning, error };
}