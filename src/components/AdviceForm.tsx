"use client";

import Card from "@/components/Card";
import PrimaryButton from "@/components/PrimaryButton";
import TextArea from "@/components/TextArea";
import { ensureOk, runWithError } from "@/lib/apiError";
import { ADVICE_MAX_LENGTH, buildAdvicePayload } from "@/lib/judgment";
import { useState } from "react";

export default function AdviceForm({
  measurementId,
  advice,
}: {
  measurementId: string;
  advice: string;
}) {
  const [value, setValue] = useState(advice);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const length = [...value.trim()].length;

  const handleChange = (next: string) => {
    setValue(next);
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const parsed = buildAdvicePayload(value);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setSaving(true);
    setSaved(false);
    void runWithError(setError, async () => {
      const res = await fetch(
        `/api/fitness/measurement/${measurementId}/judgment/advice`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.payload),
        },
      );
      await ensureOk(res, "アドバイスの保存に失敗しました");

      const submitted = parsed.payload.advice ?? "";
      const data = await res.json().catch(() => null);
      setValue(typeof data?.advice === "string" ? data.advice : submitted);
      setSaved(true);
    }).finally(() => setSaving(false));
  };

  return (
    <Card title="アドバイス">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextArea
          label="アドバイス"
          value={value}
          onChange={handleChange}
          rows={6}
          disabled={saving}
          placeholder="判定結果をもとにした助言を記録します"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={`text-xs tabular-nums ${
              length > ADVICE_MAX_LENGTH ? "text-danger" : "text-subtle"
            }`}
          >
            {length} / {ADVICE_MAX_LENGTH}文字
          </p>
          <div className="flex items-center gap-3">
            {saved && <p className="text-subtle text-sm">保存しました</p>}
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </PrimaryButton>
          </div>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}
      </form>
    </Card>
  );
}
