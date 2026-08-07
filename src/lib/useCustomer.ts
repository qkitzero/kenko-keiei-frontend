"use client";

import type { Customer } from "@/lib/customer";
import { useResource, type ResourceState } from "@/lib/useResource";

function selectCustomer(body: unknown): Customer | null {
  const data = body as { customer?: Customer } | null;
  return data?.customer?.customerId ? data.customer : null;
}

export function useCustomer(
  customerId: string,
): ResourceState<Customer | null> {
  return useResource(`/api/fitness/customer/${customerId}`, selectCustomer);
}
