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

export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

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
};

export const TEXT_MAX_LENGTH = 255;

const KANA_PATTERN = /^[ァ-ヿ 　]+$/;
const PHONE_PATTERN = /^0\d{9,10}$/;
const POSTAL_CODE_PATTERN = /^\d{7}$/;

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
}

function normalizePhone(value: string): string {
  return toHalfWidthDigits(value).replace(/[-－\s　]/g, "");
}

function normalizePostalCode(value: string): string {
  return toHalfWidthDigits(value).replace(/[-－\s　]/g, "");
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

export function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isFutureDate(date: CustomerDate): boolean {
  return toDateInputValue(date) > todayInputValue();
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
  };
}

export function fieldsNeedingInput(customer: Customer): string[] {
  const fields: string[] = [];
  const nameKana = customer.nameKana?.trim() ?? "";
  if (!nameKana || !KANA_PATTERN.test(nameKana)) fields.push("カナ氏名");
  if (!customer.gender || customer.gender === "GENDER_UNSPECIFIED") {
    fields.push("性別");
  }
  if (!isValidCustomerDate(customer.birthDate)) fields.push("生年月日");
  if (customer.prefecture && !PREFECTURES.includes(customer.prefecture)) {
    fields.push("都道府県");
  }
  return fields;
}

export function buildCustomerPayload(
  values: CustomerFormValues,
): PayloadResult {
  const name = values.name.trim();
  if (!name) return { ok: false, error: "氏名を入力してください" };
  if (name.length > TEXT_MAX_LENGTH) {
    return { ok: false, error: "氏名は255文字以内で入力してください" };
  }

  const nameKana = values.nameKana.trim();
  if (!nameKana) return { ok: false, error: "カナ氏名を入力してください" };
  if (!KANA_PATTERN.test(nameKana)) {
    return {
      ok: false,
      error: "カナ氏名は全角カタカナで入力してください",
    };
  }
  if (nameKana.length > TEXT_MAX_LENGTH) {
    return { ok: false, error: "カナ氏名は255文字以内で入力してください" };
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
  if (phone && !PHONE_PATTERN.test(phone)) {
    return {
      ok: false,
      error: "電話番号は0から始まる10桁または11桁で入力してください",
    };
  }

  const email = values.email.trim();
  if (email.length > TEXT_MAX_LENGTH) {
    return {
      ok: false,
      error: "メールアドレスは255文字以内で入力してください",
    };
  }

  const postalCode = normalizePostalCode(values.postalCode.trim());
  if (postalCode && !POSTAL_CODE_PATTERN.test(postalCode)) {
    return {
      ok: false,
      error: "郵便番号は7桁の数字で入力してください（例: 1000001）",
    };
  }

  const prefecture = values.prefecture.trim();
  if (prefecture && !PREFECTURES.includes(prefecture)) {
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
    if (value.length > TEXT_MAX_LENGTH) {
      return { ok: false, error: `${label}は255文字以内で入力してください` };
    }
  }

  const emergencyContactPhone = normalizePhone(
    values.emergencyContactPhone.trim(),
  );
  if (emergencyContactPhone && !PHONE_PATTERN.test(emergencyContactPhone)) {
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
    },
  };
}
