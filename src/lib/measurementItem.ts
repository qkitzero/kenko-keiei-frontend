import type { components } from "../../gen/measurementitem/v1/measurement_item.schema";

type Schemas = components["schemas"];

export type MeasurementItem = Schemas["v1MeasurementItem"];
export type Category = Schemas["v1Category"];
export type Unit = Schemas["v1Unit"];
export type ValueType = Schemas["v1ValueType"];

export const CHOICE_MAX_LENGTH = 32;

export const CATEGORY_MOTOR_FUNCTION = "CATEGORY_MOTOR_FUNCTION";

const UNIT_LEVEL = "UNIT_LEVEL";

const CATEGORY_LABELS: Record<string, string> = {
  CATEGORY_UNSPECIFIED: "その他",
  CATEGORY_VITAL: "バイタル",
  CATEGORY_PHYSIQUE: "体格",
  CATEGORY_BODY_COMPOSITION: "体組成",
  CATEGORY_MOTOR_FUNCTION: "運動機能",
};

const UNIT_LABELS: Record<string, string> = {
  UNIT_UNSPECIFIED: "",
  UNIT_KG: "kg",
  UNIT_CM: "cm",
  UNIT_SEC: "秒",
  UNIT_COUNT: "回",
  UNIT_MMHG: "mmHg",
  UNIT_PERCENT: "%",
  UNIT_BPM: "bpm",
  UNIT_LEVEL: "",
};

const PAIRED_LABELS: Record<string, [string, string]> = {
  blood_pressure: ["収縮期", "拡張期"],
};

const DEFAULT_PAIRED_LABELS: [string, string] = ["1つ目", "2つ目"];

const CHOICES_BY_CODE: Record<string, string[]> = {};

type LevelLabelParts = { stance: string; height: string };

const LEVEL_LABEL_PARTS_BY_CODE: Record<string, LevelLabelParts[]> = {
  stand_up_test: [
    { stance: "両足", height: "50cm" },
    { stance: "両足", height: "40cm" },
    { stance: "両足", height: "30cm" },
    { stance: "両足", height: "20cm" },
    { stance: "両足", height: "10cm" },
    { stance: "片足", height: "40cm" },
    { stance: "片足", height: "30cm" },
    { stance: "片足", height: "20cm" },
    { stance: "片足", height: "10cm" },
    { stance: "片足", height: "0cm" },
  ],
};

const SIDED_LEVEL_START_BY_CODE: Record<string, number> = {
  stand_up_test: 6,
};

const SIDE_NONE_LABELS_BY_CODE: Record<string, string> = {
  stand_up_test: "両足",
};

const SIDED_LABELS_BY_CODE: Record<string, string> = {
  stand_up_test: "片足",
};

const SHORT_NAMES_BY_CODE: Record<string, string> = {
  back_strength: "背筋",
  grip_strength: "握力",
  cs30: "CS30",
  seated_stepping_20s: "座位",
  sit_and_reach: "前屈",
  stick_reaction: "棒反応",
  eyes_closed_one_leg_stand: "閉眼",
  eyes_open_one_leg_stand: "開眼",
  functional_reach: "FRT",
  two_step: "2歩",
  timed_up_and_go: "TUG",
  walk_5m: "5m",
};

export function categoryLabel(category: string | undefined): string {
  if (!category) return CATEGORY_LABELS.CATEGORY_UNSPECIFIED;
  return CATEGORY_LABELS[category] ?? category;
}

export function unitLabel(unit: string | undefined): string {
  if (!unit) return "";
  return UNIT_LABELS[unit] ?? unit.replace(/^UNIT_/, "");
}

export function pairedLabels(item: MeasurementItem): [string, string] {
  return (item.code && PAIRED_LABELS[item.code]) || DEFAULT_PAIRED_LABELS;
}

export function choicesOf(item: MeasurementItem): string[] {
  return (item.code && CHOICES_BY_CODE[item.code]) || [];
}

export type LevelOption = { level: number; label: string };

export function isLevelItem(item: MeasurementItem): boolean {
  return item.unit === UNIT_LEVEL;
}

function levelPartsOf(item: MeasurementItem): LevelLabelParts[] {
  if (!isLevelItem(item)) return [];
  return (item.code && LEVEL_LABEL_PARTS_BY_CODE[item.code]) || [];
}

function joinLevelParts(parts: LevelLabelParts): string {
  return [parts.stance, parts.height].filter(Boolean).join(" ");
}

export function levelOptionsOf(
  item: MeasurementItem,
  sided: boolean,
): LevelOption[] {
  const options = levelPartsOf(item).map((parts, index) => ({
    level: index + 1,
    label: joinLevelParts(parts),
  }));

  if (!isOptionalBilateral(item)) return options;

  const start = sidedLevelStartOf(item);
  if (start === 0) return options;

  return options.filter((option) =>
    sided ? option.level >= start : option.level < start,
  );
}

export function levelLabel(
  item: MeasurementItem,
  value: number | undefined,
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";

  const level = Number(value.toFixed(2));
  const low = Math.floor(level);
  const high = Math.ceil(level);

  const parts = levelPartsOf(item);
  const lower = parts[low - 1];
  const upper = parts[high - 1];
  if (!lower || !upper) return "";

  if (low === high) return joinLevelParts(lower);
  if (lower.stance === upper.stance) {
    return `${joinLevelParts(lower)}〜${upper.height}`;
  }
  return `${joinLevelParts(lower)}〜${joinLevelParts(upper)}`;
}

export function isOptionalBilateral(item: MeasurementItem): boolean {
  return item.sideMode === "SIDE_MODE_OPTIONAL_BILATERAL";
}

function sidedLevelStartOf(item: MeasurementItem): number {
  return (item.code && SIDED_LEVEL_START_BY_CODE[item.code]) || 0;
}

export function sideNoneLabel(item: MeasurementItem): string {
  return (item.code && SIDE_NONE_LABELS_BY_CODE[item.code]) || "左右なし";
}

export function sidedLabel(item: MeasurementItem): string {
  return (item.code && SIDED_LABELS_BY_CODE[item.code]) || "左右別";
}

export function shortItemName(item: MeasurementItem): string {
  return (item.code && SHORT_NAMES_BY_CODE[item.code]) || item.name || "";
}

export function isAbbreviated(item: MeasurementItem): boolean {
  const short = shortItemName(item);
  return Boolean(short) && short !== (item.name ?? "");
}

export function trialCountOf(item: MeasurementItem): number {
  const count = item.trialCount ?? 0;
  return Number.isInteger(count) && count > 0 ? count : 0;
}

export function trialIndexes(item: MeasurementItem): number[] {
  return Array.from({ length: trialCountOf(item) }, (_, index) => index + 1);
}

export function recordingLabel(item: MeasurementItem): string {
  const parts: string[] = [];

  const unit = unitLabel(item.unit);
  if (unit) parts.push(unit);

  if (item.valueType === "VALUE_TYPE_PAIRED") {
    parts.push(pairedLabels(item).join("・"));
  }
  if (item.valueType === "VALUE_TYPE_CHOICE") {
    parts.push("選択");
  }

  const levels = levelPartsOf(item).length;
  if (levels > 0) parts.push(`${levels}段階`);

  if (item.sideMode === "SIDE_MODE_BILATERAL") parts.push("左右");
  if (isOptionalBilateral(item)) {
    parts.push(`${sideNoneLabel(item)}または左右`);
  }

  const trials = trialCountOf(item);
  if (trials > 1) parts.push(`${trials}回`);

  return parts.join(" ・ ");
}

export type MeasurementItemGroup = {
  category: string;
  items: MeasurementItem[];
};

export function groupByCategory(
  items: MeasurementItem[],
): MeasurementItemGroup[] {
  const groups: MeasurementItemGroup[] = [];
  const byCategory = new Map<string, MeasurementItem[]>();

  for (const item of items) {
    const category = item.category ?? "CATEGORY_UNSPECIFIED";
    const listed = byCategory.get(category);
    if (listed) {
      listed.push(item);
      continue;
    }
    const created = [item];
    byCategory.set(category, created);
    groups.push({ category, items: created });
  }

  return groups;
}
