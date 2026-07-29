"use client";

import type { Organization, OrganizationOptions } from "@/lib/organization";
import { useCallback, useEffect, useState } from "react";

type FetchResult =
  { status: "ok"; organizations: Organization[] } | { status: "error" };

async function loadOrganizations(tenantId: string): Promise<FetchResult> {
  const res = await fetch(
    `/api/fitness/organizations?tenantId=${encodeURIComponent(tenantId)}`,
  );
  if (!res.ok) return { status: "error" };
  const data = await res.json();
  const organizations: Organization[] = (data.organizations ?? []).filter(
    (organization: Organization) => organization.organizationId,
  );
  return { status: "ok", organizations };
}

export function useOrganizations(tenantId: string): OrganizationOptions {
  const [loaded, setLoaded] = useState<{
    key: string;
    result: FetchResult;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  const requestKey = `${reloadKey}:${tenantId}`;

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    (async () => {
      const result = await loadOrganizations(tenantId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      setLoaded({ key: requestKey, result });
    })();
    return () => {
      active = false;
    };
  }, [tenantId, requestKey]);

  if (loaded?.key !== requestKey) return { status: "loading" };
  return loaded.result.status === "ok"
    ? loaded.result
    : { status: "error", retry };
}
