import { dateInputValue, isValidDate } from "@/lib/date";
import {
  ELEMENTS,
  elementEvaluationsByElement,
  elementLabel,
  formatZScore,
  type Judgment,
} from "@/lib/judgment";
import {
  bodyComposition,
  formatEntryValues,
  formatMeasurementNumber,
  sidesOf,
  type Measurement,
  type MeasurementEntry,
  type MeasurementValue,
} from "@/lib/measurement";
import {
  CATEGORY_MOTOR_FUNCTION,
  pairedLabels,
  trialIndexes,
  unitLabel,
  type MeasurementItem,
} from "@/lib/measurementItem";
import { isSameId } from "@/lib/uuid";

export type Judgments = Map<string, Judgment | null>;

export type TrendPoint = {
  text: string;
  value: number | null;
  rank: string | null;
  unmeasurable: boolean;
};

export type TrendRow = {
  key: string;
  label: string;
  unit: string;
  hasRank: boolean;
  minRange: number | null;
  points: TrendPoint[];
};

export type TrendDelta =
  | { kind: "empty" }
  | { kind: "unchanged" }
  | { kind: "value"; text: string }
  | { kind: "text"; from: string; to: string }
  | { kind: "rank"; from: string; to: string };

const EMPTY_POINT: TrendPoint = {
  text: "",
  value: null,
  rank: null,
  unmeasurable: false,
};

const UNMEASURABLE_POINT: TrendPoint = {
  text: "測定不可",
  value: null,
  rank: null,
  unmeasurable: true,
};

const Z_SCORE_MIN_RANGE = 1;

const TEXT_DELTA_MAX_LENGTH = 12;

export const TREND_LIMITS = [5, 0] as const;

export type TrendLimit = (typeof TREND_LIMITS)[number];

export const DEFAULT_TREND_LIMIT: TrendLimit = 5;

export function toTrendLimit(value: string | null): TrendLimit {
  if (value === null || value.trim() === "") return DEFAULT_TREND_LIMIT;

  const parsed = Number(value);
  return (TREND_LIMITS as readonly number[]).includes(parsed)
    ? (parsed as TrendLimit)
    : DEFAULT_TREND_LIMIT;
}

export type PreparedTrend = {
  measurements: Measurement[];
  draftCount: number;
  undatedCount: number;
};

function compareByMeasuredOn(left: Measurement, right: Measurement): number {
  const leftDate = dateInputValue(left.measuredOn);
  const rightDate = dateInputValue(right.measuredOn);
  if (leftDate !== rightDate) return leftDate < rightDate ? -1 : 1;
  return (left.measurementId ?? "").localeCompare(right.measurementId ?? "");
}

export function prepareTrend(all: Measurement[]): PreparedTrend {
  const confirmed = all.filter((measurement) => measurement.isDraft !== true);
  const dated = confirmed.filter((measurement) =>
    isValidDate(measurement.measuredOn),
  );

  return {
    measurements: [...dated].sort(compareByMeasuredOn),
    draftCount: all.length - confirmed.length,
    undatedCount: confirmed.length - dated.length,
  };
}

export function limitTrend(
  measurements: Measurement[],
  limit: TrendLimit,
): Measurement[] {
  if (limit <= 0 || measurements.length <= limit) return measurements;
  return measurements.slice(measurements.length - limit);
}

function judgmentOf(
  judgments: Judgments,
  measurement: Measurement,
): Judgment | null {
  return judgments.get(measurement.measurementId ?? "") ?? null;
}

function entryOf(
  measurement: Measurement,
  item: MeasurementItem,
): MeasurementEntry | undefined {
  return (measurement.entries ?? []).find((entry) =>
    isSameId(entry.measurementItemId, item.measurementItemId),
  );
}

function configuredCells(
  entry: MeasurementEntry,
  item: MeasurementItem,
): MeasurementValue[] {
  const cells: MeasurementValue[] = [];
  for (const trialIndex of trialIndexes(item)) {
    for (const side of sidesOf(item)) {
      const value = (entry.values ?? []).find(
        (candidate) =>
          candidate.trialIndex === trialIndex && candidate.side === side,
      );
      if (value) cells.push(value);
    }
  }
  return cells;
}

function hasSingleCell(item: MeasurementItem): boolean {
  return trialIndexes(item).length === 1 && sidesOf(item).length === 1;
}

function numberOrNull(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isEmptyPoint(point: TrendPoint): boolean {
  return point.text === "" && point.rank === null;
}

function rowKey(item: MeasurementItem): string {
  return item.measurementItemId ?? item.code ?? item.name ?? "";
}

export function hasPointValue(point: TrendPoint): boolean {
  return !point.unmeasurable && !isEmptyPoint(point);
}

export function hasAnyValue(rows: TrendRow[]): boolean {
  return rows.some((row) => row.points.some(hasPointValue));
}

export function trendDelta(row: TrendRow): TrendDelta {
  const present = row.points.filter(hasPointValue);
  if (present.length < 2) return { kind: "empty" };

  const first = present[0];
  const last = present[present.length - 1];

  if (first.rank && last.rank && first.rank !== last.rank) {
    return { kind: "rank", from: first.rank, to: last.rank };
  }

  if (first.value !== null && last.value !== null) {
    const difference = last.value - first.value;
    const rounded = Number(difference.toFixed(2));
    if (rounded === 0) return { kind: "unchanged" };

    const sign = rounded > 0 ? "+" : "−";
    return {
      kind: "value",
      text: `${sign}${formatMeasurementNumber(Math.abs(rounded))}`,
    };
  }

  if (first.text === last.text) return { kind: "unchanged" };

  const tooLong = [first.text, last.text].some(
    (text) => [...text].length > TEXT_DELTA_MAX_LENGTH,
  );
  return tooLong
    ? { kind: "empty" }
    : { kind: "text", from: first.text, to: last.text };
}

export type MotorAgeTrend = {
  motorAges: (number | null)[];
  ages: (number | null)[];
  differences: (number | null)[];
  measuredCount: number;
};

export function motorAgeTrend(
  measurements: Measurement[],
  judgments: Judgments,
): MotorAgeTrend {
  const motorAges = measurements.map((measurement) =>
    numberOrNull(judgmentOf(judgments, measurement)?.motorAge),
  );
  const ages = measurements.map((measurement) =>
    numberOrNull(measurement.ageAtMeasurement),
  );
  const differences = motorAges.map((motorAge, index) => {
    const age = ages[index];
    return motorAge === null || age === null ? null : motorAge - age;
  });

  return {
    motorAges,
    ages,
    differences,
    measuredCount: motorAges.filter((value) => value !== null).length,
  };
}

export function elementRows(
  measurements: Measurement[],
  judgments: Judgments,
): TrendRow[] {
  const byMeasurement = measurements.map((measurement) => {
    const judgment = judgmentOf(judgments, measurement);
    return judgment ? elementEvaluationsByElement(judgment) : null;
  });

  return ELEMENTS.map((element) => ({
    key: element,
    label: elementLabel(element),
    unit: "",
    hasRank: true,
    minRange: Z_SCORE_MIN_RANGE,
    points: byMeasurement.map((byElement) => {
      const evaluation = byElement?.get(element);
      if (!evaluation) return EMPTY_POINT;
      return {
        text: formatZScore(evaluation.zScore),
        value: numberOrNull(evaluation.zScore),
        rank: evaluation.rank ?? null,
        unmeasurable: false,
      };
    }),
  }));
}

function evaluationPoint(
  measurement: Measurement,
  judgments: Judgments,
  item: MeasurementItem,
): TrendPoint | null {
  const judgment = judgmentOf(judgments, measurement);
  const evaluation = (judgment?.itemEvaluations ?? []).find((candidate) =>
    isSameId(candidate.measurementItemId, item.measurementItemId),
  );
  if (!evaluation) return null;

  return {
    text: formatMeasurementNumber(evaluation.value),
    value: numberOrNull(evaluation.value),
    rank: evaluation.rank ?? null,
    unmeasurable: false,
  };
}

function recordedPoint(
  measurement: Measurement,
  item: MeasurementItem,
): TrendPoint {
  const entry = entryOf(measurement, item);
  if (!entry) return EMPTY_POINT;
  if (entry.unmeasurable) return UNMEASURABLE_POINT;

  const text = formatEntryValues(entry, item);
  if (!text) return EMPTY_POINT;

  const value =
    hasSingleCell(item) && item.valueType === "VALUE_TYPE_NUMERIC"
      ? numberOrNull(configuredCells(entry, item)[0]?.value)
      : null;

  return { text, value, rank: null, unmeasurable: false };
}

export function judgedItemRows(
  measurements: Measurement[],
  judgments: Judgments,
  items: MeasurementItem[],
): TrendRow[] {
  const rows: TrendRow[] = [];

  for (const item of items) {
    if (item.category !== CATEGORY_MOTOR_FUNCTION) continue;

    const points = measurements.map((measurement) => {
      if (!judgments.has(measurement.measurementId ?? "")) return EMPTY_POINT;
      return (
        evaluationPoint(measurement, judgments, item) ??
        recordedPoint(measurement, item)
      );
    });
    if (points.every(isEmptyPoint)) continue;

    rows.push({
      key: rowKey(item),
      label: item.name ?? "",
      unit: unitLabel(item.unit),
      hasRank: points.some((point) => point.rank !== null),
      minRange: null,
      points,
    });
  }

  return rows;
}

function pairedRows(
  measurements: Measurement[],
  item: MeasurementItem,
): TrendRow[] {
  const labels = pairedLabels(item);
  const unit = unitLabel(item.unit);

  return labels.map((label, index) => ({
    key: `${rowKey(item)}-${index}`,
    label: `${item.name ?? ""}（${label}）`,
    unit,
    hasRank: false,
    minRange: null,
    points: measurements.map((measurement) => {
      const entry = entryOf(measurement, item);
      if (!entry) return EMPTY_POINT;
      if (entry.unmeasurable) return UNMEASURABLE_POINT;

      const cell = configuredCells(entry, item)[0];
      const value = numberOrNull(
        index === 0 ? cell?.value : cell?.valueSecondary,
      );
      return {
        text: formatMeasurementNumber(value ?? undefined),
        value,
        rank: null,
        unmeasurable: false,
      };
    }),
  }));
}

const DERIVED_LABELS = {
  bmi: "BMI（算出値）",
  idealWeight: "適正体重（算出値）",
} as const;

function derivedRow(
  key: string,
  label: string,
  unit: string,
  values: (number | null)[],
): TrendRow {
  return {
    key,
    label,
    unit,
    hasRank: false,
    minRange: null,
    points: values.map((value) =>
      value === null
        ? EMPTY_POINT
        : {
            text: formatMeasurementNumber(value),
            value,
            rank: null,
            unmeasurable: false,
          },
    ),
  };
}

function derivedRows(
  measurements: Measurement[],
  items: MeasurementItem[],
): TrendRow[] {
  const compositions = measurements.map((measurement) =>
    bodyComposition(measurement, items),
  );
  if (compositions.every((composition) => composition === null)) return [];

  return [
    derivedRow(
      "derived-bmi",
      DERIVED_LABELS.bmi,
      "",
      compositions.map((composition) => composition?.bmi ?? null),
    ),
    derivedRow(
      "derived-ideal-weight",
      DERIVED_LABELS.idealWeight,
      unitLabel("UNIT_KG"),
      compositions.map((composition) => composition?.idealWeight ?? null),
    ),
  ];
}

export function recordedRows(
  measurements: Measurement[],
  items: MeasurementItem[],
): TrendRow[] {
  const rows: TrendRow[] = [];

  for (const item of items) {
    if (item.category === CATEGORY_MOTOR_FUNCTION) continue;

    if (item.valueType === "VALUE_TYPE_PAIRED" && hasSingleCell(item)) {
      for (const row of pairedRows(measurements, item)) {
        if (!row.points.every(isEmptyPoint)) rows.push(row);
      }
      continue;
    }

    const points = measurements.map((measurement) =>
      recordedPoint(measurement, item),
    );
    if (points.every(isEmptyPoint)) continue;

    rows.push({
      key: rowKey(item),
      label: item.name ?? "",
      unit: unitLabel(item.unit),
      hasRank: false,
      minRange: null,
      points,
    });
  }

  return [...rows, ...derivedRows(measurements, items)];
}
