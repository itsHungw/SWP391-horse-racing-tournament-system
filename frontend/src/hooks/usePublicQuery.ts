import { useEffect, useRef, useState } from "react";

type CacheEntry = { data: unknown; time: number };

const cache = new Map<string, CacheEntry>();
const FRESH_MS = 60_000;

export function clearPublicQueryCache() {
  cache.clear();
}

/**
 * Lightweight stale-while-revalidate cache for public read-only queries.
 * Previous data is kept on key changes so pagination and filter changes
 * never collapse the page back into a skeleton.
 */
export function usePublicQuery<T>(key: string, fetcher: () => Promise<T>) {
  const cached = cache.get(key);
  const [data, setData] = useState<T | null>((cached?.data as T | undefined) ?? null);
  const [fetching, setFetching] = useState(!cached);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const entry = cache.get(key);
    if (entry) {
      setData(entry.data as T);
      setError(false);
      if (Date.now() - entry.time < FRESH_MS) {
        setFetching(false);
        return;
      }
    }
    let cancelled = false;
    setFetching(true);
    setError(false);
    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return;
        cache.set(key, { data: result, time: Date.now() });
        setData(result);
      })
      .catch((err) => {
        console.error(`Public query failed: ${key}`, err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  return {
    data,
    /** A request is in flight (initial load or background revalidate). */
    fetching,
    /** No data to show yet — render a skeleton. */
    loading: fetching && data === null,
    error,
    retry: () => {
      cache.delete(key);
      setAttempt((current) => current + 1);
    },
  };
}
