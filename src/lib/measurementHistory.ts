import { dateLabel } from "@/lib/date";
import {
  ELEMENTS,
  elementEvaluationsByElement,
  motorAgeDifference,
  signedAgeLabel,
  type Judgment,
} from "@/lib/judgment";
import type { Measurement } from "@/lib/measurement";
import {
  countRankGroups,
  rankGroup,
  type RankGroup,
  type RankGroupCounts,
} from "@/lib/organizationReport";
import { prepareTrend } from "@/lib/trend";

export function lastMeasuredLabel(measurements: Measurement[]): string {
  const prepared = prepareTrend(measurements);
  const latest = prepared.measurements.at(-1);
  if (latest) return dateLabel(latest.measuredOn);
  return prepared.draftCount + prepared.undatedCount > 0
    ? "確定した測定なし"
    : "";
}

export function motorAgeLabel(
  judgment: Judgment | null | undefined,
  measurement: Measurement,
): string {
  const motorAge = judgment?.motorAge;
  if (!judgment || typeof motorAge !== "number") return "";

  const difference = motorAgeDifference(judgment, measurement);
  return difference === null
    ? `${motorAge}歳`
    : `${motorAge}歳（${signedAgeLabel(difference)}）`;
}

export function elementRankCounts(
  judgment: Judgment | null | undefined,
): RankGroupCounts | null {
  if (!judgment) return null;

  const byElement = elementEvaluationsByElement(judgment);
  const groups = ELEMENTS.map((element) =>
    rankGroup(byElement.get(element)?.rank),
  ).filter((group): group is RankGroup => group !== null);
  if (groups.length === 0) return null;

  return countRankGroups(groups);
}
