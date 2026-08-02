"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import CustomerFields from "@/components/CustomerFields";
import LoginButton from "@/components/LoginButton";
import MeasurementHistory from "@/components/MeasurementHistory";
import PageContainer from "@/components/PageContainer";
import SecondaryButton from "@/components/SecondaryButton";
import { useTenants } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { ensureOk, runWithError } from "@/lib/apiError";
import {
  Customer,
  CustomerFormValues,
  EMPTY_CUSTOMER_FORM,
  buildCustomerPayload,
  customerToForm,
  fieldsNeedingInput,
} from "@/lib/customer";
import { useOrganizations } from "@/lib/useOrganizations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

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
  const { user, loading: userLoading } = useUser();
  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    refreshTenants,
  } = useTenants();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [fetched, setFetched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryingTenants, setRetryingTenants] = useState(false);

  const [values, setValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [switchingActive, setSwitchingActive] = useState(false);
  const [activeError, setActiveError] = useState("");
  const organizations = useOrganizations(customer?.tenantId ?? "");

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
    if (userLoading || !user) return;
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
  }, [user, userLoading, customerId, applyResult]);

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

  if (userLoading || (user && !fetched)) {
    return (
      <PageContainer>
        <div className="bg-placeholder h-9 w-56 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-40 w-full animate-pulse rounded-2xl" />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer centered>
        <p className="text-subtle text-sm">
          この顧客を表示するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  if (notFound) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          顧客が見つかりません
        </h1>
        <Link href="/customers" className="text-muted text-sm underline">
          顧客一覧に戻る
        </Link>
      </PageContainer>
    );
  }

  if (unauthenticated) {
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

  if (loadError || !customer) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          顧客を読み込めませんでした
        </h1>
        <p className="text-subtle text-sm">時間をおいて再度お試しください。</p>
        <Link href="/customers" className="text-muted text-sm underline">
          顧客一覧に戻る
        </Link>
      </PageContainer>
    );
  }

  const handleRetryTenants = () => {
    if (retryingTenants) return;
    setRetryingTenants(true);
    void refreshTenants().finally(() => setRetryingTenants(false));
  };

  const isActive = customer.isActive !== false;
  const tenantId = customer.tenantId ?? "";
  const tenantName = memberships.find((m) => m.tenant.tenantId === tenantId)
    ?.tenant.name;
  const needsInput = fieldsNeedingInput(customer);

  return (
    <PageContainer>
      <div>
        <Link href="/customers" className="text-subtle text-sm hover:underline">
          ← 顧客一覧
        </Link>
      </div>

      <section>
        <h1 className="text-foreground flex flex-wrap items-center gap-3 text-3xl font-semibold tracking-tight">
          {customer.name}
          {!isActive && <Badge tone="subtle">無効</Badge>}
        </h1>
        <p className="text-muted mt-1 text-sm">{customer.nameKana}</p>
        <p className="text-subtle mt-1 truncate text-xs">
          {customer.customerId}
        </p>
      </section>

      <Card>
        <h2 className="text-foreground text-sm font-medium">顧客情報</h2>
        <form onSubmit={handleSave} className="mt-4 flex flex-col gap-6">
          <div>
            <p className="text-muted text-sm font-medium">所属テナント</p>
            {tenantsLoading ? (
              <div className="bg-placeholder mt-1 h-5 w-40 animate-pulse rounded" />
            ) : tenantName ? (
              <p className="text-foreground mt-1 text-sm">{tenantName}</p>
            ) : (
              <>
                <p className="text-subtle mt-1 text-sm">
                  {tenantsError
                    ? "テナント名を取得できませんでした"
                    : "あなたが所属していないテナントです"}
                </p>
                <p className="text-subtle mt-0.5 truncate text-xs">
                  {tenantId}
                </p>
                {tenantsError && (
                  <div className="mt-2">
                    <SecondaryButton
                      onClick={handleRetryTenants}
                      disabled={retryingTenants}
                    >
                      {retryingTenants ? "再取得中..." : "テナント名を再取得"}
                    </SecondaryButton>
                  </div>
                )}
              </>
            )}
          </div>

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
            <SecondaryButton type="submit" disabled={busy}>
              {saving ? "保存中..." : "変更を保存"}
            </SecondaryButton>
          </div>
        </form>
      </Card>

      <MeasurementHistory customerId={customerId} />

      <Card>
        <h2 className="text-foreground text-sm font-medium">利用状態</h2>
        <p className="text-foreground mt-3 text-sm">
          {isActive ? "有効" : "無効"}
        </p>
        {activeError && (
          <p className="text-danger mt-3 text-sm">{activeError}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-subtle text-sm">
            {isActive
              ? "無効にすると顧客一覧に表示されなくなります。データは残るのでいつでも有効に戻せます。"
              : "有効に戻すと顧客一覧に再び表示されます。"}
          </p>
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
      </Card>

      <Card>
        <h2 className="text-foreground text-sm font-medium">顧客の削除</h2>
        {deleteError && (
          <p className="text-danger mt-3 text-sm">{deleteError}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-subtle text-sm">
            この顧客をデータごと削除します。元に戻せません。一覧から隠すだけなら上の無効化を使ってください。測定履歴がある顧客は削除できません。
          </p>
          <SecondaryButton
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "削除中..." : "顧客を削除"}
          </SecondaryButton>
        </div>
      </Card>
    </PageContainer>
  );
}
