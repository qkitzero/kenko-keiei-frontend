import { TEXT_MAX_LENGTH, hasControlChar, isTooLong } from "@/lib/text";
import { isValidUuid } from "@/lib/uuid";
import type { components } from "../../gen/organization/v1/organization.schema";

type Schemas = components["schemas"];

export type Organization = Schemas["v1Organization"];

export type OrganizationOptions =
  | { status: "loading" }
  | { status: "ok"; organizations: Organization[] }
  | { status: "error"; retry: () => void };

export type NameResult =
  { ok: true; name: string } | { ok: false; error: string };

export function buildOrganizationName(value: string): NameResult {
  const name = value.trim();
  if (!name) return { ok: false, error: "組織名を入力してください" };
  if (isTooLong(name)) {
    return {
      ok: false,
      error: `組織名は${TEXT_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (hasControlChar(name)) {
    return { ok: false, error: "組織名に使用できない文字が含まれています" };
  }
  return { ok: true, name };
}

export function isValidOrganizationId(value: string): boolean {
  return isValidUuid(value);
}

export function organizationName(
  options: OrganizationOptions,
  organizationId: string | undefined,
): string {
  if (!organizationId || options.status !== "ok") return "";
  return (
    options.organizations.find(
      (organization) => organization.organizationId === organizationId,
    )?.name ?? ""
  );
}
