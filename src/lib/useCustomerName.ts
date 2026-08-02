"use client";

import type { Customer } from "@/lib/customer";
import { useEffect, useState } from "react";

export function useCustomerName(customerId: string): string {
  const [name, setName] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const loaded = await fetch(`/api/fitness/customer/${customerId}`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null);
      if (!active) return;
      const customer = loaded?.customer as Customer | undefined;
      setName(customer?.name ?? "");
    })();
    return () => {
      active = false;
    };
  }, [customerId]);

  return name;
}
