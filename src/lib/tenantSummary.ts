import type { Customer } from "@/lib/customer";
import { dateInputValue, fiscalYear } from "@/lib/date";
import type { Organization } from "@/lib/organization";
import {
  isActive,
  rankGroup,
  supersedes,
  type OrganizationJudgment,
} from "@/lib/organizationReport";
import { normalizeId } from "@/lib/uuid";

export const SUMMARY_LIST_LIMIT = 10;

export const SUMMARY_UPSTREAM_TIMEOUT_MS = 15_000;

export const SUMMARY_REQUEST_TIMEOUT_MS = 40_000;

export type SummaryMeasurement = {
  measurementId: string;
  customerId: string;
  customerName: string;
  organizationName: string;
  measuredOn: string;
};

export type CustomerMeasurementStatus = {
  covered: boolean;
  measuredThisYear: boolean;
  hasAttention: boolean;
  lastMeasuredOn: string;
};

export type CustomerStatuses = Record<string, CustomerMeasurementStatus>;

export type TenantSummaryCounts = {
  customers: number;
  drafts: number;
  notMeasured: number;
  attention: number;
  uncovered: number;
  undated: number;
};

export type TenantSummary = {
  counts: TenantSummaryCounts;
  drafts: SummaryMeasurement[];
  recent: SummaryMeasurement[];
  statuses: CustomerStatuses;
};

const UNKNOWN_STATUS: CustomerMeasurementStatus = {
  covered: false,
  measuredThisYear: false,
  hasAttention: false,
  lastMeasuredOn: "",
};

export const EMPTY_TENANT_SUMMARY: TenantSummary = {
  counts: {
    customers: 0,
    drafts: 0,
    notMeasured: 0,
    attention: 0,
    uncovered: 0,
    undated: 0,
  },
  drafts: [],
  recent: [],
  statuses: {},
};

export function customerStatus(
  statuses: CustomerStatuses,
  customerId: string | undefined,
): CustomerMeasurementStatus {
  return statuses[normalizeId(customerId)] ?? UNKNOWN_STATUS;
}

function measuredOnOf(judgment: OrganizationJudgment): string {
  return dateInputValue(judgment.measuredOn);
}

function isConfirmed(judgment: OrganizationJudgment): boolean {
  return judgment.isDraft !== true;
}

function hasAttentionRank(judgment: OrganizationJudgment): boolean {
  return (judgment.elementEvaluations ?? []).some(
    (evaluation) => rankGroup(evaluation.rank) === "attention",
  );
}

function representative(
  judgments: OrganizationJudgment[],
): OrganizationJudgment | null {
  let current: OrganizationJudgment | null = null;
  for (const judgment of judgments) {
    if (!current || supersedes(current, judgment)) current = judgment;
  }
  return current;
}

function newestFirst(rows: SummaryMeasurement[]): SummaryMeasurement[] {
  return [...rows].sort((left, right) => {
    if (left.measuredOn !== right.measuredOn) {
      return left.measuredOn < right.measuredOn ? 1 : -1;
    }
    return left.measurementId.localeCompare(right.measurementId);
  });
}

export type TenantSummaryInput = {
  fiscalYear: number;
  customers: Customer[];
  organizations: Organization[];
  judgments: OrganizationJudgment[];
};

export function buildTenantSummary({
  fiscalYear: year,
  customers,
  organizations,
  judgments,
}: TenantSummaryInput): TenantSummary {
  const organizationNames = new Map<string, string>();
  for (const organization of organizations) {
    organizationNames.set(
      normalizeId(organization.organizationId),
      organization.name ?? "",
    );
  }

  const grouped = new Map<string, OrganizationJudgment[]>();
  for (const judgment of judgments) {
    const key = normalizeId(judgment.customerId);
    const listed = grouped.get(key);
    if (listed) listed.push(judgment);
    else grouped.set(key, [judgment]);
  }

  const counts: TenantSummaryCounts = {
    customers: 0,
    drafts: 0,
    notMeasured: 0,
    attention: 0,
    uncovered: 0,
    undated: 0,
  };
  const statuses: CustomerStatuses = {};
  const drafts: SummaryMeasurement[] = [];
  const recent: SummaryMeasurement[] = [];

  for (const customer of customers) {
    const organizationKey = normalizeId(customer.organizationId);
    const covered = organizationNames.has(organizationKey);
    const owned = grouped.get(normalizeId(customer.customerId)) ?? [];

    const confirmed = owned.filter(
      (judgment) => isConfirmed(judgment) && measuredOnOf(judgment),
    );
    const undated = owned.filter(
      (judgment) => isConfirmed(judgment) && !measuredOnOf(judgment),
    ).length;
    const thisYear = confirmed.filter(
      (judgment) => fiscalYear(judgment.measuredOn) === year,
    );
    const latest = representative(thisYear);

    const status: CustomerMeasurementStatus = {
      covered,
      measuredThisYear: thisYear.length > 0,
      hasAttention: latest ? hasAttentionRank(latest) : false,
      lastMeasuredOn: confirmed.reduce((last, judgment) => {
        const measuredOn = measuredOnOf(judgment);
        return measuredOn > last ? measuredOn : last;
      }, ""),
    };
    statuses[normalizeId(customer.customerId)] = status;

    if (!isActive(customer)) continue;

    counts.customers += 1;
    counts.undated += undated;
    if (!covered) {
      counts.uncovered += 1;
    } else {
      if (!status.measuredThisYear) counts.notMeasured += 1;
      if (status.hasAttention) counts.attention += 1;
    }

    const organizationName = organizationNames.get(organizationKey) ?? "";
    for (const judgment of owned) {
      const measurementId = judgment.measurementId ?? "";
      if (!measurementId) continue;

      const row: SummaryMeasurement = {
        measurementId,
        customerId: customer.customerId ?? "",
        customerName: customer.name ?? "",
        organizationName,
        measuredOn: measuredOnOf(judgment),
      };

      if (!isConfirmed(judgment)) {
        drafts.push(row);
        counts.drafts += 1;
      } else if (row.measuredOn) {
        recent.push(row);
      }
    }
  }

  return {
    counts,
    drafts: newestFirst(drafts).slice(0, SUMMARY_LIST_LIMIT),
    recent: newestFirst(recent).slice(0, SUMMARY_LIST_LIMIT),
    statuses,
  };
}
