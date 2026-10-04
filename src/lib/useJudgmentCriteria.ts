"use client";

import type { JudgmentCriteria } from "@/lib/judgmentCriteria";
import { useResource, type ResourceState } from "@/lib/useResource";

const JUDGMENT_CRITERIA_URL = "/api/fitness/judgment-criteria";

function selectJudgmentCriteria(body: unknown): JudgmentCriteria {
  return (body as JudgmentCriteria | null) ?? {};
}

export function useJudgmentCriteria(): ResourceState<JudgmentCriteria> {
  return useResource(JUDGMENT_CRITERIA_URL, selectJudgmentCriteria);
}

export function loadedCriteria(
  criteria: ResourceState<JudgmentCriteria>,
): JudgmentCriteria | null {
  return criteria.status === "ok" ? criteria.data : null;
}
