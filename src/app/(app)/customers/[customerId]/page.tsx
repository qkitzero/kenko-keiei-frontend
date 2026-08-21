"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import CopyableId from "@/components/CopyableId";
import CustomerFields from "@/components/CustomerFields";
import DangerZone from "@/components/DangerZone";
import DetailSummary, { type SummaryItem } from "@/components/DetailSummary";
import LoginButton from "@/components/LoginButton";
import MeasurementHistory from "@/components/MeasurementHistory";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import TenantName from "@/components/TenantName";
import { useUser } from "@/context/UserContext";
import { ensureOk, runWithError } from "@/lib/apiError";
import {
  Customer,
  CustomerFormValues,
  EMPTY_CUSTOMER_FORM,
  buildCustomerPayload,
  customerToForm,
  fieldsNeedingInput,
  genderLabel,
} from "@/lib/customer";
import { currentAge, dateLabel } from "@/lib/date";
import { lastMeasuredLabel } from "@/lib/measurementHistory";
import { organizationName, type OrganizationOptions } from "@/lib/organization";
import { useMeasurements } from "@/lib/useMeasurements";
import { useOrganizations } from "@/lib/useOrganizations";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";

type LoadResult =
  | { status: "ok"; data: Customer }
  | { status: "not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

async function loadCustomer(customerId: string): Promise<LoadResult> {
  const res = await fetch(`/api/fitness/customer/${customerId}`);
  if (!res.ok) {
    if (res.status === 404) return { status: "not_found" };
    if (res.status === 401) return { status: "unauthenticated" };
    return { status: "error" };
  }
  const data = await res.json();
  if (!data.customer?.customerId) return { status: "not_found" };
  return { status: "ok", data: data.customer };
}

function birthDateValue(customer: Customer): string {
  const birthDate = dateLabel(customer.birthDate);
  if (!birthDate) return "";
  const age = currentAge(customer.birthDate);
  return age === null ? birthDate : `${birthDate}（${age}歳）`;
}

function organizationValue(
  organizations: OrganizationOptions,
  organizationId: string | undefined,
): React.ReactNode {
  if (!organizationId) return "";
  if (organizations.status === "error") {
    return <span className="text-subtle">取得できませんでした</span>;
  }
  return organizationName(organizations, organizationId);
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  return <CustomerDetail key={customerId} customerId={customerId} />;
}

function CustomerDetail({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { loading: userLoading } = useUser();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [fetched, setFetched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [values, setValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [switchingActive, setSwitchingActive] = useState(false);
  const [activeError, setActiveError] = useState("");
  const organizations = useOrganizations(customer?.tenantId ?? "");
  const measurements = useMeasurements(customerId);

  const applyCustomer = useCallback((data: Customer) => {
    setCustomer(data);
    setValues(customerToForm(data));
  }, []);

  const applyResult = useCallback(
    (result: LoadResult) => {
      if (result.status === "ok") {
        applyCustomer(result.data);
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
    [applyCustomer],
  );

  useEffect(() => {
    if (userLoading) return;
    let active = true;
    (async () => {
      const result = await loadCustomer(customerId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      applyResult(result);
      setFetched(true);
    })();
    return () => {
      active = false;
    };
  }, [userLoading, customerId, applyResult]);

  const summaryItems = useMemo<SummaryItem[]>(() => {
    if (!customer) return [];
    return [
      {
        label: "所属テナント",
        value: <TenantName tenantId={customer.tenantId ?? ""} />,
      },
      {
        label: "所属組織",
        value: organizationValue(organizations, customer.organizationId),
        loading:
          Boolean(customer.organizationId) &&
          organizations.status === "loading",
      },
      { label: "性別", value: genderLabel(customer.gender) },
      { label: "生年月日", value: birthDateValue(customer) },
      {
        label: "最終測定日",
        value:
          measurements.status === "ok" ? (
            lastMeasuredLabel(measurements.data)
          ) : measurements.status === "loading" ? (
            ""
          ) : (
            <span className="text-subtle">取得できませんでした</span>
          ),
        loading: measurements.status === "loading",
      },
    ];
  }, [customer, organizations, measurements]);

  const busy = saving || switchingActive;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const built = buildCustomerPayload(values);
    if (!built.ok) {
      setSaveError(built.error);
      return;
    }

    setSaving(true);
    void runWithError(setSaveError, async () => {
      const res = await fetch(`/api/fitness/customer/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built.payload),
      });
      await ensureOk(res, "顧客情報の更新に失敗しました");

      const data = await res.json().catch(() => null);
      if (data?.customer?.customerId) {
        applyCustomer(data.customer);
        return;
      }

      const reloaded = await loadCustomer(customerId).catch(
        () => ({ status: "error" }) as const,
      );
      if (reloaded.status !== "ok") {
        throw new Error(
          "更新は完了しましたが、最新の情報を取得できませんでした。ページを再読み込みしてください。",
        );
      }
      applyCustomer(reloaded.data);
    }).finally(() => setSaving(false));
  };

  const handleSetActive = (isActive: boolean) => {
    if (busy) return;
    setSwitchingActive(true);
    void runWithError(setActiveError, async () => {
      const res = await fetch(`/api/fitness/customer/${customerId}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      await ensureOk(
        res,
        isActive ? "顧客の有効化に失敗しました" : "顧客の無効化に失敗しました",
      );

      const data = await res.json().catch(() => null);
      if (data?.customer?.customerId) {
        setCustomer(data.customer);
        return;
      }

      const reloaded = await loadCustomer(customerId).catch(
        () => ({ status: "error" }) as const,
      );
      if (reloaded.status !== "ok") {
        throw new Error(
          "変更は完了しましたが、最新の情報を取得できませんでした。ページを再読み込みしてください。",
        );
      }
      setCustomer(reloaded.data);
    }).finally(() => setSwitchingActive(false));
  };

  const handleDelete = () => {
    if (deleting) return;
    if (
      !window.confirm(
        "本当にこの顧客を削除しますか？この操作は取り消せません。",
      )
    ) {
      return;
    }
    setDeleting(true);
    void runWithError(setDeleteError, async () => {
      const res = await fetch(`/api/fitness/customer/${customerId}`, {
        method: "DELETE",
      });
      await ensureOk(res, "顧客の削除に失敗しました");
      router.push("/customers");
    }).finally(() => setDeleting(false));
  };

  if (userLoading || !fetched) {
    return <PageSkeleton width="detail" shape="section" summary back />;
  }

  if (notFound) {
    return (
      <PageMessage
        title="顧客が見つかりません"
        link={{ href: "/customers", label: "顧客一覧に戻る" }}
      />
    );
  }

  if (unauthenticated) {
    return (
      <PageMessage
        title="サインインの有効期限が切れました"
        message="再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  if (loadError || !customer) {
    return (
      <PageMessage
        title="顧客を読み込めませんでした"
        message="時間をおいて再度お試しください。"
        link={{ href: "/customers", label: "顧客一覧に戻る" }}
      />
    );
  }

  const isActive = customer.isActive !== false;
  const needsInput = fieldsNeedingInput(customer);

  return (
    <PageContainer width="detail">
      <PageHeader
        backHref="/customers"
        backLabel="顧客一覧"
        title={customer.name ?? ""}
        meta={!isActive && <Badge tone="subtle">無効</Badge>}
        description={customer.nameKana}
      />

      <DetailSummary items={summaryItems} />

      <MeasurementHistory customerId={customerId} measurements={measurements} />

      <Card title="顧客情報">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {needsInput.length > 0 && (
            <p className="text-danger text-sm">
              {needsInput.join("・")}
              が未登録か、現在の入力規則に合っていません。保存するにはこれらの項目を入力してください。
            </p>
          )}

          <CustomerFields
            values={values}
            onChange={setValues}
            disabled={saving}
            organizations={organizations}
          />

          {saveError && <p className="text-danger text-sm">{saveError}</p>}

          <div className="flex justify-end">
            <PrimaryButton type="submit" disabled={busy}>
              {saving ? "保存中..." : "変更を保存"}
            </PrimaryButton>
          </div>
        </form>
      </Card>

      <Card title="利用状態">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-prose">
            <p className="text-foreground text-sm font-medium">
              {isActive ? "有効" : "無効"}
            </p>
            <p className="text-subtle mt-1 text-sm">
              {isActive
                ? "無効にすると顧客一覧に表示されなくなります。データは残るのでいつでも有効に戻せます。"
                : "有効に戻すと顧客一覧に再び表示されます。"}
            </p>
          </div>
          <SecondaryButton
            onClick={() => handleSetActive(!isActive)}
            disabled={busy}
          >
            {switchingActive
              ? "変更中..."
              : isActive
                ? "無効にする"
                : "有効にする"}
          </SecondaryButton>
        </div>
        {activeError && (
          <p className="text-danger mt-3 text-sm">{activeError}</p>
        )}
      </Card>

      <CopyableId label="顧客 ID" value={customer.customerId ?? ""} />

      <DangerZone
        title="顧客の削除"
        description="この顧客をデータごと削除します。元に戻せません。一覧から隠すだけなら上の無効化を使ってください。測定履歴がある顧客は削除できません。"
        error={deleteError}
        action={
          <SecondaryButton
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "削除中..." : "顧客を削除"}
          </SecondaryButton>
        }
      />
    </PageContainer>
  );
}
