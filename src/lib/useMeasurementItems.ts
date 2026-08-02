"use client";

import type { MeasurementItem } from "@/lib/measurementItem";
import { useResource, type ResourceState } from "@/lib/useResource";

function selectMeasurementItems(body: unknown): MeasurementItem[] {
  const data = body as { measurementItems?: MeasurementItem[] } | null;
  return (data?.measurementItems ?? []).filter(
    (item) => item.measurementItemId,
  );
}

export function useMeasurementItems(): ResourceState<MeasurementItem[]> {
  return useResource("/api/fitness/measurement-items", selectMeasurementItems);
}
