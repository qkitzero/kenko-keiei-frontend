import { TIMEZONE_TOLERANCE_DAYS, isFutureDate, isValidDate } from "@/lib/date";
import { SIDES, isValidMeasurementNumber } from "@/lib/measurement";
import { CHOICE_MAX_LENGTH } from "@/lib/measurementItem";
import {
  hasControlChar,
  hasControlCharExceptBreaks,
  isTooLong,
} from "@/lib/text";
import { isValidUuid } from "@/lib/uuid";
import type { components } from "../../../../../gen/measurement/v1/measurement.schema";

type Schemas = components["schemas"];

type MeasurementFields = Omit<
  Schemas["MeasurementServiceCreateMeasurementBody"],
  "measuredBy"
>;

type MeasurementValue = Schemas["v1MeasurementValue"];

type MeasurementEntry = Schemas["v1MeasurementEntry"];

export type MeasurementFieldsResult =
  { ok: true; fields: MeasurementFields } | { ok: false; error: string };

type ValueResult =
  { ok: true; value: MeasurementValue } | { ok: false; error: string };

type EntryResult =
  { ok: true; entry: MeasurementEntry } | { ok: false; error: string };

function invalid(field: string): { ok: false; error: string } {
  return { ok: false, error: `Missing or invalid ${field}` };
}

function isSide(value: unknown): value is Schemas["v1Side"] {
  return typeof value === "string" && (SIDES as string[]).includes(value);
}

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function measuredOn(value: unknown): Schemas["typeDate"] | null {
  if (!value || typeof value !== "object") return null;
  const { year, month, day } = value as Record<string, unknown>;
  if (
    typeof year !== "number" ||
    typeof month !== "number" ||
    typeof day !== "number"
  ) {
    return null;
  }
  const date = { year, month, day };
  if (!isValidDate(date)) return null;
  if (isFutureDate(date, TIMEZONE_TOLERANCE_DAYS)) return null;
  return date;
}

function parseValue(source: unknown): ValueResult {
  if (!source || typeof source !== "object") return invalid("values");
  const raw = source as Record<string, unknown>;

  const trialIndex = raw.trialIndex;
  if (
    typeof trialIndex !== "number" ||
    !Number.isInteger(trialIndex) ||
    trialIndex < 1
  ) {
    return invalid("trialIndex");
  }

  if (!isSide(raw.side)) return invalid("side");

  const value: MeasurementValue = { trialIndex, side: raw.side };

  for (const key of ["value", "valueSecondary"] as const) {
    const numeric = raw[key];
    if (isAbsent(numeric)) continue;
    if (typeof numeric !== "number" || !isValidMeasurementNumber(numeric)) {
      return invalid(key);
    }
    value[key] = numeric;
  }

  if (!isAbsent(raw.valueChoice)) {
    if (typeof raw.valueChoice !== "string") return invalid("valueChoice");
    const choice = raw.valueChoice.trim();
    if (
      !choice ||
      isTooLong(choice, CHOICE_MAX_LENGTH) ||
      hasControlChar(choice)
    ) {
      return invalid("valueChoice");
    }
    value.valueChoice = choice;
  }

  if (
    value.value === undefined &&
    value.valueSecondary === undefined &&
    value.valueChoice === undefined
  ) {
    return invalid("values");
  }

  return { ok: true, value };
}

function parseEntry(source: unknown): EntryResult {
  if (!source || typeof source !== "object") return invalid("entries");
  const raw = source as Record<string, unknown>;

  const measurementItemId =
    typeof raw.measurementItemId === "string"
      ? raw.measurementItemId.trim()
      : "";
  if (!isValidUuid(measurementItemId)) return invalid("measurementItemId");

  if (!isAbsent(raw.unmeasurable) && typeof raw.unmeasurable !== "boolean") {
    return invalid("unmeasurable");
  }
  const unmeasurable = raw.unmeasurable === true;

  if (!isAbsent(raw.note) && typeof raw.note !== "string") {
    return invalid("note");
  }
  const note = typeof raw.note === "string" ? raw.note.trim() : "";
  if (isTooLong(note) || hasControlCharExceptBreaks(note)) {
    return invalid("note");
  }

  if (!isAbsent(raw.values) && !Array.isArray(raw.values)) {
    return invalid("values");
  }

  const values: MeasurementValue[] = [];
  const seen = new Set<string>();
  for (const rawValue of Array.isArray(raw.values) ? raw.values : []) {
    const parsed = parseValue(rawValue);
    if (!parsed.ok) return parsed;

    const key = `${parsed.value.trialIndex}:${parsed.value.side}`;
    if (seen.has(key)) return invalid("values");
    seen.add(key);
    values.push(parsed.value);
  }

  if (unmeasurable && values.length > 0) return invalid("values");

  return {
    ok: true,
    entry: { measurementItemId, unmeasurable, note, values },
  };
}

export function parseMeasurementFields(body: unknown): MeasurementFieldsResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const source = body as Record<string, unknown>;

  const date = measuredOn(source.measuredOn);
  if (!date) return invalid("measuredOn");

  if (typeof source.isDraft !== "boolean") return invalid("isDraft");
  const isDraft = source.isDraft;

  if (!isAbsent(source.entries) && !Array.isArray(source.entries)) {
    return invalid("entries");
  }

  const entries: MeasurementEntry[] = [];
  const seen = new Set<string>();
  for (const rawEntry of Array.isArray(source.entries) ? source.entries : []) {
    const parsed = parseEntry(rawEntry);
    if (!parsed.ok) return parsed;

    const itemId = parsed.entry.measurementItemId ?? "";
    if (seen.has(itemId)) return invalid("entries");
    seen.add(itemId);
    entries.push(parsed.entry);
  }

  if (!isDraft && entries.length === 0) return invalid("entries");

  return { ok: true, fields: { measuredOn: date, isDraft, entries } };
}
