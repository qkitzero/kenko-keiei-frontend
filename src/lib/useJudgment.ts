"use client";

import type { Judgment } from "@/lib/judgment";
import { useResource, type ResourceState } from "@/lib/useResource";

export function judgmentUrl(measurementId: string): string {
  return `/api/fitness/measurement/${measurementId}/judgment`;
}

export function selectJudgment(body: unknown): Judgment | null {
  const data = body as { judgment?: Judgment } | null;
  return data?.judgment?.measurementId ? data.judgment : null;
}

export function useJudgment(
  measurementId: string,
): ResourceState<Judgment | null> {
  return useResource(judgmentUrl(measurementId), selectJudgment);
}
