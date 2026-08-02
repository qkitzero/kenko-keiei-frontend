"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ResourceState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "unauthenticated" }
  | { status: "error"; retry: () => void };

type FetchResult<T> =
  | { status: "ok"; data: T }
  | { status: "unauthenticated" }
  | { status: "error" };

async function load<T>(
  url: string,
  select: (body: unknown) => T,
): Promise<FetchResult<T>> {
  const res = await fetch(url);
  if (res.status === 401) return { status: "unauthenticated" };
  if (!res.ok) return { status: "error" };
  return { status: "ok", data: select(await res.json()) };
}

export function useResource<T>(
  url: string,
  select: (body: unknown) => T,
): ResourceState<T> {
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

  return useMemo(() => {
    if (loaded?.key !== requestKey) return { status: "loading" };
    if (loaded.result.status === "ok") {
      return { status: "ok", data: loaded.result.data };
    }
    if (loaded.result.status === "unauthenticated") {
      return { status: "unauthenticated" };
    }
    return { status: "error", retry };
  }, [loaded, requestKey, retry]);
}
