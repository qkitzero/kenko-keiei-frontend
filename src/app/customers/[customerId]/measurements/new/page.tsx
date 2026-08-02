"use client";

import Card from "@/components/Card";
import LoginButton from "@/components/LoginButton";
import MeasurementFields from "@/components/MeasurementFields";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import { useUser } from "@/context/UserContext";
import { ensureOk, errorMessage } from "@/lib/apiError";
import { todayInputValue } from "@/lib/date";
import {
  buildMeasurementPayload,
  emptyMeasurementForm,
  type MeasurementFormValues,
} from "@/lib/measurement";
import { useCustomerName } from "@/lib/useCustomerName";
import { useMeasurementItems } from "@/lib/useMeasurementItems";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";

export default function MeasurementRegisterPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  return <MeasurementRegister key={customerId} customerId={customerId} />;
}

function MeasurementRegister({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const items = useMeasurementItems();
  const customerName = useCustomerName(customerId);

  const [edited, setEdited] = useState<MeasurementFormValues | null>(null);
  const [saving, setSaving] = useState<"draft" | "final" | null>(null);
  const [error, setError] = useState("");

  const initial = useMemo(
    () =>
      items.status === "ok"
        ? emptyMeasurementForm(items.data, todayInputValue())
        : null,
    [items],
  );

  if (userLoading || items.status === "loading") {
    return (
      <PageContainer>
        <div className="bg-placeholder h-9 w-56 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-64 w-full animate-pulse rounded-2xl" />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer centered>
        <p className="text-subtle text-sm">
          測定を記録するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  if (items.status === "unauthenticated") {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          サインインの有効期限が切れました
        </h1>
        <p className="text-subtle text-sm">再度サインインしてください。</p>
        <div className="w-40">
          <LoginButton />
        </div>
      </PageContainer>
    );
  }

  if (items.status === "error" || !initial) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          測定項目を取得できませんでした
        </h1>
        <p className="text-subtle text-sm">
          測定項目を読み込めないため、測定を記録できません。
        </p>
        {items.status === "error" && (
          <SecondaryButton onClick={items.retry}>再試行</SecondaryButton>
        )}
        <Link
          href={`/customers/${customerId}`}
          className="text-muted text-sm underline"
        >
          顧客詳細に戻る
        </Link>
      </PageContainer>
    );
  }

  const values = edited ?? initial;

  const handleSave = async (isDraft: boolean) => {
    if (saving) return;

    const built = buildMeasurementPayload(values, items.data, isDraft);
    if (!built.ok) {
      setError(built.error);
      return;
    }

    setSaving(isDraft ? "draft" : "final");
    setError("");

    try {
      const res = await fetch(
        `/api/fitness/customer/${customerId}/measurement/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(built.payload),
        },
      );
      await ensureOk(res, "測定の記録に失敗しました");

      const { measurementId } = await res.json();
      if (!measurementId) {
        throw new Error("測定の記録に失敗しました");
      }

      router.push(`/customers/${customerId}/measurements/${measurementId}`);
    } catch (err: unknown) {
      setError(errorMessage(err));
      setSaving(null);
    }
  };

  const busy = saving !== null;

  return (
    <PageContainer>
      <div>
        <Link
          href={`/customers/${customerId}`}
          className="text-subtle text-sm hover:underline"
        >
          ← 顧客詳細
        </Link>
      </div>

      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          測定を記録
        </h1>
        <p className="text-muted mt-2">
          {customerName ? `${customerName} さんの測定結果` : "測定結果"}
          を入力してください。入力しなかった項目は保存されません。
        </p>
      </section>

      <Card>
        <h2 className="text-foreground text-sm font-medium">新しい測定</h2>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-4 flex flex-col gap-6"
        >
          <MeasurementFields
            items={items.data}
            values={values}
            onChange={setEdited}
            disabled={busy}
          />

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <SecondaryButton
              onClick={() => void handleSave(true)}
              disabled={busy}
            >
              {saving === "draft" ? "保存中..." : "下書きとして保存"}
            </SecondaryButton>
            <PrimaryButton
              onClick={() => void handleSave(false)}
              disabled={busy}
            >
              {saving === "final" ? "保存中..." : "確定して保存"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
