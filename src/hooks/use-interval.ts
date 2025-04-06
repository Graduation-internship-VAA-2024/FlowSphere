import { useEffect, useRef } from 'react';

/**
 * Custom hook to run a callback on an interval
 * @param callback - The function to call on each interval
 * @param delay - The interval in milliseconds, or null to stop the interval
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
    
    return undefined;
  }, [delay]);
} 