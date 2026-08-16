"use client";

import type { Organization } from "@/lib/organization";
import {
  useDetailedResource,
  type DetailedResourceState,
} from "@/lib/useResource";

function selectOrganization(body: unknown): Organization | null {
  const data = body as { organization?: Organization } | null;
  return data?.organization?.organizationId ? data.organization : null;
}

export function useOrganization(
  organizationId: string,
): DetailedResourceState<Organization | null> {
  return useDetailedResource(
    `/api/fitness/organization/${organizationId}`,
    selectOrganization,
  );
}
