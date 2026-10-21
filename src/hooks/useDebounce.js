import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Debounces any fast-changing value (e.g. search input text) by a specified delay.
 * Cleanup-safe: cancels pending timers on unmount or when value changes.
 *
 * @template T
 * @param {T} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 400ms)
 * @returns {T} - The debounced value
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
