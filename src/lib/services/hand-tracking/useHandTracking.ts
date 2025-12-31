'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// --- GESTURE CONFIGURATION ---
const GESTURE_CONFIG = {
  SWIPE_THRESHOLD: 0.25,     // Sensitivity for swipe detection (distance)
  PINCH_THRESHOLD: 0.05,      // Distance between Thumb Tip and Index Tip (normalized)
  SCROLL_THRESHOLD: 0.02,    // Vertical movement to trigger scroll
  GRAB_THRESHOLD: 0.1,       // Distance between Index Finger Tip and Thumb Tip (normalized)
  FIST_THRESHOLD: 0.8,       // Distance between Thumb Tip and Index Finger Tip (normalized)
  OPEN_PALM_THRESHOLD: 0.2,    // Distance between Thumb Tip and Pinky Tip (normalized)
};

export type GestureType = 
  | 'IDLE'
  | 'PINCH' // Can be "Expand" in UI
  | 'SCROLL_UP'
  | 'SCROLL_DOWN'
  | 'GRAB'
  | 'FIST'
  | 'OPEN_PALM'; // 5 fingers

// --- LOGIC: CONVERTING LANDMARKS TO GESTURES ---
function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function normalizeCoordinates(landmark: any): { x: number; y: number } {
  // Normalize 0..1 to screen space
  return {
    x: landmark.x,
    y: landmark.y,
  };
}

interface UseHandTrackingOptions {
  onGesture?: (gesture: GestureType) => void;
  enabled?: boolean;
}

export function useHandTracking({ onGesture, enabled = true }: UseHandTrackingOptions = {}) {
  const [currentGesture, setCurrentGesture] = useState<GestureType>('IDLE');
  const [confidence, setConfidence] = useState<number>(0);
  const [trackingState, setTrackingState] = useState<'IDLE' | 'TRACKING'>('IDLE');
  const handsRef = useRef<any>(null);
  const lastGestureRef = useRef<GestureType>('IDLE');

  useEffect(() => {
    if (!enabled) return;

    let hands: any = null;
    let isMounted = true;

    // Dynamically import MediaPipe Hands
    const initHands = async () => {
      try {
        // Use dynamic import to load MediaPipe Hands
        const mpHands = await import('@mediapipe/hands');
        
        // Try different ways to access Hands constructor
        let Hands: any = null;
        
        // Method 1: Direct access (most common)
        if (mpHands && typeof (mpHands as any).Hands === 'function') {
          Hands = (mpHands as any).Hands;
        }
        // Method 2: Default export
        else if (mpHands && typeof (mpHands as any).default === 'function') {
          Hands = (mpHands as any).default;
        }
        // Method 3: Default.Hands
        else if (mpHands && (mpHands as any).default && typeof (mpHands as any).default.Hands === 'function') {
          Hands = (mpHands as any).default.Hands;
        }
        // Method 4: Check if it's already instantiated (unlikely but possible)
        else if (mpHands && typeof mpHands === 'object' && 'setOptions' in mpHands) {
          hands = mpHands as any;
          Hands = null; // Already instantiated
        }
        
        if (!Hands && !hands) {
          // Gracefully fail - hand tracking is optional
          console.warn('MediaPipe Hands not available. Hand tracking disabled.');
          console.debug('Module structure:', Object.keys(mpHands || {}));
          return;
        }

        if (!isMounted) return;

        // Initialize MediaPipe Hands if not already instantiated
        if (Hands) {
          hands = new Hands({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            },
          });
        }

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        const onResults = (results: any) => {
          if (!isMounted) return;

          // A. Determine State
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setTrackingState('TRACKING');
          } else {
            setTrackingState('IDLE');
            setCurrentGesture('IDLE');
            lastGestureRef.current = 'IDLE';
            return;
          }

          // B. Process Landmarks
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Only track the first hand for simplicity (Dominant Hand)
            const landmarks = results.multiHandLandmarks[0];
            
            // C. Normalize Coordinates
            const wrist = normalizeCoordinates(landmarks[0]); // WRIST
            const thumbTip = normalizeCoordinates(landmarks[4]); // THUMB TIP
            const indexTip = normalizeCoordinates(landmarks[8]); // INDEX TIP
            const middleTip = normalizeCoordinates(landmarks[12]); // MIDDLE TIP
            const ringTip = normalizeCoordinates(landmarks[16]); // RING TIP
            const pinkyTip = normalizeCoordinates(landmarks[20]); // PINKY TIP
            
            // D. Detect Gestures
            const distanceThumbIndex = calculateDistance(thumbTip, indexTip);
            const distanceWristIndex = calculateDistance(wrist, indexTip);
            const distanceThumbPinky = calculateDistance(thumbTip, pinkyTip);
            const distanceThumbMiddle = calculateDistance(thumbTip, middleTip);
            const distanceThumbRing = calculateDistance(thumbTip, ringTip);

            let detectedGesture: GestureType = 'IDLE';
            let confidenceVal = 0.0;

            // 1. PINCH (Thumb and Index close together)
            if (distanceThumbIndex < GESTURE_CONFIG.PINCH_THRESHOLD) {
              detectedGesture = 'PINCH';
              confidenceVal = 0.9;
            }
            // 2. SCROLL (Up/Down based on Y-axis displacement)
            else if (Math.abs(indexTip.y - thumbTip.y) > GESTURE_CONFIG.SCROLL_THRESHOLD) {
              const dy = indexTip.y - thumbTip.y;
              detectedGesture = dy > 0 ? 'SCROLL_DOWN' : 'SCROLL_UP';
              confidenceVal = 0.8;
            }
            // 3. GRAB (Close Hand - fingers curl inwards)
            else if (distanceWristIndex < GESTURE_CONFIG.GRAB_THRESHOLD) {
              detectedGesture = 'GRAB';
              confidenceVal = 0.8;
            }
            // 4. FIST (Closed Hand - thumb touches pinky)
            else if (distanceThumbPinky < GESTURE_CONFIG.FIST_THRESHOLD) {
              detectedGesture = 'FIST';
              confidenceVal = 0.9;
            }
            // 5. OPEN PALM (Five Fingers Extended)
            else if (
              distanceThumbIndex > GESTURE_CONFIG.OPEN_PALM_THRESHOLD &&
              distanceThumbMiddle > GESTURE_CONFIG.OPEN_PALM_THRESHOLD &&
              distanceThumbRing > GESTURE_CONFIG.OPEN_PALM_THRESHOLD
            ) {
              detectedGesture = 'OPEN_PALM';
              confidenceVal = 0.95;
            }

            // E. Update State
            if (detectedGesture !== lastGestureRef.current) {
              setCurrentGesture(detectedGesture);
              lastGestureRef.current = detectedGesture;
              
              // Trigger Callback
              if (detectedGesture !== 'IDLE' && onGesture) {
                onGesture(detectedGesture);
              }
            }
            
            setConfidence(confidenceVal);
          }
        };

        hands.onResults(onResults);
        handsRef.current = hands;

        // Start Camera (only if video element exists)
        const videoElement = document.getElementById('video-input') as HTMLVideoElement;
        if (videoElement && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Request camera access
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(async (stream) => {
              if (!isMounted) {
                stream.getTracks().forEach(track => track.stop());
                return;
              }

              videoElement.srcObject = stream;
              videoElement.play();
              
              // Process frames manually
              const processFrame = async () => {
                if (!isMounted || !hands) return;
                if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                  await hands.send({ image: videoElement });
                }
                if (isMounted) {
                  requestAnimationFrame(processFrame);
                }
              };
              
              videoElement.addEventListener('loadedmetadata', () => {
                if (isMounted) {
                  processFrame();
                }
              });
            })
            .catch((err) => {
              console.error('Camera access denied:', err);
            });
        }
      } catch (error) {
        // Gracefully handle initialization errors - hand tracking is optional
        console.warn('Hand tracking initialization failed (optional feature):', error);
        // Don't throw - just disable hand tracking silently
      }
    };

    initHands();

    // Cleanup
    return () => {
      isMounted = false;
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      // Stop video stream
      const videoElement = document.getElementById('video-input') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
    };
  }, [enabled, onGesture]);

  return {
    currentGesture,
    confidence,
    trackingState,
  };
}
