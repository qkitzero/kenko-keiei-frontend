"use client";

import { ensureOk, runWithError } from "@/lib/apiError";
import type { Judgment } from "@/lib/judgment";
import {
  buildPrescriptionPayload,
  isOverride,
  sourceLabel,
  type PrescribedMenu,
  type PrescribedMenuInput,
  type PrescriptionRow,
} from "@/lib/prescription";
import {
  findTrainingMenu,
  trainingMenusById,
  type TrainingMenu,
} from "@/lib/trainingMenu";
import { judgmentUrl, selectJudgment } from "@/lib/useJudgment";
import { useMemo, useRef, useState } from "react";

function rowKey(index: number): string {
  return `row-${index}`;
}

function toRows(
  menus: PrescribedMenu[],
  keyAt: (index: number) => string,
): PrescriptionRow[] {
  return menus.map((menu, index) => ({
    key: keyAt(index),
    trainingMenuId: menu.trainingMenuId ?? "",
    amount: typeof menu.amount === "number" ? String(menu.amount) : "",
    sets: typeof menu.sets === "number" ? String(menu.sets) : "",
  }));
}

function rowsSignature(rows: PrescriptionRow[]): string {
  return rows
    .map(
      (row) =>
        `${row.trainingMenuId.trim().toLowerCase()}|${row.amount.trim()}|${row.sets.trim()}`,
    )
    .join(",");
}

function menusSignature(menus: PrescribedMenu[]): string {
  return menus
    .map(
      (menu) =>
        `${(menu.trainingMenuId ?? "").trim().toLowerCase()}|${menu.amount ?? ""}|${menu.sets ?? ""}`,
    )
    .join(",");
}

function submittedMenus(
  inputs: PrescribedMenuInput[],
  byId: Map<string, TrainingMenu>,
): PrescribedMenu[] {
  return inputs.map((input) => ({
    ...input,
    source: "PRESCRIPTION_SOURCE_MANUAL",
    trainingMenuName: findTrainingMenu(byId, input.trainingMenuId)?.name ?? "",
  }));
}

function sourcesByMenuId(menus: PrescribedMenu[]): Map<string, string> {
  const bySource = new Map<string, string>();
  for (const menu of menus) {
    const id = menu.trainingMenuId?.trim().toLowerCase();
    if (id) bySource.set(id, sourceLabel(menu.source));
  }
  return bySource;
}

async function fetchPrescribedMenus(
  measurementId: string,
): Promise<PrescribedMenu[] | null> {
  const res = await fetch(judgmentUrl(measurementId));
  if (!res.ok) return null;
  const judgment = selectJudgment(await res.json().catch(() => null));
  return judgment ? (judgment.prescribedMenus ?? []) : null;
}

function prescriptionUrl(measurementId: string): string {
  return `/api/fitness/measurement/${measurementId}/prescription`;
}

export type Prescription = {
  savedMenus: PrescribedMenu[];
  rows: PrescriptionRow[];
  override: boolean;
  unsaved: boolean;
  busy: boolean;
  saving: boolean;
  reverting: boolean;
  saved: boolean;
  error: string;
  revertError: string;
  sourceOf: (trainingMenuId: string) => string;
  setRows: (rows: PrescriptionRow[]) => void;
  addRow: () => void;
  save: () => void;
  revert: () => void;
};

export function usePrescription(
  measurementId: string,
  judgment: Judgment,
  trainingMenus: TrainingMenu[] | null,
): Prescription {
  const initialMenus = useMemo(
    () => judgment.prescribedMenus ?? [],
    [judgment],
  );
  const keyRef = useRef(initialMenus.length);
  const nextKey = () => rowKey(keyRef.current++);
  const keepKeys = (current: PrescriptionRow[]) => (index: number) =>
    current[index]?.key ?? nextKey();

  const [savedMenus, setSavedMenus] = useState<PrescribedMenu[]>(initialMenus);
  const [rows, setStateRows] = useState<PrescriptionRow[]>(() =>
    toRows(initialMenus, rowKey),
  );
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [revertError, setRevertError] = useState("");

  const byId = useMemo(
    () => trainingMenusById(trainingMenus ?? []),
    [trainingMenus],
  );
  const override = isOverride(savedMenus);
  const savedSources = useMemo(
    () => (override ? new Map<string, string>() : sourcesByMenuId(savedMenus)),
    [override, savedMenus],
  );
  const busy = saving || reverting;

  const setRows = (next: PrescriptionRow[]) => {
    setStateRows(next);
    setSaved(false);
    setError("");
  };

  const addRow = () =>
    setRows([
      ...rows,
      { key: nextKey(), trainingMenuId: "", amount: "", sets: "" },
    ]);

  const save = () => {
    if (busy || !trainingMenus) return;

    const parsed = buildPrescriptionPayload(rows, trainingMenus);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setSaving(true);
    setSaved(false);
    void runWithError(setError, async () => {
      const res = await fetch(prescriptionUrl(measurementId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.payload),
      });
      await ensureOk(res, "処方の保存に失敗しました");

      const body = await res.json().catch(() => null);
      const returned = (body as { prescribedMenus?: PrescribedMenu[] } | null)
        ?.prescribedMenus;
      const stored =
        returned && returned.length > 0
          ? returned
          : submittedMenus(parsed.payload.prescribedMenus ?? [], byId);
      setSavedMenus(stored);
      setStateRows(toRows(stored, keepKeys(rows)));
      setSaved(true);
    }).finally(() => setSaving(false));
  };

  const revert = () => {
    if (busy) return;
    if (
      !window.confirm(
        "編集した処方を削除し、自動処方に戻します。元に戻せません。よろしいですか？",
      )
    ) {
      return;
    }

    setReverting(true);
    setSaved(false);
    void runWithError(setRevertError, async () => {
      const res = await fetch(prescriptionUrl(measurementId), {
        method: "DELETE",
      });
      await ensureOk(res, "自動処方に戻せませんでした");

      const refreshed = await fetchPrescribedMenus(measurementId);
      if (!refreshed) {
        throw new Error(
          "自動処方に戻しましたが、最新の内容を読み込めませんでした。ページを再読み込みしてください。",
        );
      }
      setSavedMenus(refreshed);
      setStateRows(toRows(refreshed, keepKeys(rows)));
      setError("");
    }).finally(() => setReverting(false));
  };

  return {
    savedMenus,
    rows,
    override,
    unsaved: rowsSignature(rows) !== menusSignature(savedMenus),
    busy,
    saving,
    reverting,
    saved,
    error,
    revertError,
    sourceOf: (trainingMenuId) =>
      savedSources.get(trainingMenuId.trim().toLowerCase()) ?? "",
    setRows,
    addRow,
    save,
    revert,
  };
}
