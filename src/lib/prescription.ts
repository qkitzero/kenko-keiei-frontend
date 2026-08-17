import { ELEMENTS, elementLabel, type Element } from "@/lib/judgment";
import {
  findTrainingMenu,
  trainingMenusById,
  type TrainingMenu,
} from "@/lib/trainingMenu";
import type { components } from "../../gen/judgment/v1/judgment.schema";

type Schemas = components["schemas"];

export type PrescribedMenu = Schemas["v1PrescribedMenu"];
export type PrescribedMenuInput = Schemas["v1PrescribedMenuInput"];
export type PrescribedPart = Schemas["v1PrescribedPart"];
export type PrescribedUnit = Schemas["v1PrescribedUnit"];
export type PrescriptionSource = Schemas["v1PrescriptionSource"];
export type PrescriptionPayload =
  Schemas["JudgmentServiceUpsertPrescriptionBody"];

export const PRESCRIPTION_AMOUNT_MAX = 999;
export const PRESCRIPTION_SETS_MAX = 99;

const PARTS: PrescribedPart[] = [
  "PRESCRIBED_PART_UPPER_LIMB",
  "PRESCRIBED_PART_LOWER_LIMB",
  "PRESCRIBED_PART_WHOLE_BODY",
];

const UNITS: PrescribedUnit[] = [
  "PRESCRIBED_UNIT_REPS",
  "PRESCRIBED_UNIT_SECONDS",
  "PRESCRIBED_UNIT_MINUTES",
];

const ELEMENTS_BY_TRAINING_ELEMENT: Record<string, Element> = {
  TRAINING_ELEMENT_MUSCLE_STRENGTH: "ELEMENT_MUSCLE_STRENGTH",
  TRAINING_ELEMENT_MUSCLE_ENDURANCE: "ELEMENT_MUSCLE_ENDURANCE",
  TRAINING_ELEMENT_FLEXIBILITY: "ELEMENT_FLEXIBILITY",
  TRAINING_ELEMENT_AGILITY: "ELEMENT_AGILITY",
  TRAINING_ELEMENT_BALANCE: "ELEMENT_BALANCE",
  TRAINING_ELEMENT_MOBILITY: "ELEMENT_MOBILITY",
};

const PARTS_BY_TRAINING_PART: Record<string, PrescribedPart> = {
  PART_UPPER_LIMB: "PRESCRIBED_PART_UPPER_LIMB",
  PART_LOWER_LIMB: "PRESCRIBED_PART_LOWER_LIMB",
  PART_WHOLE_BODY: "PRESCRIBED_PART_WHOLE_BODY",
};

const UNITS_BY_TRAINING_UNIT: Record<string, PrescribedUnit> = {
  TRAINING_UNIT_REPS: "PRESCRIBED_UNIT_REPS",
  TRAINING_UNIT_SECONDS: "PRESCRIBED_UNIT_SECONDS",
  TRAINING_UNIT_MINUTES: "PRESCRIBED_UNIT_MINUTES",
};

const PART_LABELS: Record<string, string> = {
  PRESCRIBED_PART_UNSPECIFIED: "",
  PRESCRIBED_PART_UPPER_LIMB: "上肢",
  PRESCRIBED_PART_LOWER_LIMB: "下肢",
  PRESCRIBED_PART_WHOLE_BODY: "全身",
};

const UNIT_LABELS: Record<string, string> = {
  PRESCRIBED_UNIT_UNSPECIFIED: "",
  PRESCRIBED_UNIT_REPS: "回",
  PRESCRIBED_UNIT_SECONDS: "秒",
  PRESCRIBED_UNIT_MINUTES: "分",
};

const SOURCE_LABELS: Record<string, string> = {
  PRESCRIPTION_SOURCE_UNSPECIFIED: "",
  PRESCRIPTION_SOURCE_ELEMENT: "要素別",
  PRESCRIPTION_SOURCE_FIXED: "共通",
  PRESCRIPTION_SOURCE_AGE_DECADE: "年代別",
  PRESCRIPTION_SOURCE_MANUAL: "手動",
};

const AMOUNT_LABELS: Record<string, string> = {
  PRESCRIBED_UNIT_REPS: "回数",
  PRESCRIBED_UNIT_SECONDS: "秒数",
  PRESCRIBED_UNIT_MINUTES: "分数",
};

export function partLabel(part: string | undefined): string {
  if (!part) return "";
  return PART_LABELS[part] ?? part.replace(/^PRESCRIBED_PART_/, "");
}

export function prescribedUnitLabel(unit: string | undefined): string {
  if (!unit) return "";
  return UNIT_LABELS[unit] ?? unit.replace(/^PRESCRIBED_UNIT_/, "");
}

export function sourceLabel(source: string | undefined): string {
  if (!source) return "";
  return SOURCE_LABELS[source] ?? source.replace(/^PRESCRIPTION_SOURCE_/, "");
}

export function amountLabel(unit: string | undefined): string {
  return (unit && AMOUNT_LABELS[unit]) || "回数・秒数";
}

export function menuElement(menu: TrainingMenu): Element | undefined {
  return ELEMENTS_BY_TRAINING_ELEMENT[menu.element ?? ""];
}

export function menuPart(menu: TrainingMenu): PrescribedPart | undefined {
  return PARTS_BY_TRAINING_PART[menu.part ?? ""];
}

export function menuUnit(menu: TrainingMenu): PrescribedUnit | undefined {
  return UNITS_BY_TRAINING_UNIT[menu.unit ?? ""];
}

export function menuCategoryLabel(menu: TrainingMenu): string {
  const element = menuElement(menu);
  if (!element) return "";
  return [elementLabel(element), partLabel(menuPart(menu))]
    .filter(Boolean)
    .join(" ・ ");
}

export function prescribedCategoryLabel(menu: PrescribedMenu): string {
  if (!menu.element || menu.element === "ELEMENT_UNSPECIFIED") return "";
  return [elementLabel(menu.element), partLabel(menu.part)]
    .filter(Boolean)
    .join(" ・ ");
}

export function volumeLabel(
  amount: number | undefined,
  unit: string | undefined,
  sets: number | undefined,
): string {
  const parts: string[] = [];
  if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
    parts.push(`${amount}${prescribedUnitLabel(unit)}`);
  }
  if (typeof sets === "number" && Number.isFinite(sets) && sets > 0) {
    parts.push(`${sets}セット`);
  }
  return parts.join(" × ");
}

export function isOverride(menus: PrescribedMenu[]): boolean {
  return menus.some((menu) => menu.source === "PRESCRIPTION_SOURCE_MANUAL");
}

export type TrainingMenuGroup = {
  key: string;
  label: string;
  menus: TrainingMenu[];
};

export function groupTrainingMenus(menus: TrainingMenu[]): TrainingMenuGroup[] {
  const groups: TrainingMenuGroup[] = [];
  const byKey = new Map<string, TrainingMenuGroup>();

  for (const menu of menus) {
    if (!menuElement(menu) || !menuPart(menu) || !menuUnit(menu)) continue;

    const key = `${menu.element ?? ""}|${menu.part ?? ""}`;
    const listed = byKey.get(key);
    if (listed) {
      listed.menus.push(menu);
      continue;
    }
    const created = { key, label: menuCategoryLabel(menu), menus: [menu] };
    byKey.set(key, created);
    groups.push(created);
  }

  return groups;
}

export function emptyPrescriptionMessage(emptyJudgment: boolean): string {
  if (emptyJudgment) {
    return "判定が出ていないため、自動で処方された種目はありません。";
  }
  return "今回の測定では、自動で処方された種目はありません。";
}

export type PrescriptionRow = {
  key: string;
  trainingMenuId: string;
  amount: string;
  sets: string;
};

export type PrescriptionPayloadResult =
  { ok: true; payload: PrescriptionPayload } | { ok: false; error: string };

function parseCount(value: string, max: number): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) return null;
  return parsed;
}

export function buildPrescriptionPayload(
  rows: PrescriptionRow[],
  menus: TrainingMenu[],
): PrescriptionPayloadResult {
  if (rows.length === 0) {
    return { ok: false, error: "処方する種目を1件以上選んでください" };
  }

  const byId = trainingMenusById(menus);
  const seen = new Set<string>();
  const prescribedMenus: PrescribedMenuInput[] = [];

  for (const row of rows) {
    const menu = findTrainingMenu(byId, row.trainingMenuId);
    if (!menu) {
      return {
        ok: false,
        error:
          "選択されていない行があります。すべての行で種目を選ぶか、行を削除してください",
      };
    }

    const id = row.trainingMenuId.trim().toLowerCase();
    if (seen.has(id)) {
      return {
        ok: false,
        error: `同じ種目が重複しています（${menu.name ?? ""}）`,
      };
    }
    seen.add(id);

    const amount = parseCount(row.amount, PRESCRIPTION_AMOUNT_MAX);
    if (amount === null) {
      return {
        ok: false,
        error: `回数・秒数は1〜${PRESCRIPTION_AMOUNT_MAX}の整数で入力してください（${menu.name ?? ""}）`,
      };
    }

    const sets = parseCount(row.sets, PRESCRIPTION_SETS_MAX);
    if (sets === null) {
      return {
        ok: false,
        error: `セット数は1〜${PRESCRIPTION_SETS_MAX}の整数で入力してください（${menu.name ?? ""}）`,
      };
    }

    const element = menuElement(menu);
    const part = menuPart(menu);
    const unit = menuUnit(menu);
    if (!element || !part || !unit) {
      return {
        ok: false,
        error: `種目の要素・部位・単位を判別できません（${menu.name ?? ""}）`,
      };
    }

    prescribedMenus.push({
      element,
      part,
      trainingMenuId: menu.trainingMenuId,
      amount,
      unit,
      sets,
    });
  }

  return { ok: true, payload: { prescribedMenus } };
}

export function parsePrescriptionPayload(
  body: unknown,
): PrescriptionPayloadResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }

  const { prescribedMenus } = body as Record<string, unknown>;
  if (!Array.isArray(prescribedMenus) || prescribedMenus.length === 0) {
    return { ok: false, error: "Missing or empty prescribedMenus" };
  }

  const parsed: PrescribedMenuInput[] = [];
  for (const entry of prescribedMenus) {
    if (!entry || typeof entry !== "object") {
      return { ok: false, error: "Invalid prescribed menu" };
    }

    const { element, part, trainingMenuId, amount, unit, sets } =
      entry as Record<string, unknown>;

    if (typeof trainingMenuId !== "string" || !trainingMenuId.trim()) {
      return { ok: false, error: "Missing or invalid trainingMenuId" };
    }
    if (!ELEMENTS.includes(element as Element)) {
      return { ok: false, error: "Missing or invalid element" };
    }
    if (!PARTS.includes(part as PrescribedPart)) {
      return { ok: false, error: "Missing or invalid part" };
    }
    if (!UNITS.includes(unit as PrescribedUnit)) {
      return { ok: false, error: "Missing or invalid unit" };
    }
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > PRESCRIPTION_AMOUNT_MAX
    ) {
      return { ok: false, error: "Missing or invalid amount" };
    }
    if (
      typeof sets !== "number" ||
      !Number.isInteger(sets) ||
      sets < 1 ||
      sets > PRESCRIPTION_SETS_MAX
    ) {
      return { ok: false, error: "Missing or invalid sets" };
    }

    parsed.push({
      element: element as Element,
      part: part as PrescribedPart,
      trainingMenuId,
      amount,
      unit: unit as PrescribedUnit,
      sets,
    });
  }

  return { ok: true, payload: { prescribedMenus: parsed } };
}
