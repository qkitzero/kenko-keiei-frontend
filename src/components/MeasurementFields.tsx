"use client";

import Checkbox from "@/components/Checkbox";
import { FIELD_GRID, FIELD_LEGEND } from "@/components/Field";
import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import TextField from "@/components/TextField";
import { todayInputValue } from "@/lib/date";
import {
  cellKey,
  setEntryUnmeasurable,
  sideLabel,
  sidesOf,
  valuePositionLabel,
  type MeasurementCellValues,
  type MeasurementEntryFormValues,
  type MeasurementFormValues,
  type Side,
} from "@/lib/measurement";
import {
  CHOICE_MAX_LENGTH,
  categoryLabel,
  choicesOf,
  groupByCategory,
  levelOptionsOf,
  pairedLabels,
  trialIndexes,
  unitLabel,
  type MeasurementItem,
} from "@/lib/measurementItem";
import { TEXT_MAX_LENGTH } from "@/lib/text";
import { useState } from "react";

type MeasurementFieldsProps = {
  items: MeasurementItem[];
  values: MeasurementFormValues;
  onChange: (values: MeasurementFormValues) => void;
  disabled?: boolean;
};

const VALUE_WIDTH = "w-20";

export default function MeasurementFields({
  items,
  values,
  onChange,
  disabled,
}: MeasurementFieldsProps) {
  const updateEntry = (itemId: string, entry: MeasurementEntryFormValues) =>
    onChange({ ...values, entries: { ...values.entries, [itemId]: entry } });

  return (
    <div className="flex flex-col gap-6">
      <fieldset disabled={disabled}>
        <legend className={FIELD_LEGEND}>測定情報</legend>
        <div className={FIELD_GRID}>
          <TextField
            label="測定日 *"
            type="date"
            value={values.measuredOn}
            onChange={(measuredOn) => onChange({ ...values, measuredOn })}
            max={todayInputValue()}
            autoComplete="off"
            required
          />
        </div>
      </fieldset>

      {groupByCategory(items).map((group) => (
        <fieldset key={group.category} disabled={disabled}>
          <legend className={FIELD_LEGEND}>
            {categoryLabel(group.category)}
          </legend>
          <div className="divide-border mt-1 divide-y">
            {group.items.map((item) => {
              const itemId = item.measurementItemId;
              const entry = itemId ? values.entries[itemId] : undefined;
              if (!itemId || !entry) return null;

              return (
                <MeasurementEntryFields
                  key={itemId}
                  item={item}
                  entry={entry}
                  onChange={(next) => updateEntry(itemId, next)}
                />
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

type MeasurementEntryFieldsProps = {
  item: MeasurementItem;
  entry: MeasurementEntryFormValues;
  onChange: (entry: MeasurementEntryFormValues) => void;
};

function MeasurementEntryFields({
  item,
  entry,
  onChange,
}: MeasurementEntryFieldsProps) {
  const [noteExpanded, setNoteExpanded] = useState<boolean | null>(null);

  const name = item.name ?? "測定項目";
  const unit = unitLabel(item.unit);
  const trials = trialIndexes(item);
  const sides = sidesOf(item);

  const hasNote = entry.note.trim() !== "";
  const noteOpen = noteExpanded ?? (hasNote || entry.unmeasurable);

  const handleUnmeasurable = (checked: boolean) => {
    if (checked) setNoteExpanded(true);
    onChange(setEntryUnmeasurable(entry, checked));
  };

  const handleNote = (note: string) => {
    setNoteExpanded(true);
    onChange({ ...entry, note });
  };

  const updateCell = (key: string, patch: Partial<MeasurementCellValues>) => {
    const cell = entry.cells[key];
    if (!cell) return;
    onChange({
      ...entry,
      cells: { ...entry.cells, [key]: { ...cell, ...patch } },
    });
  };

  const valueLabel = (trialIndex: number, side: Side) =>
    `${name}${valuePositionLabel(item, trialIndex, side)}`;

  function cell(trialIndex: number, side: Side) {
    const key = cellKey(trialIndex, side);
    const values = entry.cells[key];
    if (!values) return null;

    const label = valueLabel(trialIndex, side);

    if (item.valueType === "VALUE_TYPE_PAIRED") {
      const [first, second] = pairedLabels(item);
      return (
        <div className="flex items-center gap-1">
          <TextField
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label}の${first}`}
            className={VALUE_WIDTH}
            value={values.value}
            onChange={(value) => updateCell(key, { value })}
          />
          <span className="text-subtle text-xs">/</span>
          <TextField
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label}の${second}`}
            className={VALUE_WIDTH}
            value={values.valueSecondary}
            onChange={(valueSecondary) => updateCell(key, { valueSecondary })}
          />
        </div>
      );
    }

    if (item.valueType === "VALUE_TYPE_CHOICE") {
      const choices = choicesOf(item);
      if (choices.length === 0) {
        return (
          <TextField
            autoComplete="off"
            aria-label={label}
            maxLength={CHOICE_MAX_LENGTH}
            className="w-32"
            value={values.valueChoice}
            onChange={(valueChoice) => updateCell(key, { valueChoice })}
          />
        );
      }
      return (
        <Select
          aria-label={label}
          className="w-32"
          value={values.valueChoice}
          onChange={(valueChoice) => updateCell(key, { valueChoice })}
        >
          <option value="">未入力</option>
          {values.valueChoice && !choices.includes(values.valueChoice) && (
            <option value={values.valueChoice}>
              {values.valueChoice}（一覧にありません）
            </option>
          )}
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
              {unit}
            </option>
          ))}
        </Select>
      );
    }

    if (item.valueType !== "VALUE_TYPE_NUMERIC") {
      return (
        <p className="text-subtle text-xs">この項目の入力形式には未対応です</p>
      );
    }

    const levels = levelOptionsOf(item);
    if (levels.length > 0) {
      const known = levels.some(
        (option) => String(option.level) === values.value,
      );
      return (
        <Select
          aria-label={label}
          className="w-32"
          value={values.value}
          onChange={(value) => updateCell(key, { value })}
        >
          <option value="">未入力</option>
          {values.value && !known && (
            <option value={values.value}>
              {values.value}（一覧にありません）
            </option>
          )}
          {levels.map((option) => (
            <option key={option.level} value={option.level}>
              {option.label}
            </option>
          ))}
        </Select>
      );
    }

    return (
      <TextField
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        className={VALUE_WIDTH}
        value={values.value}
        onChange={(value) => updateCell(key, { value })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground text-sm font-medium">
          {name}
          {unit && <span className="text-subtle font-normal">（{unit}）</span>}
        </p>
        <div className="flex items-center gap-3">
          <SecondaryButton
            size="sm"
            variant="quiet"
            aria-label={`${name}のメモ`}
            aria-expanded={noteOpen}
            onClick={() => setNoteExpanded(!noteOpen)}
          >
            メモ
          </SecondaryButton>
          <Checkbox
            label="測定不可"
            aria-label={`${name}は測定不可`}
            checked={entry.unmeasurable}
            onChange={handleUnmeasurable}
          />
        </div>
      </div>

      {!entry.unmeasurable && trials.length > 0 && (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-x-3 border-spacing-y-1 text-sm">
            {trials.length > 1 && (
              <thead>
                <tr>
                  {item.bilateral && <td />}
                  {trials.map((trialIndex) => (
                    <th
                      key={trialIndex}
                      scope="col"
                      className="text-subtle text-xs font-medium"
                    >
                      {trialIndex}回目
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {sides.map((side) => (
                <tr key={side}>
                  {item.bilateral && (
                    <th
                      scope="row"
                      className="text-muted text-xs font-medium whitespace-nowrap"
                    >
                      {sideLabel(side)}
                    </th>
                  )}
                  {trials.map((trialIndex) => (
                    <td key={trialIndex}>{cell(trialIndex, side)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {noteOpen && (
        <TextArea
          rows={2}
          autoFocus={noteExpanded === true}
          autoComplete="off"
          aria-label={`${name}のメモ`}
          placeholder="測定の条件や気付いたこと（任意）"
          maxLength={TEXT_MAX_LENGTH}
          className="w-full"
          value={entry.note}
          onChange={handleNote}
        />
      )}

      {!noteOpen && hasNote && (
        <p className="text-subtle text-xs">{entry.note}</p>
      )}
    </div>
  );
}
