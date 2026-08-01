import {
  isValidPostalCode,
  isValidPrefecture,
  normalizePostalCode,
} from "@/lib/address";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/contact";
import {
  TEXT_MAX_LENGTH,
  hasControlChar,
  hasControlCharExceptBreaks,
  isTooLong,
} from "@/lib/text";
import type { components } from "../../gen/tenant/v1/profile.schema";

type Schemas = components["schemas"];

export type TenantProfile = Schemas["v1Profile"];

export type TenantProfilePayload = Schemas["ProfileServiceUpsertProfileBody"];

export type TenantProfileFormValues = {
  postalCode: string;
  prefecture: string;
  city: string;
  street: string;
  building: string;
  phone: string;
  email: string;
  homepageUrl: string;
  note: string;
};

export type TenantProfilePayloadResult =
  { ok: true; payload: TenantProfilePayload } | { ok: false; error: string };

export const EMPTY_TENANT_PROFILE_FORM: TenantProfileFormValues = {
  postalCode: "",
  prefecture: "",
  city: "",
  street: "",
  building: "",
  phone: "",
  email: "",
  homepageUrl: "",
  note: "",
};

const TENANT_PROFILE_FIELDS = Object.keys(
  EMPTY_TENANT_PROFILE_FORM,
) as (keyof TenantProfileFormValues)[];

export type TenantProfileFormResult =
  { ok: true; values: TenantProfileFormValues } | { ok: false; error: string };

export function parseTenantProfileForm(body: unknown): TenantProfileFormResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const source = body as Record<string, unknown>;

  const values = { ...EMPTY_TENANT_PROFILE_FORM };
  for (const key of TENANT_PROFILE_FIELDS) {
    const value = source[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") {
      return { ok: false, error: `Missing or invalid ${key}` };
    }
    values[key] = value;
  }
  return { ok: true, values };
}

export function tenantProfileToForm(
  profile: TenantProfile,
): TenantProfileFormValues {
  return {
    postalCode: profile.postalCode ?? "",
    prefecture: profile.prefecture ?? "",
    city: profile.city ?? "",
    street: profile.street ?? "",
    building: profile.building ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    homepageUrl: profile.homepageUrl ?? "",
    note: profile.note ?? "",
  };
}

export function isValidHomepageUrl(value: string): boolean {
  if (isTooLong(value)) return false;
  if (/\s/u.test(value) || hasControlChar(value)) return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (!url.hostname) return false;
  if (url.username || url.password) return false;
  return true;
}

export function buildTenantProfilePayload(
  values: TenantProfileFormValues,
): TenantProfilePayloadResult {
  const postalCode = normalizePostalCode(values.postalCode.trim());
  if (postalCode && !isValidPostalCode(postalCode)) {
    return {
      ok: false,
      error: "郵便番号は7桁の数字で入力してください（例: 1000001）",
    };
  }

  const prefecture = values.prefecture.trim();
  if (prefecture && !isValidPrefecture(prefecture)) {
    return { ok: false, error: "都道府県は一覧から選び直してください" };
  }

  const longTextFields: [string, string][] = [
    [values.city.trim(), "市区町村"],
    [values.street.trim(), "番地"],
    [values.building.trim(), "建物名・部屋番号"],
  ];
  for (const [value, label] of longTextFields) {
    if (isTooLong(value)) {
      return {
        ok: false,
        error: `${label}は${TEXT_MAX_LENGTH}文字以内で入力してください`,
      };
    }
    if (hasControlChar(value)) {
      return { ok: false, error: `${label}に使用できない文字が含まれています` };
    }
  }

  const phone = normalizePhone(values.phone.trim());
  if (phone && !isValidPhone(phone)) {
    return {
      ok: false,
      error: "電話番号は0から始まる10桁または11桁で入力してください",
    };
  }

  const email = values.email.trim();
  if (isTooLong(email)) {
    return {
      ok: false,
      error: `メールアドレスは${TEXT_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (email && !isValidEmail(email)) {
    return {
      ok: false,
      error: "メールアドレスは info@example.com の形式で入力してください",
    };
  }

  const homepageUrl = values.homepageUrl.trim();
  if (homepageUrl && !isValidHomepageUrl(homepageUrl)) {
    return {
      ok: false,
      error: "ホームページ URL は https://example.com の形式で入力してください",
    };
  }

  const note = values.note.trim();
  if (isTooLong(note)) {
    return {
      ok: false,
      error: `メモは${TEXT_MAX_LENGTH}文字以内で入力してください`,
    };
  }
  if (hasControlCharExceptBreaks(note)) {
    return { ok: false, error: "メモに使用できない文字が含まれています" };
  }

  return {
    ok: true,
    payload: {
      postalCode,
      prefecture,
      city: values.city.trim(),
      street: values.street.trim(),
      building: values.building.trim(),
      phone,
      email,
      homepageUrl,
      note,
    },
  };
}
