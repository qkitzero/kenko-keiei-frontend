"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import LoginButton from "@/components/LoginButton";
import MeasurementFields from "@/components/MeasurementFields";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import { useUser } from "@/context/UserContext";
import { ensureOk, runWithError } from "@/lib/apiError";
import { dateLabel } from "@/lib/date";
import {
  buildMeasurementPayload,
  measurementDataLoss,
  measurementToForm,
  type Measurement,
  type MeasurementFormValues,
} from "@/lib/measurement";
import { useCustomerName } from "@/lib/useCustomerName";
import { useMeasurementItems } from "@/lib/useMeasurementItems";
import { isSameId } from "@/lib/uuid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";

type LoadResult =
  | { status: "ok"; data: Measurement }
  | { status: "not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

async function loadMeasurement(measurementId: string): Promise<LoadResult> {
  const res = await fetch(`/api/fitness/measurement/${measurementId}`);
  if (!res.ok) {
    if (res.status === 404) return { status: "not_found" };
    if (res.status === 401) return { status: "unauthenticated" };
    return { status: "error" };
  }
  const data = await res.json();
  if (!data.measurement?.measurementId) return { status: "not_found" };
  return { status: "ok", data: data.measurement };
}

export default function MeasurementDetailPage({
  params,
}: {
  params: Promise<{ customerId: string; measurementId: string }>;
}) {
  const { customerId, measurementId } = use(params);
  return (
    <MeasurementDetail
      key={measurementId}
      customerId={customerId}
      measurementId={measurementId}
    />
  );
}

function MeasurementDetail({
  customerId,
  measurementId,
}: {
  customerId: string;
  measurementId: string;
}) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const items = useMeasurementItems();
  const customerName = useCustomerName(customerId);

  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [fetched, setFetched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [edited, setEdited] = useState<MeasurementFormValues | null>(null);
  const [saving, setSaving] = useState<"draft" | "final" | null>(null);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const applyResult = useCallback(
    (result: LoadResult) => {
      if (result.status === "ok") {
        if (!isSameId(result.data.customerId, customerId)) {
          setNotFound(true);
          return;
        }
        setMeasurement(result.data);
        setEdited(null);
        setNotFound(false);
        setUnauthenticated(false);
        setLoadError(false);
      } else if (result.status === "not_found") {
        setNotFound(true);
      } else if (result.status === "unauthenticated") {
        setUnauthenticated(true);
      } else {
        setLoadError(true);
      }
    },
    [customerId],
  );

  useEffect(() => {
    if (userLoading || !user) return;
    let active = true;
    (async () => {
      const result = await loadMeasurement(measurementId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      applyResult(result);
      setFetched(true);
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, measurementId, applyResult]);

  const initial = useMemo(
    () =>
      measurement && items.status === "ok"
        ? measurementToForm(measurement, items.data)
        : null,
    [measurement, items],
  );

  const dataLoss = useMemo(
    () =>
      measurement && items.status === "ok"
        ? measurementDataLoss(measurement, items.data)
        : null,
    [measurement, items],
  );

  if (userLoading) {
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
          この測定を表示するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  if (!fetched || items.status === "loading") {
    return (
      <PageContainer>
        <div className="bg-placeholder h-9 w-56 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-64 w-full animate-pulse rounded-2xl" />
      </PageContainer>
    );
  }

  if (unauthenticated || items.status === "unauthenticated") {
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

  if (notFound) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          測定が見つかりません
        </h1>
        <Link
          href={`/customers/${customerId}`}
          className="text-muted text-sm underline"
        >
          顧客詳細に戻る
        </Link>
      </PageContainer>
    );
  }

  if (loadError || !measurement) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          測定を読み込めませんでした
        </h1>
        <p className="text-subtle text-sm">時間をおいて再度お試しください。</p>
        <Link
          href={`/customers/${customerId}`}
          className="text-muted text-sm underline"
        >
          顧客詳細に戻る
        </Link>
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
          測定項目を読み込めないため、測定を表示できません。
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

  const isDraft = measurement.isDraft === true;
  const values = edited ?? initial;
  const busy = saving !== null || deleting;

  const handleSave = (draft: boolean) => {
    if (busy) return;

    const built = buildMeasurementPayload(values, items.data, draft);
    if (!built.ok) {
      setSaveError(built.error);
      return;
    }

    setSaving(draft ? "draft" : "final");
    void runWithError(setSaveError, async () => {
      const res = await fetch(`/api/fitness/measurement/${measurementId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built.payload),
      });
      await ensureOk(res, "測定の更新に失敗しました");

      const data = await res.json().catch(() => null);
      if (data?.measurement?.measurementId) {
        setMeasurement(data.measurement);
        setEdited(null);
        return;
      }

      const reloaded = await loadMeasurement(measurementId).catch(
        () => ({ status: "error" }) as const,
      );
      if (reloaded.status !== "ok") {
        throw new Error(
          "更新は完了しましたが、最新の情報を取得できませんでした。ページを再読み込みしてください。",
        );
      }
      setMeasurement(reloaded.data);
      setEdited(null);
    }).finally(() => setSaving(null));
  };

  const handleConfirm = () => {
    if (busy) return;
    if (
      isDraft &&
      !window.confirm(
        "この測定を確定しますか？確定した測定を下書きに戻すことはできません。",
      )
    ) {
      return;
    }
    handleSave(false);
  };

  const handleDelete = () => {
    if (busy) return;
    if (
      !window.confirm(
        "本当にこの測定を削除しますか？この操作は取り消せません。",
      )
    ) {
      return;
    }
    setDeleting(true);
    void runWithError(setDeleteError, async () => {
      const res = await fetch(`/api/fitness/measurement/${measurementId}`, {
        method: "DELETE",
      });
      await ensureOk(res, "測定の削除に失敗しました");
      router.push(`/customers/${customerId}`);
    }).finally(() => setDeleting(false));
  };

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
        <h1 className="text-foreground flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight">
          {dateLabel(measurement.measuredOn) || "測定日未登録"}
          {isDraft && <Badge tone="subtle">下書き</Badge>}
        </h1>
        <p className="text-muted mt-1 text-sm">
          {[customerName, `測定時 ${measurement.ageAtMeasurement ?? 0}歳`]
            .filter(Boolean)
            .join(" ・ ")}
        </p>
        <p className="text-subtle mt-1 truncate text-xs">
          {measurement.measurementId}
        </p>
      </section>

      <Card>
        <h2 className="text-foreground text-sm font-medium">測定結果</h2>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-4 flex flex-col gap-6"
        >
          {dataLoss && dataLoss.unknownItemIds.length > 0 && (
            <p className="text-danger text-sm">
              この測定には測定項目マスタに無い項目が
              {dataLoss.unknownItemIds.length}
              件含まれています。このまま保存するとその項目は失われます。
            </p>
          )}

          {dataLoss && dataLoss.droppedValueCount > 0 && (
            <p className="text-danger text-sm">
              測定項目の試行回数・左右の設定が変わったため、表示できない値が
              {dataLoss.droppedValueCount}
              件あります。このまま保存するとその値は失われます。
            </p>
          )}

          <MeasurementFields
            items={items.data}
            values={values}
            onChange={setEdited}
            disabled={busy}
          />

          {saveError && <p className="text-danger text-sm">{saveError}</p>}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {isDraft ? (
              <>
                <SecondaryButton
                  onClick={() => handleSave(true)}
                  disabled={busy}
                >
                  {saving === "draft" ? "保存中..." : "下書きとして保存"}
                </SecondaryButton>
                <PrimaryButton onClick={handleConfirm} disabled={busy}>
                  {saving === "final" ? "保存中..." : "確定して保存"}
                </PrimaryButton>
              </>
            ) : (
              <SecondaryButton
                onClick={() => handleSave(false)}
                disabled={busy}
              >
                {saving === "final" ? "保存中..." : "変更を保存"}
              </SecondaryButton>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="text-foreground text-sm font-medium">測定の削除</h2>
        {deleteError && (
          <p className="text-danger mt-3 text-sm">{deleteError}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-subtle text-sm">
            この測定をデータごと削除します。元に戻せません。
          </p>
          <SecondaryButton
            variant="danger"
            onClick={handleDelete}
            disabled={busy}
          >
            {deleting ? "削除中..." : "測定を削除"}
          </SecondaryButton>
        </div>
      </Card>
    </PageContainer>
  );
}
