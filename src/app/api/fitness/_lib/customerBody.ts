import {
  TEXT_MAX_LENGTH,
  TIMEZONE_TOLERANCE_DAYS,
  isFutureDate,
  isValidCustomerDate,
  isValidKana,
  isValidPhone,
  isValidPostalCode,
  isValidPrefecture,
  normalizePhone,
  normalizePostalCode,
} from "@/lib/customer";
import type { components } from "../../../../../gen/customer/v1/customer.schema";

type Schemas = components["schemas"];

type CustomerFields = Schemas["CustomerServiceUpdateCustomerBody"];

type StringFieldKey = {
  [
    K in keyof Required<CustomerFields>
  ]: string extends Required<CustomerFields>[K] ? K : never;
}[keyof CustomerFields];

const GENDERS = ["GENDER_MALE", "GENDER_FEMALE", "GENDER_OTHER"];

const OPTIONAL_TEXT_FIELDS = [
  "phone",
  "email",
  "postalCode",
  "prefecture",
  "city",
  "street",
  "building",
  "emergencyContactName",
  "emergencyContactRelationship",
  "emergencyContactPhone",
] as const satisfies readonly StringFieldKey[];

type OptionalTextField = (typeof OPTIONAL_TEXT_FIELDS)[number];

const NORMALIZERS: Partial<
  Record<OptionalTextField, (value: string) => string>
> = {
  phone: normalizePhone,
  emergencyContactPhone: normalizePhone,
  postalCode: normalizePostalCode,
};

const VALIDATORS: Partial<
  Record<OptionalTextField, (value: string) => boolean>
> = {
  phone: isValidPhone,
  emergencyContactPhone: isValidPhone,
  postalCode: isValidPostalCode,
  prefecture: isValidPrefecture,
};

export type CustomerFieldsResult =
  { ok: true; fields: CustomerFields } | { ok: false; error: string };

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function birthDate(value: unknown): Schemas["typeDate"] | null {
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
  if (!isValidCustomerDate(date)) return null;
  if (isFutureDate(date, TIMEZONE_TOLERANCE_DAYS)) return null;
  return date;
}

function tooLong(field: string): { ok: false; error: string } {
  return {
    ok: false,
    error: `${field} exceeds ${TEXT_MAX_LENGTH} characters`,
  };
}

export function parseCustomerFields(body: unknown): CustomerFieldsResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const source = body as Record<string, unknown>;

  const name = text(source.name);
  if (!name) return { ok: false, error: "Missing or invalid name" };
  if (name.length > TEXT_MAX_LENGTH) return tooLong("name");

  const nameKana = text(source.nameKana);
  if (!nameKana) return { ok: false, error: "Missing or invalid nameKana" };
  if (nameKana.length > TEXT_MAX_LENGTH) return tooLong("nameKana");
  if (!isValidKana(nameKana)) {
    return { ok: false, error: "Missing or invalid nameKana" };
  }

  const gender = text(source.gender);
  if (!gender || !GENDERS.includes(gender)) {
    return { ok: false, error: "Missing or invalid gender" };
  }

  const parsedBirthDate = birthDate(source.birthDate);
  if (!parsedBirthDate) {
    return { ok: false, error: "Missing or invalid birthDate" };
  }

  const optional: Partial<Record<OptionalTextField, string>> = {};
  for (const key of OPTIONAL_TEXT_FIELDS) {
    const value = source[key];
    if (typeof value !== "string") continue;
    const normalize = NORMALIZERS[key];
    const trimmed = normalize ? normalize(value.trim()) : value.trim();
    if (trimmed.length > TEXT_MAX_LENGTH) return tooLong(key);
    const validate = VALIDATORS[key];
    if (trimmed && validate && !validate(trimmed)) {
      return { ok: false, error: `Missing or invalid ${key}` };
    }
    optional[key] = trimmed;
  }

  return {
    ok: true,
    fields: {
      name,
      nameKana,
      gender: gender as Schemas["v1Gender"],
      birthDate: parsedBirthDate,
      ...optional,
    },
  };
}
