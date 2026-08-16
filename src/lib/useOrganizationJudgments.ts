"use client";

import type { OrganizationJudgment } from "@/lib/organizationReport";
import {
  useDetailedResource,
  type DetailedResourceState,
} from "@/lib/useResource";

function selectJudgments(body: unknown): OrganizationJudgment[] {
  const data = body as { judgments?: OrganizationJudgment[] } | null;
  return (data?.judgments ?? []).filter((judgment) => judgment.customerId);
}

export function useOrganizationJudgments(
  organizationId: string,
  includeInactive: boolean,
): DetailedResourceState<OrganizationJudgment[]> {
  const query = includeInactive ? "?includeInactive=true" : "";
  return useDetailedResource(
    `/api/fitness/organization/${organizationId}/judgments${query}`,
    selectJudgments,
  );
}
