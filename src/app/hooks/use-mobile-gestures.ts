'use client';

import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function useMobileGestures(handlers: SwipeHandlers) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const minSwipeDistance = 50;
  const maxSwipeTime = 300;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchEndRef.current = null;
      touchStartRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
        time: Date.now(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndRef.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;

      const distanceX = touchEndRef.current.x - touchStartRef.current.x;
      const distanceY = touchEndRef.current.y - touchStartRef.current.y;
      const timeDiff = touchEndRef.current.time - touchStartRef.current.time;

      if (timeDiff > maxSwipeTime) return;

      const isLeftSwipe = distanceX < -minSwipeDistance;
      const isRightSwipe = distanceX > minSwipeDistance;
      const isUpSwipe = distanceY < -minSwipeDistance;
      const isDownSwipe = distanceY > minSwipeDistance;

      if (Math.abs(distanceX) > Math.abs(distanceY)) {
        // Horizontal swipe
        if (isLeftSwipe && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        } else if (isRightSwipe && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        }
      } else {
        // Vertical swipe
        if (isUpSwipe && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        } else if (isDownSwipe && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        }
      }
    };

    const element = document.body;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers]);
}
