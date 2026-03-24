import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to measure and log component render performance
 */
export function useRenderMetrics(componentName: string) {
  const renderStartRef = useRef<number>(Date.now());
  const renderCountRef = useRef(0);

  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current;
    renderCountRef.current += 1;

    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[${componentName}] Rendered in ${renderTime}ms (render #${renderCountRef.current})`
      );
    }
  });

  return {
    renderCount: renderCountRef.current,
  };
}

/**
 * Hook to measure API call performance
 */
export function useAPIMetrics(apiName: string) {
  const startTimeRef = useRef<number | null>(null);

  const startMetric = () => {
    startTimeRef.current = performance.now();
  };

  const endMetric = (success: boolean = true) => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      const status = success ? '✓' : '✗';
      console.debug(
        `[API] ${status} ${apiName} completed in ${duration.toFixed(2)}ms`
      );
      startTimeRef.current = null;
    }
  };

  return { startMetric, endMetric };
}

/**
 * Hook to track when component comes into view
 */
export function useInView(
  ref: React.RefObject<HTMLElement>,
  callback?: () => void
) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && callback) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, callback]);
}

/**
 * Hook to debounce a value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to throttle a function
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 500
) {
  const lastCallRef = useRef<number>(0);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  ) as T;
}
