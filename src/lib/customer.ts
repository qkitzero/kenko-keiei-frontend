import {
  isValidPostalCode,
  isValidPrefecture,
  normalizePostalCode,
} from "@/lib/address";
import { isValidEmail, isValidPhone, normalizePhone } from "@/lib/contact";
import { TEXT_MAX_LENGTH, isTooLong } from "@/lib/text";
import type { components } from "../../gen/customer/v1/customer.schema";

type Schemas = components["schemas"];

export type Customer = Schemas["v1Customer"];
export type Gender = Schemas["v1Gender"];
export type CustomerDate = Schemas["typeDate"];

export const GENDERS: Gender[] = [
  "GENDER_MALE",
  "GENDER_FEMALE",
  "GENDER_OTHER",
];

const GENDER_LABELS: Record<string, string> = {
  GENDER_UNSPECIFIED: "",
  GENDER_MALE: "男性",
  GENDER_FEMALE: "女性",
  GENDER_OTHER: "その他",
};

export function genderLabel(gender: string | undefined): string {
  if (!gender) return "";
  return GENDER_LABELS[gender] ?? gender;
}

export type CustomerFormValues = {
  name: string;
  nameKana: string;
  gender: string;
  birthDate: string;
  phone: string;
  email: string;
  postalCode: string;
  prefecture: string;
  city: string;
  street: string;
  building: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  organizationId: string;
};

export type CustomerPayload = Omit<
  CustomerFormValues,
  "gender" | "birthDate"
> & {
  gender: Gender;
  birthDate: CustomerDate;
};

export type PayloadResult =
  { ok: true; payload: CustomerPayload } | { ok: false; error: string };

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  name: "",
  nameKana: "",
  gender: "",
  birthDate: "",
  phone: "",
  email: "",
  postalCode: "",
  prefecture: "",
  city: "",
  street: "",
  building: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  organizationId: "",
};

const KANA_PATTERN = /^[ァ-ヿ 　]+$/;

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isValidKana(value: string): boolean {
  return KANA_PATTERN.test(value);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isValidCustomerDate(date: CustomerDate | undefined): boolean {
  const year = date?.year ?? 0;
  const month = date?.month ?? 0;
  const day = date?.day ?? 0;
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const maxDay =
    month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month - 1];
  return day <= maxDay;
}

function toDateInputValue(date: CustomerDate | undefined): string {
  if (!isValidCustomerDate(date)) return "";
  const year = String(date?.year ?? 0).padStart(4, "0");
  const month = String(date?.month ?? 0).padStart(2, "0");
  const day = String(date?.day ?? 0).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function birthDateLabel(date: CustomerDate | undefined): string {
  const value = toDateInputValue(date);
  return value ? value.replaceAll("-", "/") : "";
}

function toCustomerDate(value: string): CustomerDate | null {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!matched) return null;

  const date = {
    year: Number(matched[1]),
    month: Number(matched[2]),
    day: Number(matched[3]),
  };
  return isValidCustomerDate(date) ? date : null;
}

function dateInputValueOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayInputValue(): string {
  return dateInputValueOf(new Date());
}

export const TIMEZONE_TOLERANCE_DAYS = 1;

export function isFutureDate(date: CustomerDate, toleranceDays = 0): boolean {
  const limit = new Date();
  limit.setDate(limit.getDate() + toleranceDays);
  return toDateInputValue(date) > dateInputValueOf(limit);
}

export function customerToForm(customer: Customer): CustomerFormValues {
  return {
    name: customer.name ?? "",
    nameKana: customer.nameKana ?? "",
    gender:
      customer.gender && customer.gender !== "GENDER_UNSPECIFIED"
        ? customer.gender
        : "",
    birthDate: toDateInputValue(customer.birthDate),
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    postalCode: customer.postalCode ?? "",
    prefecture: customer.prefecture ?? "",
    city: customer.city ?? "",
    street: customer.street ?? "",
    building: customer.building ?? "",
    emergencyContactName: customer.emergencyContactName ?? "",
    emergencyContactRelationship: customer.emergencyContactRelationship ?? "",
    emergencyContactPhone: customer.emergencyContactPhone ?? "",
    organizationId: customer.organizationId ?? "",
  };
}

export function fieldsNeedingInput(customer: Customer): string[] {
  const fields: string[] = [];
  const nameKana = customer.nameKana?.trim() ?? "";
  if (!nameKana || !isValidKana(nameKana)) fields.push("カナ氏名");
  if (!customer.gender || customer.gender === "GENDER_UNSPECIFIED") {
    fields.push("性別");
  }
  if (!isValidCustomerDate(customer.birthDate)) fields.push("生年月日");

  const phone = customer.phone?.trim() ?? "";
  if (phone && !isValidPhone(phone)) fields.push("電話番号");

  const email = customer.email?.trim() ?? "";
  if (email && !isValidEmail(email)) fields.push("メールアドレス");

  const postalCode = customer.postalCode?.trim() ?? "";
  if (postalCode && !isValidPostalCode(postalCode)) fields.push("郵便番号");

  if (customer.prefecture && !isValidPrefecture(customer.prefecture)) {
    fields.push("都道府県");
  }

  for (const [value, label] of [
    [customer.city, "市区町村"],
    [customer.street, "番地"],
    [customer.building, "建物名・部屋番号"],
    [customer.emergencyContactName, "緊急連絡先の氏名"],
    [customer.emergencyContactRelationship, "緊急連絡先の続柄"],
  ] as const) {
    if (isTooLong(value?.trim() ?? "")) fields.push(label);
  }

  const emergencyContactPhone = customer.emergencyContactPhone?.trim() ?? "";
  if (emergencyContactPhone && !isValidPhone(emergencyContactPhone)) {
    fields.push("緊急連絡先の電話番号");
  }

  return fields;
}

export function buildCustomerPayload(
  values: CustomerFormValues,
): PayloadResult {
  const name = values.name.trim();
  if (!name) return { ok: false, error: "氏名を入力してください" };
  if (isTooLong(name)) {
    return {
      ok: false,
      error: `氏名は${TEXT_MAX_LENGTH}文字以内で入力してください`,
    };
  }

  const nameKana = values.nameKana.trim();
  if (!nameKana) return { ok: false, error: "カナ氏名を入力してください" };
  if (!isValidKana(nameKana)) {
    return {
      ok: false,
      error: "カナ氏名は全角カタカナで入力してください",
    };
  }
  if (isTooLong(nameKana)) {
    return {
      ok: false,
      error: `カナ氏名は${TEXT_MAX_LENGTH}文字以内で入力してください`,
    };
  }

  if (!GENDERS.includes(values.gender as Gender)) {
    return { ok: false, error: "性別を選択してください" };
  }

  const birthDate = toCustomerDate(values.birthDate);
  if (!birthDate) return { ok: false, error: "生年月日を入力してください" };
  if (isFutureDate(birthDate)) {
    return { ok: false, error: "生年月日に未来の日付は指定できません" };
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
      error: "メールアドレスは taro@example.com の形式で入力してください",
    };
  }

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
    [values.emergencyContactName.trim(), "緊急連絡先の氏名"],
    [values.emergencyContactRelationship.trim(), "緊急連絡先の続柄"],
  ];
  for (const [value, label] of longTextFields) {
    if (isTooLong(value)) {
      return {
        ok: false,
        error: `${label}は${TEXT_MAX_LENGTH}文字以内で入力してください`,
      };
    }
  }

  const emergencyContactPhone = normalizePhone(
    values.emergencyContactPhone.trim(),
  );
  if (emergencyContactPhone && !isValidPhone(emergencyContactPhone)) {
    return {
      ok: false,
      error:
        "緊急連絡先の電話番号は0から始まる10桁または11桁で入力してください",
    };
  }

  return {
    ok: true,
    payload: {
      name,
      nameKana,
      gender: values.gender as Gender,
      birthDate,
      phone,
      email,
      postalCode,
      prefecture,
      city: values.city.trim(),
      street: values.street.trim(),
      building: values.building.trim(),
      emergencyContactName: values.emergencyContactName.trim(),
      emergencyContactRelationship: values.emergencyContactRelationship.trim(),
      emergencyContactPhone,
      organizationId: values.organizationId.trim(),
    },
  };
}
