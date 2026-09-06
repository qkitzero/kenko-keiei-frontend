import type { BadgeTone } from "@/components/Badge";
import { genderLabel, type Customer } from "@/lib/customer";
import { dateInputValue, fiscalYear, isValidDate } from "@/lib/date";
import {
  ELEMENTS,
  JUDGMENT_MAX_AGE,
  JUDGMENT_MIN_AGE,
  isWithinStandardAges,
  type Element,
} from "@/lib/judgment";
import type { MeasurementItem } from "@/lib/measurementItem";
import { isSameId } from "@/lib/uuid";
import type { components } from "../../gen/judgment/v1/judgment.schema";

type Schemas = components["schemas"];

export type OrganizationJudgment = Schemas["v1OrganizationJudgment"];

export const RANK_GROUPS = [
  { key: "attention", label: "注意（D・E）", tone: "danger" },
  { key: "typical", label: "年代相応（C）", tone: "muted" },
  { key: "good", label: "良い（A・B）", tone: "success" },
] as const satisfies readonly { key: string; label: string; tone: BadgeTone }[];

export type RankGroup = (typeof RANK_GROUPS)[number]["key"];

export type RankGroupCounts = [number, number, number];

const RANK_GROUP_BY_RANK: Record<string, RankGroup> = {
  RANK_A: "good",
  RANK_B: "good",
  RANK_C: "typical",
  RANK_D: "attention",
  RANK_E: "attention",
};

export function rankGroup(rank: string | undefined): RankGroup | null {
  if (!rank) return null;
  return RANK_GROUP_BY_RANK[rank] ?? null;
}

const RANK_GROUP_INDEX = new Map<RankGroup, number>(
  RANK_GROUPS.map((entry, index) => [entry.key, index]),
);

export function countRankGroups(groups: RankGroup[]): RankGroupCounts {
  const counts: RankGroupCounts = [0, 0, 0];
  for (const group of groups) {
    const index = RANK_GROUP_INDEX.get(group);
    if (index !== undefined) counts[index] += 1;
  }
  return counts;
}

const COLLATOR = new Intl.Collator("ja");

export type PreparedJudgments = {
  judgments: OrganizationJudgment[];
  draftCount: number;
  undatedCount: number;
};

export function prepareJudgments(
  all: OrganizationJudgment[],
  customers: Customer[],
): PreparedJudgments {
  const known = new Set(
    customers.map(
      (customer) => customer.customerId?.trim().toLowerCase() ?? "",
    ),
  );
  const scoped = all.filter((judgment) =>
    known.has(judgment.customerId?.trim().toLowerCase() ?? ""),
  );

  const confirmed = scoped.filter((judgment) => judgment.isDraft !== true);
  const dated = confirmed.filter((judgment) =>
    isValidDate(judgment.measuredOn),
  );

  return {
    judgments: dated,
    draftCount: scoped.length - confirmed.length,
    undatedCount: confirmed.length - dated.length,
  };
}

export function reportCustomers(
  customers: Customer[],
  organizationId: string,
): Customer[] {
  return customers.filter((customer) =>
    isSameId(customer.organizationId, organizationId),
  );
}

export function isActive(customer: Customer): boolean {
  return customer.isActive !== false;
}

export type ReportRow = {
  key: string;
  customer: Customer;
  judgment: OrganizationJudgment | null;
};

function sortName(customer: Customer): string {
  return customer.nameKana?.trim() || customer.name?.trim() || "";
}

export function reportRows(
  customers: Customer[],
  judgments: OrganizationJudgment[],
): ReportRow[] {
  const byCustomer = new Map<string, OrganizationJudgment[]>();
  for (const judgment of judgments) {
    const customerId = judgment.customerId?.trim().toLowerCase() ?? "";
    const listed = byCustomer.get(customerId);
    if (listed) listed.push(judgment);
    else byCustomer.set(customerId, [judgment]);
  }

  const ordered = [...customers].sort((left, right) => {
    const byName = COLLATOR.compare(sortName(left), sortName(right));
    if (byName !== 0) return byName;
    return (left.customerId ?? "").localeCompare(right.customerId ?? "");
  });

  const rows: ReportRow[] = [];
  for (const customer of ordered) {
    const customerId = customer.customerId ?? "";
    const measured = [
      ...(byCustomer.get(customerId.trim().toLowerCase()) ?? []),
    ].sort(compareByMeasuredOn);

    if (measured.length === 0) {
      rows.push({ key: customerId, customer, judgment: null });
      continue;
    }

    measured.forEach((judgment, index) => {
      rows.push({
        key: `${customerId}:${index}:${judgment.measurementId ?? ""}`,
        customer,
        judgment,
      });
    });
  }

  return rows;
}

function compareByMeasuredOn(
  left: OrganizationJudgment,
  right: OrganizationJudgment,
): number {
  const leftDate = dateInputValue(left.measuredOn);
  const rightDate = dateInputValue(right.measuredOn);
  if (leftDate !== rightDate) return leftDate < rightDate ? -1 : 1;
  return (left.measurementId ?? "").localeCompare(right.measurementId ?? "");
}

export function judgedColumns(
  judgments: OrganizationJudgment[],
  items: MeasurementItem[],
): MeasurementItem[] {
  const judged = new Set<string>();
  for (const judgment of judgments) {
    for (const evaluation of judgment.itemEvaluations ?? []) {
      const itemId = evaluation.measurementItemId?.trim().toLowerCase();
      if (itemId) judged.add(itemId);
    }
  }

  return items.filter((item) =>
    judged.has(item.measurementItemId?.trim().toLowerCase() ?? ""),
  );
}

export function unknownItemCount(
  judgments: OrganizationJudgment[],
  items: MeasurementItem[],
): number {
  const known = new Set(
    items.map((item) => item.measurementItemId?.trim().toLowerCase() ?? ""),
  );

  let count = 0;
  for (const judgment of judgments) {
    for (const evaluation of judgment.itemEvaluations ?? []) {
      const itemId = evaluation.measurementItemId?.trim().toLowerCase() ?? "";
      if (!known.has(itemId)) count += 1;
    }
  }
  return count;
}

export function rankOf(
  judgment: OrganizationJudgment,
  item: MeasurementItem,
): string | null {
  const evaluation = (judgment.itemEvaluations ?? []).find((candidate) =>
    isSameId(candidate.measurementItemId, item.measurementItemId),
  );
  return evaluation?.rank ?? null;
}

export function hasEvaluations(judgment: OrganizationJudgment): boolean {
  return (
    (judgment.itemEvaluations ?? []).length > 0 ||
    (judgment.elementEvaluations ?? []).length > 0
  );
}

export function emptyJudgmentNote(
  customer: Customer,
  judgment: OrganizationJudgment,
): string {
  const gender = customer.gender;
  if (gender !== "GENDER_MALE" && gender !== "GENDER_FEMALE") {
    return genderLabel(gender)
      ? "基準値の対象外のため判定できません"
      : "性別が未登録のため判定できません";
  }

  const age = judgment.ageAtMeasurement;
  if (typeof age === "number") {
    if (age < JUDGMENT_MIN_AGE) {
      return `${JUDGMENT_MIN_AGE}歳未満のため判定できません`;
    }
    if (age > JUDGMENT_MAX_AGE) {
      return `${JUDGMENT_MAX_AGE + 1}歳以上のため判定できません`;
    }
  }

  return "判定できる項目の測定がありません";
}

export type ElementDistribution = {
  element: Element;
  counts: RankGroupCounts;
};

export type FiscalSummary = {
  fiscalYear: number;
  measuredCount: number;
  judgedCount: number;
  motorAgeDifference: number | null;
  motorAgeCount: number;
  motorAgeOutsideStandardCount: number;
  attentionCount: number;
  distributions: ElementDistribution[];
};

export function supersedes(
  current: OrganizationJudgment,
  candidate: OrganizationJudgment,
): boolean {
  const currentJudged = hasEvaluations(current);
  const candidateJudged = hasEvaluations(candidate);
  if (currentJudged !== candidateJudged) return candidateJudged;
  return compareByMeasuredOn(current, candidate) < 0;
}

function representatives(
  judgments: OrganizationJudgment[],
): Map<number, OrganizationJudgment[]> {
  const latest = new Map<string, OrganizationJudgment>();

  for (const judgment of judgments) {
    const year = fiscalYear(judgment.measuredOn);
    if (year === null) continue;

    const key = `${year}:${judgment.customerId?.trim().toLowerCase() ?? ""}`;
    const current = latest.get(key);
    if (!current || supersedes(current, judgment)) latest.set(key, judgment);
  }

  const byYear = new Map<number, OrganizationJudgment[]>();
  for (const judgment of latest.values()) {
    const year = fiscalYear(judgment.measuredOn);
    if (year === null) continue;
    const listed = byYear.get(year);
    if (listed) listed.push(judgment);
    else byYear.set(year, [judgment]);
  }
  return byYear;
}

function distributionOf(
  judgments: OrganizationJudgment[],
  element: Element,
): RankGroupCounts {
  const groups = judgments
    .map((judgment) =>
      rankGroup(
        (judgment.elementEvaluations ?? []).find(
          (candidate) => candidate.element === element,
        )?.rank,
      ),
    )
    .filter((group): group is RankGroup => group !== null);

  return countRankGroups(groups);
}

function needsAttention(judgment: OrganizationJudgment): boolean {
  return (judgment.elementEvaluations ?? []).some(
    (evaluation) => rankGroup(evaluation.rank) === "attention",
  );
}

function motorAgeDifferenceOf(judgments: OrganizationJudgment[]): {
  difference: number | null;
  count: number;
  outsideStandardCount: number;
} {
  const differences: number[] = [];
  let outsideStandardCount = 0;
  for (const judgment of judgments) {
    const motorAge = judgment.motorAge;
    const age = judgment.ageAtMeasurement;
    if (typeof motorAge !== "number" || typeof age !== "number") continue;
    if (!isWithinStandardAges(age)) {
      outsideStandardCount += 1;
      continue;
    }
    differences.push(motorAge - age);
  }
  if (differences.length === 0) {
    return { difference: null, count: 0, outsideStandardCount };
  }

  const total = differences.reduce((sum, value) => sum + value, 0);
  return {
    difference: total / differences.length,
    count: differences.length,
    outsideStandardCount,
  };
}

export function fiscalSummaries(
  judgments: OrganizationJudgment[],
): FiscalSummary[] {
  const byYear = representatives(judgments);

  return [...byYear.entries()]
    .sort(([left], [right]) => left - right)
    .map(([year, yearly]) => {
      const motorAge = motorAgeDifferenceOf(yearly);
      return {
        fiscalYear: year,
        measuredCount: yearly.length,
        judgedCount: yearly.filter(hasEvaluations).length,
        motorAgeDifference: motorAge.difference,
        motorAgeCount: motorAge.count,
        motorAgeOutsideStandardCount: motorAge.outsideStandardCount,
        attentionCount: yearly.filter(needsAttention).length,
        distributions: ELEMENTS.map((element) => ({
          element,
          counts: distributionOf(yearly, element),
        })),
      };
    });
}

export function summaryOf(
  summaries: FiscalSummary[],
  year: number,
): FiscalSummary | null {
  return summaries.find((summary) => summary.fiscalYear === year) ?? null;
}

export function attendanceRate(
  measured: number,
  target: number,
): number | null {
  if (target <= 0) return null;
  if (measured <= 0) return 0;
  if (measured >= target) return 100;
  return Math.min(99, Math.max(1, Math.round((measured / target) * 100)));
}

export function formatSigned(value: number, digits: number): string {
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  return `${sign}${Math.abs(rounded).toFixed(digits)}`;
}

export function distributionScale(summaries: FiscalSummary[]): number {
  let max = 0;
  for (const summary of summaries) {
    for (const { counts } of summary.distributions) {
      const [attention, typical, good] = counts;
      max = Math.max(max, attention + typical / 2, good + typical / 2);
    }
  }
  return max;
}

export function measuredPeriod(judgments: OrganizationJudgment[]): string {
  const dates = judgments
    .map((judgment) => dateInputValue(judgment.measuredOn))
    .filter(Boolean)
    .sort();
  if (dates.length === 0) return "";

  const first = dates[0].replaceAll("-", "/");
  const last = dates[dates.length - 1].replaceAll("-", "/");
  return first === last ? first : `${first} 〜 ${last}`;
}

export function latestMeasuredOn(judgments: OrganizationJudgment[]): string {
  const dates = judgments
    .map((judgment) => dateInputValue(judgment.measuredOn))
    .filter(Boolean)
    .sort();
  return dates.at(-1) ?? "";
}
