
import { useRef, useCallback } from 'react';

export const useTripleTap = (callback: () => void, tapDelay = 500) => {
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const resetTapCount = () => {
    tapCount.current = 0;
  };

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    
    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    
    if (timeSinceLastTap > tapDelay) {
      // Too much time has passed, reset counter
      tapCount.current = 1;
    } else {
      // Increment tap count
      tapCount.current += 1;
    }
    
    lastTapTime.current = now;
    
    // If we've reached 3 taps, execute the callback
    if (tapCount.current === 3) {
      callback();
      tapCount.current = 0;
      return;
    }
    
    // Set a timeout to reset the tap count after the delay
    timeoutRef.current = window.setTimeout(resetTapCount, tapDelay);
  }, [callback, tapDelay]);

  return handleTap;
};
