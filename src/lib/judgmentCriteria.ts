import {
  ELEMENTS,
  RANKS,
  rankLetter,
  rankMeaning,
  type AgeRange,
  type Element,
  type Rank,
} from "@/lib/judgment";
import { isJudgedItem, type MeasurementItem } from "@/lib/measurementItem";
import { isSameId } from "@/lib/uuid";
import type { components } from "../../gen/judgment/v1/judgment.schema";

type Schemas = components["schemas"];

export type JudgmentCriteria = Schemas["v1GetJudgmentCriteriaResponse"];
export type AgeGroupStandard = Schemas["v1AgeGroupStandard"];
export type StandardGender = Schemas["v1StandardGender"];

export const STANDARD_GENDERS: StandardGender[] = [
  "STANDARD_GENDER_MALE",
  "STANDARD_GENDER_FEMALE",
];

const STANDARD_GENDER_LABELS: Record<string, string> = {
  STANDARD_GENDER_MALE: "男性",
  STANDARD_GENDER_FEMALE: "女性",
};

const STANDARD_GENDERS_BY_GENDER: Record<string, StandardGender> = {
  GENDER_MALE: "STANDARD_GENDER_MALE",
  GENDER_FEMALE: "STANDARD_GENDER_FEMALE",
};

const ELEMENTS_BY_ITEM_ELEMENT: Record<string, Element> = {
  ITEM_ELEMENT_MUSCLE_STRENGTH: "ELEMENT_MUSCLE_STRENGTH",
  ITEM_ELEMENT_MUSCLE_ENDURANCE: "ELEMENT_MUSCLE_ENDURANCE",
  ITEM_ELEMENT_FLEXIBILITY: "ELEMENT_FLEXIBILITY",
  ITEM_ELEMENT_AGILITY: "ELEMENT_AGILITY",
  ITEM_ELEMENT_BALANCE: "ELEMENT_BALANCE",
  ITEM_ELEMENT_MOBILITY: "ELEMENT_MOBILITY",
};

const STANDARD_SOURCE_NOTES_BY_CODE: Record<string, string> = {
  seated_stepping_20s:
    "年代別・性別の公的な統計が無いため、中央労働災害防止協会の5段階評価表を母集団の中心の手がかりにして按分した暫定値です。回数の数え方も出典と異なります（このサービスは足裏全体、出典はつま先）。",
  back_strength:
    "旧文部省「体力診断テスト」に由来する値です。51歳以上は外挿した値で、標準偏差は変動係数を仮定して求めています。",
  stand_up_test:
    "この10段階の尺度には年代別・性別の公的な統計が無いため、推定した暫定値です。",
};

export function standardGenderLabel(gender: string | undefined): string {
  return STANDARD_GENDER_LABELS[gender ?? ""] ?? "";
}

export function standardGenderOf(
  gender: string | undefined,
): StandardGender | undefined {
  return STANDARD_GENDERS_BY_GENDER[gender ?? ""];
}

export function itemElements(item: MeasurementItem): Element[] {
  const elements = new Set(
    (item.elements ?? []).map((element) => ELEMENTS_BY_ITEM_ELEMENT[element]),
  );
  return ELEMENTS.filter((element) => elements.has(element));
}

export type ElementItems = {
  element: Element;
  items: MeasurementItem[];
};

export function itemsByElement(items: MeasurementItem[]): ElementItems[] {
  const judged = items.filter(isJudgedItem);
  return ELEMENTS.map((element) => ({
    element,
    items: judged.filter((item) => itemElements(item).includes(element)),
  }));
}

export function standardSourceNote(code: string | undefined): string {
  return STANDARD_SOURCE_NOTES_BY_CODE[code ?? ""] ?? "";
}

export type RankRange = {
  rank: Rank;
  letter: string;
  meaning: string;
  min: number | null;
  max: number | null;
};

function finiteOrNull(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function rankRanges(criteria: JudgmentCriteria | null): RankRange[] {
  const standards = criteria?.rankStandards ?? [];
  return RANKS.flatMap((rank) => {
    const standard = standards.find((candidate) => candidate.rank === rank);
    if (!standard) return [];
    const min = finiteOrNull(standard.zScoreMin);
    const max = finiteOrNull(standard.zScoreMax);
    if (min === null && max === null) return [];
    return [
      {
        rank,
        letter: rankLetter(rank),
        meaning: rankMeaning(rank),
        min,
        max,
      },
    ];
  });
}

function boundaryLabel(value: number): string {
  const text = String(Number(value.toFixed(2)));
  return value > 0 ? `+${text}` : text;
}

export function zScoreRangeLabel(range: RankRange): string {
  const parts: string[] = [];
  if (range.min !== null) parts.push(`${boundaryLabel(range.min)} 以上`);
  if (range.max !== null) parts.push(`${boundaryLabel(range.max)} 未満`);
  return parts.join(" ");
}

export function rankBoundaries(criteria: JudgmentCriteria | null): number[] {
  const boundaries = new Set<number>();
  for (const range of rankRanges(criteria)) {
    if (range.min !== null) boundaries.add(range.min);
    if (range.max !== null) boundaries.add(range.max);
  }
  return [...boundaries].sort((left, right) => left - right);
}

export function typicalZScoreRange(
  criteria: JudgmentCriteria | null,
): [number, number] | null {
  const typical = rankRanges(criteria).find((range) => range.rank === "RANK_C");
  if (!typical || typical.min === null || typical.max === null) return null;
  return [typical.min, typical.max];
}

function standardAgeRange(standard: AgeGroupStandard): AgeRange | null {
  const { ageFrom, ageTo } = standard;
  if (typeof ageFrom !== "number" || typeof ageTo !== "number") return null;
  if (ageFrom > ageTo) return null;
  return { from: ageFrom, to: ageTo };
}

export function registeredAgeRange(
  criteria: JudgmentCriteria | null,
  gender?: StandardGender,
): AgeRange | null {
  const ranges = (criteria?.ageGroupStandards ?? [])
    .filter((standard) => !gender || standard.gender === gender)
    .map(standardAgeRange)
    .filter((range): range is AgeRange => range !== null);
  if (ranges.length === 0) return null;

  return {
    from: Math.min(...ranges.map((range) => range.from)),
    to: Math.max(...ranges.map((range) => range.to)),
  };
}

export function edgeAgeGroups(
  criteria: JudgmentCriteria | null,
): { youngest: AgeRange; oldest: AgeRange } | null {
  const ranges = (criteria?.ageGroupStandards ?? [])
    .map(standardAgeRange)
    .filter((range): range is AgeRange => range !== null);
  if (ranges.length === 0) return null;

  const youngest = ranges.reduce((found, range) =>
    range.from < found.from ? range : found,
  );
  const oldest = ranges.reduce((found, range) =>
    range.to > found.to ? range : found,
  );
  return { youngest, oldest };
}

export function judgedAgeRange(
  criteria: JudgmentCriteria | null,
  gender?: StandardGender,
): AgeRange | null {
  const registered = registeredAgeRange(criteria, gender);
  const fallback = criteria?.ageGroupFallback;
  const younger = fallback?.maxYoungerYears;
  const older = fallback?.maxOlderYears;
  if (!registered || typeof younger !== "number" || typeof older !== "number") {
    return null;
  }

  return {
    from: Math.max(registered.from - younger, 0),
    to: registered.to + older,
  };
}

export type AgeGroupRow = {
  range: AgeRange;
  mean: number | undefined;
  standardDeviation: number | undefined;
};

export function ageGroupRows(
  criteria: JudgmentCriteria,
  item: MeasurementItem,
  gender: StandardGender,
): AgeGroupRow[] {
  return (criteria.ageGroupStandards ?? [])
    .filter(
      (standard) =>
        standard.gender === gender &&
        isSameId(standard.measurementItemId, item.measurementItemId),
    )
    .flatMap((standard) => {
      const range = standardAgeRange(standard);
      return range
        ? [
            {
              range,
              mean: standard.mean,
              standardDeviation: standard.standardDeviation,
            },
          ]
        : [];
    })
    .sort((left, right) => left.range.from - right.range.from);
}

export function standardizedItems(
  criteria: JudgmentCriteria,
  items: MeasurementItem[],
): MeasurementItem[] {
  const standards = criteria.ageGroupStandards ?? [];
  return items.filter((item) =>
    standards.some((standard) =>
      isSameId(standard.measurementItemId, item.measurementItemId),
    ),
  );
}

export function unknownStandardItemCount(
  criteria: JudgmentCriteria,
  items: MeasurementItem[],
): number {
  const unknown = new Set<string>();
  for (const standard of criteria.ageGroupStandards ?? []) {
    const itemId = standard.measurementItemId?.trim().toLowerCase() ?? "";
    if (
      itemId &&
      !items.some((item) => isSameId(item.measurementItemId, itemId))
    ) {
      unknown.add(itemId);
    }
  }
  return unknown.size;
}
