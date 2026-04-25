import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface FetchOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export function useOptimizedFetch<T>(
  url: string,
  options: FetchOptions = {}
): FetchState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { enabled = true, refetchInterval, staleTime = 5 * 60 * 1000 } = options; // 5 minutes default stale time

  const fetchData = useCallback(async () => {
    // Check cache first
    if (cacheRef.current) {
      const { data, timestamp } = cacheRef.current;
      const isStale = Date.now() - timestamp > staleTime;
      
      if (!isStale) {
        setState({ data, loading: false, error: null });
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('canvas_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Update cache
      cacheRef.current = { data, timestamp: Date.now() };
      
      setState({ data, loading: false, error: null });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
        setState({ data: null, loading: false, error: error.message });
      }
    }
  }, [url, staleTime]);

  const refetch = useCallback(async () => {
    // Clear cache to force fresh fetch
    cacheRef.current = null;
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, fetchData]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, fetchData]);

  return { ...state, refetch };
}