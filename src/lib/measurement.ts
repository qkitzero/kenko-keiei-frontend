import { dateInputValue, isFutureDate, toDateValue } from "@/lib/date";
import {
  CHOICE_MAX_LENGTH,
  isLevelItem,
  isOptionalBilateral,
  levelLabel,
  pairedLabels,
  sideNoneLabel,
  trialCountOf,
  trialIndexes,
  type MeasurementItem,
} from "@/lib/measurementItem";
import {
  TEXT_MAX_LENGTH,
  hasControlChar,
  hasControlCharExceptBreaks,
  isTooLong,
  outOfListLabel,
  toHalfWidthNumber,
} from "@/lib/text";
import { isSameId } from "@/lib/uuid";
import type { components } from "../../gen/measurement/v1/measurement.schema";

type Schemas = components["schemas"];

export type Measurement = Schemas["v1Measurement"];
export type MeasurementEntry = Schemas["v1MeasurementEntry"];
export type MeasurementValue = Schemas["v1MeasurementValue"];
export type Side = Schemas["v1Side"];

export type MeasurementPayload = Omit<
  Schemas["MeasurementServiceCreateMeasurementBody"],
  "measuredBy"
>;

export const MEASUREMENT_VALUE_MAX = 9999.99;

export const SIDES: Side[] = ["SIDE_NONE", "SIDE_LEFT", "SIDE_RIGHT"];

const VALUE_PATTERN = /^\d{1,4}(\.\d{1,2})?$/;

const VALUE_SCALE = 100;

const VALUE_SCALE_SLOP = 1e-9;

const SIDE_LABELS: Record<string, string> = {
  SIDE_LEFT: "左",
  SIDE_RIGHT: "右",
};

function sideLabel(side: string | undefined): string {
  if (!side) return "";
  return SIDE_LABELS[side] ?? "";
}

export function cellValue(
  entry: MeasurementEntry,
  trialIndex: number,
  side: Side,
): MeasurementValue | undefined {
  return (entry.values ?? []).find(
    (candidate) =>
      candidate.trialIndex === trialIndex && candidate.side === side,
  );
}

export function sideHeading(item: MeasurementItem, side: Side): string {
  if (side !== "SIDE_NONE") return sideLabel(side);
  return isOptionalBilateral(item) ? sideNoneLabel(item) : "";
}

export function sidesOf(item: MeasurementItem): Side[] {
  switch (item.sideMode) {
    case "SIDE_MODE_BILATERAL":
      return ["SIDE_LEFT", "SIDE_RIGHT"];
    case "SIDE_MODE_OPTIONAL_BILATERAL":
      return [...SIDES];
    default:
      return ["SIDE_NONE"];
  }
}

export function isValidMeasurementNumber(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < 0 || value > MEASUREMENT_VALUE_MAX) return false;
  const scaled = value * VALUE_SCALE;
  return Math.abs(scaled - Math.round(scaled)) < VALUE_SCALE_SLOP;
}

export function normalizeMeasurementValue(value: string): string {
  return toHalfWidthNumber(value.trim());
}

export function isValidMeasurementValue(value: string): boolean {
  return VALUE_PATTERN.test(value) && isValidMeasurementNumber(Number(value));
}

export type MeasurementCellValues = {
  value: string;
  valueSecondary: string;
  valueChoice: string;
};

export type MeasurementEntryFormValues = {
  unmeasurable: boolean;
  note: string;
  cells: Record<string, MeasurementCellValues>;
};

export type MeasurementFormValues = {
  measuredOn: string;
  entries: Record<string, MeasurementEntryFormValues>;
};

const EMPTY_CELL: MeasurementCellValues = {
  value: "",
  valueSecondary: "",
  valueChoice: "",
};

export function cellKey(trialIndex: number, side: string): string {
  return `${trialIndex}:${side}`;
}

export function hasCellInput(cell: MeasurementCellValues): boolean {
  return (
    cell.value.trim() !== "" ||
    cell.valueSecondary.trim() !== "" ||
    cell.valueChoice.trim() !== ""
  );
}

export function hasEntryInput(entry: MeasurementEntryFormValues): boolean {
  return Object.values(entry.cells).some(hasCellInput);
}

export function emptyEntryForm(
  item: MeasurementItem,
): MeasurementEntryFormValues {
  const cells: Record<string, MeasurementCellValues> = {};
  for (const trialIndex of trialIndexes(item)) {
    for (const side of sidesOf(item)) {
      cells[cellKey(trialIndex, side)] = { ...EMPTY_CELL };
    }
  }
  return { unmeasurable: false, note: "", cells };
}

export function emptyMeasurementForm(
  items: MeasurementItem[],
  measuredOn: string,
): MeasurementFormValues {
  const entries: Record<string, MeasurementEntryFormValues> = {};
  for (const item of items) {
    if (!item.measurementItemId) continue;
    entries[item.measurementItemId] = emptyEntryForm(item);
  }
  return { measuredOn, entries };
}

export function setEntryUnmeasurable(
  entry: MeasurementEntryFormValues,
  unmeasurable: boolean,
): MeasurementEntryFormValues {
  if (!unmeasurable) return { ...entry, unmeasurable };

  const cells: Record<string, MeasurementCellValues> = {};
  for (const key of Object.keys(entry.cells)) {
    cells[key] = { ...EMPTY_CELL };
  }
  return { ...entry, unmeasurable, cells };
}

function numberInputValue(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export function measurementToForm(
  measurement: Measurement,
  items: MeasurementItem[],
): MeasurementFormValues {
  const form = emptyMeasurementForm(
    items,
    dateInputValue(measurement.measuredOn),
  );

  for (const entry of measurement.entries ?? []) {
    const itemId = entry.measurementItemId;
    const target = itemId ? form.entries[itemId] : undefined;
    if (!target) continue;

    target.unmeasurable = entry.unmeasurable === true;
    target.note = entry.note ?? "";

    for (const value of entry.values ?? []) {
      const cell =
        target.cells[cellKey(value.trialIndex ?? 0, value.side ?? "")];
      if (!cell) continue;
      cell.value = numberInputValue(value.value);
      cell.valueSecondary = numberInputValue(value.valueSecondary);
      cell.valueChoice = value.valueChoice ?? "";
    }
  }

  return form;
}

export type MeasurementDataLoss = {
  unknownItemIds: string[];
  droppedValueCount: number;
};

export function measurementDataLoss(
  measurement: Measurement,
  items: MeasurementItem[],
): MeasurementDataLoss {
  const form = emptyMeasurementForm(items, "");
  const unknownItemIds: string[] = [];
  let droppedValueCount = 0;

  for (const entry of measurement.entries ?? []) {
    const itemId = entry.measurementItemId;
    if (!itemId) continue;

    const target = form.entries[itemId];
    if (!target) {
      if (!unknownItemIds.includes(itemId)) unknownItemIds.push(itemId);
      continue;
    }

    for (const value of entry.values ?? []) {
      const key = cellKey(value.trialIndex ?? 0, value.side ?? "");
      if (!target.cells[key]) droppedValueCount += 1;
    }
  }

  return { unknownItemIds, droppedValueCount };
}

export type MeasurementPayloadResult =
  { ok: true; payload: MeasurementPayload } | { ok: false; error: string };

type EntryResult =
  { ok: true; entry: MeasurementEntry | null } | { ok: false; error: string };

type ValueResult =
  { ok: true; value: MeasurementValue | null } | { ok: false; error: string };

export function valuePositionLabel(
  item: MeasurementItem,
  trialIndex: number,
  side: Side,
): string {
  const parts: string[] = [];
  if (trialCountOf(item) > 1) parts.push(`${trialIndex}回目`);
  if (sidesOf(item).length > 1) parts.push(sideHeading(item, side));

  const labeled = parts.filter(Boolean);
  return labeled.length > 0 ? `（${labeled.join("・")}）` : "";
}

export function valueRangeHint(): string {
  return `0以上${MEASUREMENT_VALUE_MAX}以下の数値（小数第2位まで）`;
}

export function formatMeasurementNumber(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return String(Number(value.toFixed(2)));
}

export function formatItemValue(
  item: MeasurementItem,
  value: number | undefined,
): string {
  const label = levelLabel(item, value);
  if (label) return label;

  const text = formatMeasurementNumber(value);
  if (!text || !isLevelItem(item)) return text;
  return outOfListLabel(text);
}

function formatCell(value: MeasurementValue, item: MeasurementItem): string {
  if (item.valueType === "VALUE_TYPE_CHOICE") {
    return value.valueChoice?.trim() ?? "";
  }
  if (item.valueType !== "VALUE_TYPE_PAIRED") {
    return formatItemValue(item, value.value);
  }

  const primary = formatMeasurementNumber(value.value);
  const secondary = formatMeasurementNumber(value.valueSecondary);
  if (!primary && !secondary) return "";

  const [firstLabel, secondLabel] = pairedLabels(item);
  if (!secondary) return `${firstLabel} ${primary}`;
  if (!primary) return `${secondLabel} ${secondary}`;
  return `${primary} / ${secondary}`;
}

export function formatEntryValues(
  entry: MeasurementEntry,
  item: MeasurementItem,
): string {
  const groups = sidesOf(item).map((side) => {
    const trials = trialIndexes(item)
      .map((trialIndex) => {
        const value = cellValue(entry, trialIndex, side);
        return value ? formatCell(value, item) : "";
      })
      .filter(Boolean);

    if (trials.length === 0) return "";

    const joined = trials.join(" / ");
    const label = sideLabel(side);
    return label ? `${label} ${joined}` : joined;
  });

  return groups.filter(Boolean).join("、");
}

const HEIGHT_CODE = "height";
const WEIGHT_CODE = "weight";
const STANDARD_BMI = 22;

const BMI_CATEGORIES: [number, string][] = [
  [18.5, "低体重"],
  [25, "普通体重"],
  [30, "肥満（1度）"],
  [35, "肥満（2度）"],
  [40, "肥満（3度）"],
];

export type BodyComposition = {
  bmi: number;
  category: string;
  idealWeight: number;
};

function bmiCategory(bmi: number): string {
  for (const [upperBound, label] of BMI_CATEGORIES) {
    if (bmi < upperBound) return label;
  }
  return "肥満（4度）";
}

function measuredNumber(
  measurement: Measurement,
  items: MeasurementItem[],
  code: string,
  unit: string,
): number | null {
  const item = items.find((candidate) => candidate.code === code);
  if (!item || item.unit !== unit) return null;
  if (item.valueType !== "VALUE_TYPE_NUMERIC") return null;

  const entry = (measurement.entries ?? []).find((candidate) =>
    isSameId(candidate.measurementItemId, item.measurementItemId),
  );
  if (!entry || entry.unmeasurable) return null;

  const value = (entry.values ?? [])
    .filter((candidate) => typeof candidate.value === "number")
    .sort(
      (left, right) =>
        (left.trialIndex ?? 0) - (right.trialIndex ?? 0) ||
        SIDES.indexOf(left.side ?? "SIDE_NONE") -
          SIDES.indexOf(right.side ?? "SIDE_NONE"),
    )[0]?.value;
  return typeof value === "number" && value > 0 ? value : null;
}

export function bodyComposition(
  measurement: Measurement,
  items: MeasurementItem[],
): BodyComposition | null {
  const height = measuredNumber(measurement, items, HEIGHT_CODE, "UNIT_CM");
  const weight = measuredNumber(measurement, items, WEIGHT_CODE, "UNIT_KG");
  if (height === null || weight === null) return null;

  const meters = height / 100;
  const exact = weight / (meters * meters);
  if (!Number.isFinite(exact)) return null;

  const bmi = Number(exact.toFixed(1));

  return {
    bmi,
    category: bmiCategory(bmi),
    idealWeight: Number((STANDARD_BMI * meters * meters).toFixed(1)),
  };
}

export function hasRecordedHeight(
  measurement: Measurement,
  items: MeasurementItem[],
): boolean {
  const item = items.find((candidate) => candidate.code === HEIGHT_CODE);
  if (!item || item.unit !== "UNIT_CM") return false;
  if (item.valueType !== "VALUE_TYPE_NUMERIC") return false;

  const entry = (measurement.entries ?? []).find((candidate) =>
    isSameId(candidate.measurementItemId, item.measurementItemId),
  );
  if (!entry || entry.unmeasurable) return false;

  return (entry.values ?? []).some(
    (value) => typeof value.value === "number" && value.value > 0,
  );
}

export function hasHeightInput(
  values: MeasurementFormValues,
  items: MeasurementItem[],
): boolean {
  const item = items.find((candidate) => candidate.code === HEIGHT_CODE);
  if (!item || item.unit !== "UNIT_CM") return false;
  if (item.valueType !== "VALUE_TYPE_NUMERIC") return false;

  const entry = item.measurementItemId
    ? values.entries[item.measurementItemId]
    : undefined;
  if (!entry || entry.unmeasurable) return false;

  return Object.values(entry.cells).some((cell) => {
    const value = normalizeMeasurementValue(cell.value);
    return isValidMeasurementValue(value) && Number(value) > 0;
  });
}

export type MeasurementDisplayEntry = {
  item: MeasurementItem;
  unmeasurable: boolean;
  text: string;
  representativeNote: string;
  note: string;
};

function recordedLevels(
  entry: MeasurementEntry,
  item: MeasurementItem,
): number[] {
  return sidesOf(item).flatMap((side) =>
    trialIndexes(item)
      .map((trialIndex) => cellValue(entry, trialIndex, side)?.value)
      .filter((level): level is number => typeof level === "number"),
  );
}

function representativeNote(
  entry: MeasurementEntry,
  item: MeasurementItem,
): string {
  if (!isOptionalBilateral(item) || !isLevelItem(item)) return "";

  const levels = recordedLevels(entry, item);
  if (levels.length < 2) return "";
  if (Math.min(...levels) === Math.max(...levels)) return "";

  return "判定は低い方の段で行われます";
}

export function measurementDisplayEntries(
  measurement: Measurement,
  items: MeasurementItem[],
): MeasurementDisplayEntry[] {
  const byItemId = new Map<string, MeasurementEntry>();
  for (const entry of measurement.entries ?? []) {
    const itemId = entry.measurementItemId?.trim().toLowerCase();
    if (itemId) byItemId.set(itemId, entry);
  }

  const displayed: MeasurementDisplayEntry[] = [];
  for (const item of items) {
    const entry = byItemId.get(
      item.measurementItemId?.trim().toLowerCase() ?? "",
    );
    if (!entry) continue;

    const unmeasurable = entry.unmeasurable === true;
    const text = unmeasurable ? "" : formatEntryValues(entry, item);
    const note = entry.note?.trim() ?? "";
    if (!unmeasurable && !text && !note) continue;

    displayed.push({
      item,
      unmeasurable,
      text,
      representativeNote: unmeasurable ? "" : representativeNote(entry, item),
      note,
    });
  }
  return displayed;
}

function buildValue(
  item: MeasurementItem,
  cell: MeasurementCellValues,
  trialIndex: number,
  side: Side,
  label: string,
): ValueResult {
  const at = `${label}${valuePositionLabel(item, trialIndex, side)}`;

  switch (item.valueType) {
    case "VALUE_TYPE_NUMERIC": {
      const value = normalizeMeasurementValue(cell.value);
      if (!value) return { ok: true, value: null };
      if (!isValidMeasurementValue(value)) {
        return {
          ok: false,
          error: `${at}は${valueRangeHint()}で入力してください`,
        };
      }
      return { ok: true, value: { trialIndex, side, value: Number(value) } };
    }
    case "VALUE_TYPE_PAIRED": {
      const [first, second] = pairedLabels(item);
      const value = normalizeMeasurementValue(cell.value);
      const secondary = normalizeMeasurementValue(cell.valueSecondary);
      if (!value && !secondary) return { ok: true, value: null };
      if (!value || !secondary) {
        return {
          ok: false,
          error: `${at}は${first}と${second}を両方入力してください`,
        };
      }
      if (
        !isValidMeasurementValue(value) ||
        !isValidMeasurementValue(secondary)
      ) {
        return {
          ok: false,
          error: `${at}は${valueRangeHint()}で入力してください`,
        };
      }
      return {
        ok: true,
        value: {
          trialIndex,
          side,
          value: Number(value),
          valueSecondary: Number(secondary),
        },
      };
    }
    case "VALUE_TYPE_CHOICE": {
      const choice = cell.valueChoice.trim();
      if (!choice) return { ok: true, value: null };
      if (isTooLong(choice, CHOICE_MAX_LENGTH)) {
        return {
          ok: false,
          error: `${at}は${CHOICE_MAX_LENGTH}文字以内で入力してください`,
        };
      }
      if (hasControlChar(choice)) {
        return { ok: false, error: `${at}に使用できない文字が含まれています` };
      }
      return { ok: true, value: { trialIndex, side, valueChoice: choice } };
    }
    default:
      if (!hasCellInput(cell)) return { ok: true, value: null };
      return { ok: false, error: `${label}は対応していない入力形式です` };
  }
}

function buildEntry(
  item: MeasurementItem,
  entry: MeasurementEntryFormValues,
  isDraft: boolean,
): EntryResult {
  const measurementItemId = item.measurementItemId;
  if (!measurementItemId) return { ok: true, entry: null };

  const label = item.name ?? "測定項目";

  const note = entry.note.trim();
  if (isTooLong(note)) {
    return {
      ok: false,
      error: `${label}のメモは${TEXT_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (hasControlCharExceptBreaks(note)) {
    return {
      ok: false,
      error: `${label}のメモに使用できない文字が含まれています`,
    };
  }

  if (entry.unmeasurable) {
    if (hasEntryInput(entry)) {
      return {
        ok: false,
        error: `${label}は測定不可にすると値を保存できません。値を消すか測定不可を外してください`,
      };
    }
    return {
      ok: true,
      entry: { measurementItemId, unmeasurable: true, note, values: [] },
    };
  }

  const values: MeasurementValue[] = [];
  for (const trialIndex of trialIndexes(item)) {
    for (const side of sidesOf(item)) {
      const cell = entry.cells[cellKey(trialIndex, side)];
      if (!cell) continue;
      const built = buildValue(item, cell, trialIndex, side, label);
      if (!built.ok) return built;
      if (built.value) values.push(built.value);
    }
  }

  if (!isDraft && isOptionalBilateral(item)) {
    for (const trialIndex of trialIndexes(item)) {
      const count = values.filter(
        (value) => value.trialIndex === trialIndex,
      ).length;
      if (count > 2) {
        return {
          ok: false,
          error: `${label}は${sideNoneLabel(item)}・左・右の3つを同時に記録できません。できた側と、できなかった側の${sideNoneLabel(item)}の2つまでにしてください`,
        };
      }
    }
  }

  if (values.length === 0) {
    if (!note) return { ok: true, entry: null };
    if (!isDraft) {
      return {
        ok: false,
        error: `${label}はメモだけでは確定できません。値を入力するか測定不可にしてください`,
      };
    }
    return {
      ok: true,
      entry: { measurementItemId, unmeasurable: false, note, values: [] },
    };
  }

  return {
    ok: true,
    entry: { measurementItemId, unmeasurable: false, note, values },
  };
}

export function buildMeasurementPayload(
  values: MeasurementFormValues,
  items: MeasurementItem[],
  isDraft: boolean,
): MeasurementPayloadResult {
  const measuredOn = toDateValue(values.measuredOn);
  if (!measuredOn) return { ok: false, error: "測定日を入力してください" };
  if (isFutureDate(measuredOn)) {
    return { ok: false, error: "測定日に未来の日付は指定できません" };
  }

  const entries: MeasurementEntry[] = [];
  for (const item of items) {
    const entry = item.measurementItemId
      ? values.entries[item.measurementItemId]
      : undefined;
    if (!entry) continue;

    const built = buildEntry(item, entry, isDraft);
    if (!built.ok) return built;
    if (built.entry) entries.push(built.entry);
  }

  if (!isDraft && entries.length === 0) {
    return {
      ok: false,
      error:
        "確定するには1項目以上入力してください。まだ入力できないなら下書きとして保存してください",
    };
  }

  return { ok: true, payload: { measuredOn, isDraft, entries } };
}
