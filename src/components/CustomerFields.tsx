"use client";

import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import TextField from "@/components/TextField";
import { PREFECTURES, isValidPrefecture } from "@/lib/address";
import {
  CustomerFormValues,
  GENDERS,
  genderLabel,
  todayInputValue,
} from "@/lib/customer";
import type { OrganizationOptions } from "@/lib/organization";
import { TEXT_MAX_LENGTH } from "@/lib/text";

type CustomerFieldsProps = {
  values: CustomerFormValues;
  onChange: (values: CustomerFormValues) => void;
  disabled?: boolean;
  organizations: OrganizationOptions;
};

const LEGEND = "text-subtle text-sm font-medium";

const GRID = "mt-3 grid gap-4 sm:grid-cols-2";

export default function CustomerFields({
  values,
  onChange,
  disabled,
  organizations,
}: CustomerFieldsProps) {
  const update = (key: keyof CustomerFormValues) => (value: string) =>
    onChange({ ...values, [key]: value });

  const listed =
    organizations.status === "ok" ? organizations.organizations : [];
  const unlisted =
    organizations.status === "ok" &&
    values.organizationId !== "" &&
    !listed.some((o) => o.organizationId === values.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <fieldset disabled={disabled}>
        <legend className={LEGEND}>基本情報</legend>
        <div className={GRID}>
          <TextField
            label="氏名 *"
            value={values.name}
            onChange={update("name")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="山田 太郎"
            autoComplete="off"
            required
          />
          <TextField
            label="カナ氏名 *"
            value={values.nameKana}
            onChange={update("nameKana")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="ヤマダ タロウ"
            autoComplete="off"
            required
          />
          <Select
            label="性別 *"
            value={values.gender}
            onChange={update("gender")}
            autoComplete="off"
            required
          >
            <option value="">選択してください</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {genderLabel(gender)}
              </option>
            ))}
          </Select>
          <TextField
            label="生年月日 *"
            type="date"
            value={values.birthDate}
            onChange={update("birthDate")}
            max={todayInputValue()}
            autoComplete="off"
            required
          />
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className={LEGEND}>所属（任意）</legend>
        <div className={GRID}>
          <Select
            label="所属組織"
            value={values.organizationId}
            onChange={update("organizationId")}
            autoComplete="off"
            disabled={organizations.status !== "ok"}
          >
            <option value="">未選択</option>
            {unlisted && (
              <option value={values.organizationId}>
                選択中の組織（一覧にありません）
              </option>
            )}
            {listed.map((organization) => (
              <option
                key={organization.organizationId}
                value={organization.organizationId}
              >
                {organization.name}
              </option>
            ))}
          </Select>
          {organizations.status === "error" && (
            <div className="self-end">
              <p className="text-subtle text-xs">
                組織を取得できませんでした。
              </p>
              <div className="mt-2">
                <SecondaryButton onClick={organizations.retry}>
                  組織を再取得
                </SecondaryButton>
              </div>
            </div>
          )}
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
            placeholder="09012345678"
            autoComplete="off"
          />
          <TextField
            label="メールアドレス"
            type="email"
            value={values.email}
            onChange={update("email")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="taro@example.com"
            autoComplete="off"
          />
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className={LEGEND}>住所（任意）</legend>
        <div className={GRID}>
          <TextField
            label="郵便番号"
            inputMode="numeric"
            value={values.postalCode}
            onChange={update("postalCode")}
            placeholder="1000001"
            autoComplete="off"
          />
          <Select
            label="都道府県"
            value={values.prefecture}
            onChange={update("prefecture")}
            autoComplete="off"
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
            autoComplete="off"
          />
          <TextField
            label="番地"
            value={values.street}
            onChange={update("street")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="千代田1-1"
            autoComplete="off"
          />
          <TextField
            label="建物名・部屋番号"
            value={values.building}
            onChange={update("building")}
            maxLength={TEXT_MAX_LENGTH}
            className="sm:col-span-2"
            autoComplete="off"
          />
        </div>
      </fieldset>

      <fieldset disabled={disabled}>
        <legend className={LEGEND}>緊急連絡先（任意）</legend>
        <div className={GRID}>
          <TextField
            label="氏名"
            value={values.emergencyContactName}
            onChange={update("emergencyContactName")}
            maxLength={TEXT_MAX_LENGTH}
            autoComplete="off"
          />
          <TextField
            label="続柄"
            value={values.emergencyContactRelationship}
            onChange={update("emergencyContactRelationship")}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="配偶者"
            autoComplete="off"
          />
          <TextField
            label="電話番号"
            type="tel"
            inputMode="tel"
            value={values.emergencyContactPhone}
            onChange={update("emergencyContactPhone")}
            placeholder="09012345678"
            autoComplete="off"
          />
        </div>
      </fieldset>
    </div>
  );
}
