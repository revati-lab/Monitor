"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingOptions<T> {
  /** Polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Whether polling is enabled (default: true) */
  enabled?: boolean;
  /** Callback when data is updated */
  onUpdate?: (data: T) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface UsePollingReturn<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refetch: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  initialData: T,
  options: UsePollingOptions<T> = {}
): UsePollingReturn<T> {
  const { interval = 5000, enabled = true, onUpdate, onError } = options;

  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Store callbacks in refs to avoid dependency issues
  const fetchFnRef = useRef(fetchFn);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const refetch = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFnRef.current();
      if (isMountedRef.current) {
        setData(newData);
        setLastUpdate(new Date());
        onUpdateRef.current?.(newData);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error("Failed to fetch data");
        setError(error);
        onErrorRef.current?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Set up polling interval
  useEffect(() => {
    isMountedRef.current = true;

    if (isPolling && enabled) {
      // Initial fetch
      refetch();

      // Set up interval
      intervalRef.current = setInterval(() => {
        refetch();
      }, interval);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, enabled, interval, refetch]);

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    refetch,
    startPolling,
    stopPolling,
    isPolling,
  };
}
