
import { useRef, useEffect } from "react";

interface UseTripleTapOptions {
  onTripleTap: () => void;
  timeout?: number;
}

export const useTripleTap = ({ onTripleTap, timeout = 500 }: UseTripleTapOptions) => {
  const touchCount = useRef(0);
  const lastTouchTime = useRef(0);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);
  
  const handleTouch = () => {
    const now = Date.now();
    
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    if (now - lastTouchTime.current > timeout) {
      touchCount.current = 1;
    } else {
      touchCount.current += 1;
    }
    
    lastTouchTime.current = now;
    
    touchTimeoutRef.current = setTimeout(() => {
      if (touchCount.current === 3) {
        onTripleTap();
      }
      touchCount.current = 0;
    }, timeout);
  };
  
  return { handleTouch };
};
