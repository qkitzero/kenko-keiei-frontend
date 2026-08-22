"use client";

import {
  EMPTY_TENANT_SUMMARY,
  SUMMARY_REQUEST_TIMEOUT_MS,
  type TenantSummary,
} from "@/lib/tenantSummary";
import { useCallback, useEffect, useState } from "react";

export type TenantSummaryState =
  | { status: "loading" }
  | { status: "ok"; summary: TenantSummary }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error"; retry: () => void };

type FetchResult =
  | { status: "ok"; summary: TenantSummary }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error" };

function selectSummary(body: unknown): TenantSummary | null {
  const data = body as Partial<TenantSummary> | null;
  if (!data?.counts || !data.statuses) return null;
  return {
    counts: data.counts,
    drafts: data.drafts ?? [],
    recent: data.recent ?? [],
    statuses: data.statuses,
  };
}

async function loadSummary(
  tenantId: string,
  fiscalYear: number,
  signal: AbortSignal,
): Promise<FetchResult> {
  const res = await fetch(
    `/api/fitness/tenant/${encodeURIComponent(tenantId)}/summary?fiscalYear=${fiscalYear}`,
    { signal },
  );
  if (res.status === 401) return { status: "unauthenticated" };
  if (res.status === 403) return { status: "forbidden" };
  if (!res.ok) return { status: "error" };

  const summary = selectSummary(await res.json());
  return summary ? { status: "ok", summary } : { status: "error" };
}

const NO_TENANT: TenantSummaryState = {
  status: "ok",
  summary: EMPTY_TENANT_SUMMARY,
};

export function useTenantSummary(
  tenantId: string,
  fiscalYear: number,
): TenantSummaryState {
  const [loaded, setLoaded] = useState<{
    key: string;
    result: FetchResult;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  const requestKey = `${reloadKey}:${tenantId}:${fiscalYear}`;

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      SUMMARY_REQUEST_TIMEOUT_MS,
    );

    (async () => {
      const result = await loadSummary(
        tenantId,
        fiscalYear,
        controller.signal,
      ).catch(() => ({ status: "error" }) as const);
      if (!active) return;
      setLoaded({ key: requestKey, result });
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [tenantId, fiscalYear, requestKey]);

  if (!tenantId) return NO_TENANT;
  if (loaded?.key !== requestKey) return { status: "loading" };
  if (loaded.result.status === "error") return { status: "error", retry };
  return loaded.result;
}
