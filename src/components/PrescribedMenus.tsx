"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import TextField from "@/components/TextField";
import { isEmptyJudgment, type Judgment } from "@/lib/judgment";
import {
  PRESCRIPTION_AMOUNT_MAX,
  PRESCRIPTION_SETS_MAX,
  amountLabel,
  emptyPrescriptionMessage,
  groupTrainingMenus,
  menuCategoryLabel,
  menuUnit,
  prescribedCategoryLabel,
  prescribedUnitLabel,
  sourceLabel,
  volumeLabel,
  type PrescribedMenu,
  type PrescriptionRow,
} from "@/lib/prescription";
import {
  findTrainingMenu,
  trainingMenusById,
  type TrainingMenu,
} from "@/lib/trainingMenu";
import type { Prescription } from "@/lib/usePrescription";
import type { ResourceState } from "@/lib/useResource";
import { useMemo } from "react";

function MenuList({
  menus,
  byId,
  showSource,
}: {
  menus: PrescribedMenu[];
  byId: Map<string, TrainingMenu>;
  showSource: boolean;
}) {
  return (
    <ul className="divide-border divide-y">
      {menus.map((menu, index) => {
        const master = findTrainingMenu(byId, menu.trainingMenuId);
        const source = showSource ? sourceLabel(menu.source) : "";
        const category =
          prescribedCategoryLabel(menu) ||
          (master ? menuCategoryLabel(master) : "");
        return (
          <li
            key={`${menu.trainingMenuId ?? ""}-${index}`}
            className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 print:break-inside-avoid print:py-1"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-foreground text-sm">
                {menu.trainingMenuName || master?.name || "（種目名なし）"}
              </span>
              <span className="text-foreground shrink-0 text-right text-sm tabular-nums">
                {volumeLabel(menu.amount, menu.unit, menu.sets)}
              </span>
            </div>
            {(category || source) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-subtle text-xs">{category}</span>
                {source && (
                  <Badge size="sm" tone="subtle" className="print:hidden">
                    {source}
                  </Badge>
                )}
              </div>
            )}
            {master?.instruction && (
              <p className="text-muted text-xs">{master.instruction}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MenuRowFields({
  row,
  position,
  options,
  byId,
  source,
  onChange,
  onRemove,
}: {
  row: PrescriptionRow;
  position: number;
  options: React.ReactNode;
  byId: Map<string, TrainingMenu>;
  source: string;
  onChange: (row: PrescriptionRow) => void;
  onRemove: () => void;
}) {
  const selected = findTrainingMenu(byId, row.trainingMenuId);
  const unit = selected ? menuUnit(selected) : undefined;

  const handleMenuChange = (trainingMenuId: string) => {
    const next = findTrainingMenu(byId, trainingMenuId);
    onChange({
      ...row,
      trainingMenuId,
      amount: typeof next?.amount === "number" ? String(next.amount) : "",
      sets: typeof next?.sets === "number" ? String(next.sets) : "",
    });
  };

  return (
    <li className="border-border flex flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label={`${position}件目の種目`}
          autoComplete="off"
          className="min-w-56 flex-1"
          value={row.trainingMenuId}
          onChange={handleMenuChange}
        >
          <option value="">種目を選択</option>
          {row.trainingMenuId && !selected && (
            <option value={row.trainingMenuId}>
              一覧にない種目（選び直してください）
            </option>
          )}
          {options}
        </Select>

        <div className="flex items-center gap-1.5">
          <TextField
            inputMode="numeric"
            autoComplete="off"
            aria-label={`${position}件目の${amountLabel(unit)}`}
            maxLength={String(PRESCRIPTION_AMOUNT_MAX).length}
            className="w-16"
            value={row.amount}
            onChange={(amount) => onChange({ ...row, amount })}
          />
          <span className="text-muted w-4 text-sm">
            {prescribedUnitLabel(unit)}
          </span>
          <span className="text-subtle text-sm">×</span>
          <TextField
            inputMode="numeric"
            autoComplete="off"
            aria-label={`${position}件目のセット数`}
            maxLength={String(PRESCRIPTION_SETS_MAX).length}
            className="w-16"
            value={row.sets}
            onChange={(sets) => onChange({ ...row, sets })}
          />
          <span className="text-muted text-sm">セット</span>
        </div>

        <SecondaryButton
          size="sm"
          variant="danger"
          aria-label={`${position}件目を削除`}
          onClick={onRemove}
        >
          削除
        </SecondaryButton>
      </div>

      {selected && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-subtle text-xs">
              {menuCategoryLabel(selected)}
            </span>
            {source && (
              <Badge size="sm" tone="subtle">
                {source}
              </Badge>
            )}
          </div>
          {selected.instruction && (
            <p className="text-muted text-xs">{selected.instruction}</p>
          )}
        </>
      )}
    </li>
  );
}

export default function PrescribedMenus({
  judgment,
  trainingMenus,
  prescription,
}: {
  judgment: Judgment;
  trainingMenus: ResourceState<TrainingMenu[]>;
  prescription: Prescription;
}) {
  const menus = trainingMenus.status === "ok" ? trainingMenus.data : null;
  const loadingMenus = trainingMenus.status === "loading";

  const byId = useMemo(() => trainingMenusById(menus ?? []), [menus]);
  const options = useMemo(
    () =>
      groupTrainingMenus(menus ?? []).map((group) => (
        <optgroup key={group.key} label={group.label}>
          {group.menus.map((menu) => (
            <option key={menu.trainingMenuId} value={menu.trainingMenuId}>
              {menu.name}
            </option>
          ))}
        </optgroup>
      )),
    [menus],
  );

  const { savedMenus, rows, override, unsaved, busy, saving, saved, error } =
    prescription;
  const editable = menus !== null && menus.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    prescription.save();
  };

  return (
    <Card
      title="処方"
      splittable
      className={savedMenus.length > 0 ? undefined : "print:hidden"}
    >
      <div className="flex flex-col gap-4">
        {savedMenus.length === 0 ? (
          <p className="text-muted text-sm">
            {emptyPrescriptionMessage(isEmptyJudgment(judgment))}
          </p>
        ) : (
          <p className="text-subtle text-xs">
            {override
              ? "スタッフが編集した処方です。自動処方は使われていません。"
              : "判定結果から自動で処方された内容です。保存されているものではなく、判定のたびに計算されます。"}
          </p>
        )}

        {!loadingMenus && menus === null && savedMenus.length > 0 && (
          <p className="text-danger text-sm">
            トレーニングメニューを取得できなかったため、実施方法の説明は表示できません。
          </p>
        )}

        {editable ? (
          <>
            <form onSubmit={handleSubmit} className="print:hidden">
              <fieldset disabled={busy}>
                <ul className="flex flex-col">
                  {rows.map((row, index) => (
                    <MenuRowFields
                      key={row.key}
                      row={row}
                      position={index + 1}
                      options={options}
                      byId={byId}
                      source={prescription.sourceOf(row.trainingMenuId)}
                      onChange={(next) =>
                        prescription.setRows(
                          rows.map((current) =>
                            current.key === row.key ? next : current,
                          ),
                        )
                      }
                      onRemove={() =>
                        prescription.setRows(
                          rows.filter((current) => current.key !== row.key),
                        )
                      }
                    />
                  ))}
                </ul>

                {rows.length === 0 && (
                  <p className="text-subtle mt-3 text-sm">
                    処方には種目が1件以上必要です。
                    {override
                      ? "種目を追加するか、自動処方に戻してください。"
                      : "種目を追加してください。"}
                  </p>
                )}

                {error && <p className="text-danger mt-3 text-sm">{error}</p>}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <SecondaryButton size="sm" onClick={prescription.addRow}>
                    種目を追加
                  </SecondaryButton>

                  <div className="flex flex-wrap items-center gap-3">
                    {saved && (
                      <p className="text-subtle text-sm">保存しました</p>
                    )}
                    {unsaved && (
                      <p className="text-warning text-sm">
                        未保存の変更は印刷されません
                      </p>
                    )}
                    <PrimaryButton
                      type="submit"
                      disabled={busy || rows.length === 0}
                    >
                      {saving ? "保存中..." : "保存"}
                    </PrimaryButton>
                  </div>
                </div>
              </fieldset>
            </form>

            {savedMenus.length > 0 && (
              <div className="hidden print:block">
                <MenuList
                  menus={savedMenus}
                  byId={byId}
                  showSource={!override}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {savedMenus.length > 0 && (
              <MenuList menus={savedMenus} byId={byId} showSource={!override} />
            )}
            {!loadingMenus && (
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <p className="text-warning text-sm">
                  {menus === null
                    ? "トレーニングメニューを取得できないため、処方は編集できません。"
                    : "トレーニングメニューが登録されていないため、処方は編集できません。"}
                </p>
                {trainingMenus.status === "error" && (
                  <SecondaryButton size="sm" onClick={trainingMenus.retry}>
                    再試行
                  </SecondaryButton>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
