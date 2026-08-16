import type { Customer } from "@/lib/customer";
import { genderLabel } from "@/lib/customer";
import type { Measurement } from "@/lib/measurement";
import type { MeasurementItem } from "@/lib/measurementItem";
import { hasControlCharExceptBreaks, isTooLong } from "@/lib/text";
import type { components } from "../../gen/judgment/v1/judgment.schema";

type Schemas = components["schemas"];

export type Judgment = Schemas["v1Judgment"];
export type ItemEvaluation = Schemas["v1ItemEvaluation"];
export type ElementEvaluation = Schemas["v1ElementEvaluation"];
export type Rank = Schemas["v1Rank"];
export type Element = Schemas["v1Element"];
export type AdvicePayload = Schemas["JudgmentServiceUpsertJudgmentAdviceBody"];

export const ADVICE_MAX_LENGTH = 2000;

export const JUDGMENT_MIN_AGE = 18;
export const JUDGMENT_MAX_AGE = 99;

export const Z_SCORE_MIN = -2.5;
export const Z_SCORE_MAX = 2.5;

export const RANK_BOUNDARIES = [-1.5, -0.5, 0.5, 1.5];

export const TYPICAL_Z_SCORE_RANGE: [number, number] = [-0.5, 0.5];

export const MIN_RADAR_ELEMENTS = 3;

export type RankTone = "success" | "muted" | "warning" | "danger";

export const ELEMENTS: Element[] = [
  "ELEMENT_MUSCLE_STRENGTH",
  "ELEMENT_MUSCLE_ENDURANCE",
  "ELEMENT_FLEXIBILITY",
  "ELEMENT_AGILITY",
  "ELEMENT_BALANCE",
  "ELEMENT_MOBILITY",
];

const ELEMENT_LABELS: Record<string, string> = {
  ELEMENT_UNSPECIFIED: "その他",
  ELEMENT_MUSCLE_STRENGTH: "筋力",
  ELEMENT_MUSCLE_ENDURANCE: "筋持久力",
  ELEMENT_FLEXIBILITY: "柔軟性",
  ELEMENT_AGILITY: "敏しょう性",
  ELEMENT_BALANCE: "バランス",
  ELEMENT_MOBILITY: "移動能力",
};

const RANK_LETTERS: Record<string, string> = {
  RANK_UNSPECIFIED: "",
  RANK_A: "A",
  RANK_B: "B",
  RANK_C: "C",
  RANK_D: "D",
  RANK_E: "E",
};

const RANK_MEANINGS: Record<string, string> = {
  RANK_UNSPECIFIED: "判定なし",
  RANK_A: "非常に良い",
  RANK_B: "良い",
  RANK_C: "年代相応",
  RANK_D: "やや注意",
  RANK_E: "要注意",
};

const RANK_TONES: Record<string, RankTone> = {
  RANK_UNSPECIFIED: "muted",
  RANK_A: "success",
  RANK_B: "success",
  RANK_C: "muted",
  RANK_D: "warning",
  RANK_E: "danger",
};

export function elementLabel(element: string | undefined): string {
  if (!element) return ELEMENT_LABELS.ELEMENT_UNSPECIFIED;
  return ELEMENT_LABELS[element] ?? element;
}

export function rankLetter(rank: string | undefined): string {
  if (!rank) return "";
  return RANK_LETTERS[rank] ?? rank.replace(/^RANK_/, "");
}

export function rankMeaning(rank: string | undefined): string {
  if (!rank) return RANK_MEANINGS.RANK_UNSPECIFIED;
  return RANK_MEANINGS[rank] ?? "";
}

export function rankTone(rank: string | undefined): RankTone {
  if (!rank) return "muted";
  return RANK_TONES[rank] ?? "muted";
}

export const RANK_LEGEND = (
  ["RANK_A", "RANK_B", "RANK_C", "RANK_D", "RANK_E"] as Rank[]
).map((rank) => ({
  rank,
  letter: rankLetter(rank),
  meaning: rankMeaning(rank),
}));

export function formatZScore(zScore: number | undefined): string {
  if (typeof zScore !== "number" || !Number.isFinite(zScore)) return "";
  const rounded = zScore.toFixed(1);
  return Number(rounded) > 0 ? `+${rounded}` : rounded;
}

export type JudgedItem = {
  item: MeasurementItem;
  evaluation: ItemEvaluation;
};

export function judgedItems(
  judgment: Judgment,
  items: MeasurementItem[],
): JudgedItem[] {
  const byItemId = new Map<string, ItemEvaluation>();
  for (const evaluation of judgment.itemEvaluations ?? []) {
    const itemId = evaluation.measurementItemId?.trim().toLowerCase();
    if (itemId) byItemId.set(itemId, evaluation);
  }

  const judged: JudgedItem[] = [];
  for (const item of items) {
    const evaluation = byItemId.get(
      item.measurementItemId?.trim().toLowerCase() ?? "",
    );
    if (evaluation) judged.push({ item, evaluation });
  }
  return judged;
}

export function elementEvaluationsByElement(
  judgment: Judgment,
): Map<string, ElementEvaluation> {
  const byElement = new Map<string, ElementEvaluation>();
  for (const evaluation of judgment.elementEvaluations ?? []) {
    if (evaluation.element) byElement.set(evaluation.element, evaluation);
  }
  return byElement;
}

export function isEmptyJudgment(judgment: Judgment): boolean {
  return (
    (judgment.itemEvaluations ?? []).length === 0 &&
    (judgment.elementEvaluations ?? []).length === 0
  );
}

export function motorAgeDifference(
  judgment: Judgment,
  measurement: Measurement,
): number | null {
  const motorAge = judgment.motorAge;
  const age = measurement.ageAtMeasurement;
  if (typeof motorAge !== "number" || typeof age !== "number") return null;
  return motorAge - age;
}

export function motorAgeDifferenceLabel(difference: number): string {
  if (difference === 0) return "実年齢と同じ";
  if (difference < 0) return `実年齢より${-difference}歳若い`;
  return `実年齢より${difference}歳上`;
}

function hasJudgeableItems(
  measurement: Measurement,
  items: MeasurementItem[],
): boolean {
  const motorFunctionItemIds = new Set(
    items
      .filter((item) => item.category === "CATEGORY_MOTOR_FUNCTION")
      .map((item) => item.measurementItemId?.trim().toLowerCase() ?? ""),
  );

  return (measurement.entries ?? []).some((entry) => {
    const itemId = entry.measurementItemId?.trim().toLowerCase() ?? "";
    if (!motorFunctionItemIds.has(itemId)) return false;
    if (entry.unmeasurable) return false;
    return (entry.values ?? []).some(
      (value) =>
        typeof value.value === "number" ||
        typeof value.valueSecondary === "number" ||
        (value.valueChoice ?? "").trim() !== "",
    );
  });
}

export function emptyJudgmentMessage(
  measurement: Measurement,
  items: MeasurementItem[],
  customer: Customer | null,
): string {
  if (!customer) {
    return "判定できる項目がありません。顧客情報を取得できなかったため、理由を特定できません。";
  }

  const gender = customer.gender;
  if (gender !== "GENDER_MALE" && gender !== "GENDER_FEMALE") {
    const label = genderLabel(gender);
    return label
      ? `性別「${label}」に対応する基準値が登録されていないため、判定できません。`
      : "顧客の性別が登録されていないため、判定できません。顧客情報に性別を登録してください。";
  }

  const age = measurement.ageAtMeasurement;
  if (
    typeof age === "number" &&
    (age < JUDGMENT_MIN_AGE || age > JUDGMENT_MAX_AGE)
  ) {
    return `測定時の年齢（${age}歳）に対応する基準値が登録されていないため、判定できません。`;
  }

  if (!hasJudgeableItems(measurement, items)) {
    return "判定の対象は運動機能の項目です。この測定には運動機能の記録がありません。";
  }

  return "この測定には基準値が登録されている項目が含まれていないため、判定できません。";
}

export type AdvicePayloadResult =
  { ok: true; payload: AdvicePayload } | { ok: false; error: string };

export function buildAdvicePayload(advice: string): AdvicePayloadResult {
  const trimmed = advice.trim();

  if (isTooLong(trimmed, ADVICE_MAX_LENGTH)) {
    return {
      ok: false,
      error: `アドバイスは${ADVICE_MAX_LENGTH}文字以内で入力してください`,
    };
  }

  if (hasControlCharExceptBreaks(trimmed)) {
    return { ok: false, error: "アドバイスに使用できない文字が含まれています" };
  }

  return { ok: true, payload: { advice: trimmed } };
}

export type AdviceFormResult =
  { ok: true; advice: string } | { ok: false; error: string };

export function parseAdviceForm(body: unknown): AdviceFormResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const { advice } = body as Record<string, unknown>;
  if (typeof advice !== "string") {
    return { ok: false, error: "Missing or invalid advice" };
  }

  return { ok: true, advice };
}
