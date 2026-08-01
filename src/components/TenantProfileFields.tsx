"use client";

import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import TextField from "@/components/TextField";
import { PREFECTURES, isValidPrefecture } from "@/lib/address";
import type { TenantProfileFormValues } from "@/lib/tenantProfile";
import { TEXT_MAX_LENGTH } from "@/lib/text";

type TenantProfileFieldsProps = {
  values: TenantProfileFormValues;
  onChange: (values: TenantProfileFormValues) => void;
  disabled?: boolean;
};

const LEGEND = "text-subtle text-sm font-medium";

const GRID = "mt-3 grid gap-4 sm:grid-cols-2";

export default function TenantProfileFields({
  values,
  onChange,
  disabled,
}: TenantProfileFieldsProps) {
  const update = (key: keyof TenantProfileFormValues) => (value: string) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="flex flex-col gap-6">
      <fieldset disabled={disabled}>
        <legend className={LEGEND}>住所（任意）</legend>
        <div className={GRID}>
          <TextField
            label="郵便番号"
            inputMode="numeric"
            value={values.postalCode}
            onChange={update("postalCode")}
            placeholder="1000001"
          />
          <Select
            label="都道府県"
            value={values.prefecture}
            onChange={update("prefecture")}
          >
            <option value="">未選択</option>
            {values.prefecture && !isValidPrefecture(values.prefecture) && (
              <option value={values.prefecture}>
                {values.prefecture}（一覧にありません）
              </option>
            )}
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </Select>
          <TextField
            label="市区町村"
            value={values.city}
            onChange={update("city")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="千代田区"
          />
          <TextField
            label="番地"
            value={values.street}
            onChange={update("street")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="千代田1-1"
          />
          <TextField
            label="建物名・部屋番号"
            value={values.building}
            onChange={update("building")}
            maxLength={TEXT_MAX_LENGTH}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className={LEGEND}>連絡先（任意）</legend>
        <div className={GRID}>
          <TextField
            label="電話番号"
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={update("phone")}
            placeholder="0312345678"
          />
          <TextField
            label="メールアドレス"
            type="email"
            value={values.email}
            onChange={update("email")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="info@example.com"
          />
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className={LEGEND}>その他（任意）</legend>
        <div className={GRID}>
          <TextField
            label="ホームページ URL"
            type="url"
            inputMode="url"
            value={values.homepageUrl}
            onChange={update("homepageUrl")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="https://example.com"
            className="sm:col-span-2"
          />
          <TextArea
            label="メモ"
            value={values.note}
            onChange={update("note")}
            maxLength={TEXT_MAX_LENGTH}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>
    </div>
  );
}
