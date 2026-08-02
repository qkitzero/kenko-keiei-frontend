"use client";

import type { Measurement } from "@/lib/measurement";
import { useResource, type ResourceState } from "@/lib/useResource";

function selectMeasurements(body: unknown): Measurement[] {
  const data = body as { measurements?: Measurement[] } | null;
  return (data?.measurements ?? []).filter(
    (measurement) => measurement.measurementId,
  );
}

export function useMeasurements(
  customerId: string,
): ResourceState<Measurement[]> {
  return useResource(
    `/api/fitness/customer/${customerId}/measurements`,
    selectMeasurements,
  );
}
