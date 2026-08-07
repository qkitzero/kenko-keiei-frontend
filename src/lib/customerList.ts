import type { SortOrder } from "@/components/DataTable";
import type { Customer } from "@/lib/customer";
import { dateInputValue } from "@/lib/date";
import { organizationName, type OrganizationOptions } from "@/lib/organization";
import { matchesSearchText, normalizeSearchText } from "@/lib/search";

export const NO_ORGANIZATION = "none";

export const CUSTOMER_SORT_KEYS = [
  "name",
  "nameKana",
  "organization",
  "birthDate",
] as const;

export type CustomerSortKey = (typeof CUSTOMER_SORT_KEYS)[number];

export type CustomerFilters = {
  q: string;
  organizationId: string;
  sort: CustomerSortKey | "";
  order: SortOrder;
  includeInactive: boolean;
};

const COLLATOR = new Intl.Collator("ja");

export function toCustomerSortKey(value: string): CustomerSortKey | "" {
  return CUSTOMER_SORT_KEYS.includes(value as CustomerSortKey)
    ? (value as CustomerSortKey)
    : "";
}

export function readCustomerFilters(params: URLSearchParams): CustomerFilters {
  return {
    q: params.get("q") ?? "",
    organizationId: params.get("organizationId") ?? "",
    sort: toCustomerSortKey(params.get("sort") ?? ""),
    order: params.get("order") === "desc" ? "desc" : "asc",
    includeInactive: params.get("includeInactive") === "true",
  };
}

export function customerListHref(
  tenantId: string,
  filters: CustomerFilters,
): string {
  const query = new URLSearchParams({ tenantId });
  if (filters.q) query.set("q", filters.q);
  if (filters.organizationId) {
    query.set("organizationId", filters.organizationId);
  }
  if (filters.sort) {
    query.set("sort", filters.sort);
    if (filters.order === "desc") query.set("order", "desc");
  }
  if (filters.includeInactive) query.set("includeInactive", "true");
  return `/customers?${query}`;
}

function isKnownOrganization(
  organizations: OrganizationOptions,
  organizationId: string,
): boolean {
  return (
    organizations.status === "ok" &&
    organizations.organizations.some(
      (organization) => organization.organizationId === organizationId,
    )
  );
}

export function organizationFilterValue(
  filters: CustomerFilters,
  organizations: OrganizationOptions,
): string {
  const organizationId = filters.organizationId;
  if (!organizationId || organizationId === NO_ORGANIZATION) {
    return organizationId;
  }
  if (organizations.status === "loading") return organizationId;
  return isKnownOrganization(organizations, organizationId)
    ? organizationId
    : "";
}

export function canSortByOrganization(
  organizations: OrganizationOptions,
): boolean {
  return organizations.status === "ok";
}

function isUnaffiliated(
  customer: Customer,
  organizations: OrganizationOptions,
): boolean {
  if (!customer.organizationId) return true;
  return (
    organizations.status === "ok" &&
    !isKnownOrganization(organizations, customer.organizationId)
  );
}

export function hasCustomerConditions(filters: CustomerFilters): boolean {
  return Boolean(normalizeSearchText(filters.q) || filters.organizationId);
}

export function filterCustomers(
  customers: Customer[],
  filters: CustomerFilters,
  organizations: OrganizationOptions,
): Customer[] {
  const query = normalizeSearchText(filters.q);
  return customers.filter((customer) => {
    if (filters.organizationId === NO_ORGANIZATION) {
      if (!isUnaffiliated(customer, organizations)) return false;
    } else if (
      filters.organizationId &&
      customer.organizationId !== filters.organizationId
    ) {
      return false;
    }
    return matchesSearchText([customer.name, customer.nameKana], query);
  });
}

function sortValue(
  customer: Customer,
  key: CustomerSortKey,
  organizations: OrganizationOptions,
): string {
  switch (key) {
    case "name":
      return customer.nameKana || customer.name || "";
    case "nameKana":
      return customer.nameKana ?? "";
    case "organization":
      return organizationName(organizations, customer.organizationId);
    case "birthDate":
      return dateInputValue(customer.birthDate);
  }
}

export function sortCustomers(
  customers: Customer[],
  filters: CustomerFilters,
  organizations: OrganizationOptions,
): Customer[] {
  const key = filters.sort;
  if (!key) return customers;

  const direction = filters.order === "desc" ? -1 : 1;
  return [...customers].sort((left, right) => {
    const a = sortValue(left, key, organizations);
    const b = sortValue(right, key, organizations);
    if (!a || !b) return direction * (a ? -1 : b ? 1 : 0);
    return direction * COLLATOR.compare(a, b);
  });
}
