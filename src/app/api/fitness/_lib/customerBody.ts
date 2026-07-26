import {
  TEXT_MAX_LENGTH,
  isFutureDate,
  isValidCustomerDate,
} from "@/lib/customer";
import type { components } from "../../../../../gen/customer/v1/customer.schema";

type Schemas = components["schemas"];

type CustomerFields = Schemas["CustomerServiceUpdateCustomerBody"];

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
] as const;

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
  if (!isValidCustomerDate(date) || isFutureDate(date)) return null;
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

  const gender = text(source.gender);
  if (!gender || !GENDERS.includes(gender)) {
    return { ok: false, error: "Missing or invalid gender" };
  }

  const parsedBirthDate = birthDate(source.birthDate);
  if (!parsedBirthDate) {
    return { ok: false, error: "Missing or invalid birthDate" };
  }

  const optional: Record<string, string> = {};
  for (const key of OPTIONAL_TEXT_FIELDS) {
    const value = source[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length > TEXT_MAX_LENGTH) return tooLong(key);
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
