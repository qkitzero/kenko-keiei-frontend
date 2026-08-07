"use client";

import type { Measurement } from "@/lib/measurement";
import { useEffect, useState } from "react";

export type MeasurementLoadResult =
  | { status: "ok"; data: Measurement }
  | { status: "not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export type MeasurementState = { status: "loading" } | MeasurementLoadResult;

export async function loadMeasurement(
  measurementId: string,
): Promise<MeasurementLoadResult> {
  const res = await fetch(`/api/fitness/measurement/${measurementId}`);
  if (!res.ok) {
    if (res.status === 404) return { status: "not_found" };
    if (res.status === 401) return { status: "unauthenticated" };
    return { status: "error" };
  }
  const data = await res.json();
  if (!data.measurement?.measurementId) return { status: "not_found" };
  return { status: "ok", data: data.measurement };
}

export function useMeasurement(measurementId: string): MeasurementState {
  const [loaded, setLoaded] = useState<{
    key: string;
    result: MeasurementLoadResult;
  } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadMeasurement(measurementId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      setLoaded({ key: measurementId, result });
    })();
    return () => {
      active = false;
    };
  }, [measurementId]);

  if (loaded?.key !== measurementId) return { status: "loading" };
  return loaded.result;
}
