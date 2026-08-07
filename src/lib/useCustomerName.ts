"use client";

import { useCustomer } from "@/lib/useCustomer";

export function useCustomerName(customerId: string): string {
  const customer = useCustomer(customerId);
  return customer.status === "ok" ? (customer.data?.name ?? "") : "";
}
