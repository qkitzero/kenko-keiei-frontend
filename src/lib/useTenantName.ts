"use client";

import { useTenants } from "@/context/TenantsContext";

export type TenantNameState =
  | { status: "loading" }
  | { status: "ok"; name: string }
  | { status: "not_member" }
  | { status: "error"; refresh: () => Promise<void> };

export function useTenantName(tenantId: string): TenantNameState {
  const { memberships, loading, error, refreshTenants } = useTenants();

  if (loading) return { status: "loading" };

  const membership = memberships.find(
    (candidate) => candidate.tenant.tenantId === tenantId,
  );
  if (membership) return { status: "ok", name: membership.tenant.name };

  return error
    ? { status: "error", refresh: refreshTenants }
    : { status: "not_member" };
}
