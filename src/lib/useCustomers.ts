"use client";

import type { Customer } from "@/lib/customer";
import {
  useDetailedResource,
  type DetailedResourceState,
} from "@/lib/useResource";

function selectCustomers(body: unknown): Customer[] {
  const data = body as { customers?: Customer[] } | null;
  return (data?.customers ?? []).filter((customer) => customer.customerId);
}

export function useCustomers(
  tenantId: string,
  includeInactive: boolean,
): DetailedResourceState<Customer[]> {
  const query = new URLSearchParams({ tenantId });
  if (includeInactive) query.set("includeInactive", "true");
  return useDetailedResource(
    `/api/fitness/customers?${query}`,
    selectCustomers,
  );
}
