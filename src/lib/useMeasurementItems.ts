"use client";

import type { MeasurementItem } from "@/lib/measurementItem";
import {
  useDetailedResource,
  useResource,
  type DetailedResourceState,
  type ResourceState,
} from "@/lib/useResource";

const MEASUREMENT_ITEMS_URL = "/api/fitness/measurement-items";

function selectMeasurementItems(body: unknown): MeasurementItem[] {
  const data = body as { measurementItems?: MeasurementItem[] } | null;
  return (data?.measurementItems ?? []).filter(
    (item) => item.measurementItemId,
  );
}

export function useMeasurementItems(): ResourceState<MeasurementItem[]> {
  return useResource(MEASUREMENT_ITEMS_URL, selectMeasurementItems);
}

export function useDetailedMeasurementItems(): DetailedResourceState<
  MeasurementItem[]
> {
  return useDetailedResource(MEASUREMENT_ITEMS_URL, selectMeasurementItems);
}
