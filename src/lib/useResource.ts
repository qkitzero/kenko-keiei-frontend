"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ResourceState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "unauthenticated" }
  | { status: "error"; retry: () => void };

export type DetailedResourceState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "unauthenticated"; retry: () => void }
  | { status: "forbidden"; retry: () => void }
  | { status: "not_found"; retry: () => void }
  | { status: "error"; retry: () => void };

type FetchResult<T> =
  | { status: "ok"; data: T }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "error" };

async function load<T>(
  url: string,
  select: (body: unknown) => T,
): Promise<FetchResult<T>> {
  const res = await fetch(url);
  if (res.status === 401) return { status: "unauthenticated" };
  if (res.status === 403) return { status: "forbidden" };
  if (res.status === 404) return { status: "not_found" };
  if (!res.ok) return { status: "error" };
  return { status: "ok", data: select(await res.json()) };
}

function useFetched<T>(url: string, select: (body: unknown) => T) {
  const [loaded, setLoaded] = useState<{
    key: string;
    result: FetchResult<T>;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  const requestKey = `${reloadKey}:${url}`;

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await load(url, select).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      setLoaded({ key: requestKey, result });
    })();
    return () => {
      active = false;
    };
  }, [url, select, requestKey]);

  return {
    result: loaded?.key === requestKey ? loaded.result : null,
    retry,
  };
}

export function useDetailedResource<T>(
  url: string,
  select: (body: unknown) => T,
): DetailedResourceState<T> {
  const { result, retry } = useFetched(url, select);

  return useMemo(() => {
    if (!result) return { status: "loading" };
    if (result.status === "ok") return { status: "ok", data: result.data };
    return { status: result.status, retry };
  }, [result, retry]);
}

export function useResource<T>(
  url: string,
  select: (body: unknown) => T,
): ResourceState<T> {
  const detailed = useDetailedResource(url, select);

  return useMemo(() => {
    if (detailed.status === "unauthenticated") {
      return { status: "unauthenticated" };
    }
    if (detailed.status === "forbidden" || detailed.status === "not_found") {
      return { status: "error", retry: detailed.retry };
    }
    return detailed;
  }, [detailed]);
}
