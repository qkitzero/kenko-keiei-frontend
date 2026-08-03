"use client";

import Badge from "@/components/Badge";
import Checkbox from "@/components/Checkbox";
import DataTable, { type Column } from "@/components/DataTable";
import LoginButton from "@/components/LoginButton";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import StateCard from "@/components/StateCard";
import { useTenantScope, useTenants } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { Customer, genderLabel } from "@/lib/customer";
import { dateLabel } from "@/lib/date";
import { organizationName, type OrganizationOptions } from "@/lib/organization";
import { useOrganizations } from "@/lib/useOrganizations";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type LoadResult =
  | { status: "ok"; customers: Customer[] }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error" };

type LoadedList = { key: string; result: LoadResult };

async function loadCustomers(
  tenantId: string,
  includeInactive: boolean,
): Promise<LoadResult> {
  const query = new URLSearchParams({ tenantId });
  if (includeInactive) query.set("includeInactive", "true");
  const res = await fetch(`/api/fitness/customers?${query}`);
  if (!res.ok) {
    if (res.status === 401) return { status: "unauthenticated" };
    if (res.status === 403) return { status: "forbidden" };
    return { status: "error" };
  }
  const data = await res.json();
  const customers: Customer[] = (data.customers ?? []).filter(
    (customer: Customer) => customer.customerId,
  );
  return { status: "ok", customers };
}

function listHref(tenantId: string, includeInactive: boolean): string {
  const query = new URLSearchParams({ tenantId });
  if (includeInactive) query.set("includeInactive", "true");
  return `/customers?${query}`;
}

function organizationCell(
  organizations: OrganizationOptions,
  organizationId: string | undefined,
) {
  if (!organizationId) return "—";
  if (organizations.status === "loading") {
    return (
      <span className="bg-placeholder inline-block h-4 w-24 animate-pulse rounded align-middle" />
    );
  }
  if (organizations.status === "error") {
    return <span className="text-subtle">取得できませんでした</span>;
  }
  return organizationName(organizations, organizationId) || "—";
}

function customerColumns(
  organizations: OrganizationOptions,
): Column<Customer>[] {
  return [
    {
      header: "氏名",
      cell: (customer) => (
        <span className="flex items-center gap-2">
          {customer.name}
          {customer.isActive === false && (
            <Badge size="sm" tone="subtle">
              無効
            </Badge>
          )}
        </span>
      ),
    },
    { header: "カナ", cell: (customer) => customer.nameKana },
    {
      header: "組織",
      cell: (customer) =>
        organizationCell(organizations, customer.organizationId),
    },
    { header: "性別", cell: (customer) => genderLabel(customer.gender) || "—" },
    {
      header: "生年月日",
      cell: (customer) => dateLabel(customer.birthDate) || "—",
      align: "end",
    },
  ];
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Customers />
    </Suspense>
  );
}

function Customers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    refreshTenants,
  } = useTenants();

  const [loaded, setLoaded] = useState<LoadedList | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const tenantId = useTenantScope();
  const organizations = useOrganizations(tenantId);
  const includeInactive = searchParams.get("includeInactive") === "true";
  const requestKey = `${reloadKey}:${tenantId}:${includeInactive}`;
  const result = loaded?.key === requestKey ? loaded.result : null;

  useEffect(() => {
    if (!tenantId || searchParams.get("tenantId") === tenantId) return;
    router.replace(listHref(tenantId, includeInactive), { scroll: false });
  }, [tenantId, includeInactive, searchParams, router]);

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    (async () => {
      const loadResult = await loadCustomers(tenantId, includeInactive).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      setLoaded({ key: requestKey, result: loadResult });
    })();
    return () => {
      active = false;
    };
  }, [tenantId, includeInactive, requestKey]);

  if (userLoading || (user && tenantsLoading)) {
    return <PageSkeleton />;
  }

  if (!user) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          顧客
        </h1>
        <p className="text-subtle text-sm">
          顧客を表示するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  if (tenantsError) {
    const handleRetryTenants = () => {
      if (retrying) return;
      setRetrying(true);
      void refreshTenants().finally(() => setRetrying(false));
    };

    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          テナント情報を取得できませんでした
        </h1>
        <p className="text-subtle text-sm">
          対象のテナントを読み込めないため、顧客を表示できません。
        </p>
        <SecondaryButton onClick={handleRetryTenants} disabled={retrying}>
          {retrying ? "再試行中..." : "再試行"}
        </SecondaryButton>
      </PageContainer>
    );
  }

  if (memberships.length === 0) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          対象のテナントがありません
        </h1>
        <p className="text-subtle text-sm">
          顧客を扱うにはテナントに所属する必要があります。
        </p>
        <Link href="/tenants" className="text-muted text-sm underline">
          テナントを管理
        </Link>
      </PageContainer>
    );
  }

  const tenantName =
    memberships.find(({ tenant }) => tenant.tenantId === tenantId)?.tenant
      .name ?? "";

  return (
    <PageContainer>
      <PageHeader
        title="顧客"
        description={`${tenantName}に登録されている顧客の一覧です。`}
        actions={
          <PrimaryLink href="/customers/register">顧客を登録</PrimaryLink>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-subtle text-sm tabular-nums">
            {result?.status === "ok" && `${result.customers.length}件`}
          </p>
          {organizations.status === "error" && (
            <p className="text-subtle flex items-center gap-2 text-sm">
              組織名を取得できませんでした。
              <SecondaryButton size="sm" onClick={organizations.retry}>
                再取得
              </SecondaryButton>
            </p>
          )}
        </div>
        <Checkbox
          label="無効な顧客も表示する"
          checked={includeInactive}
          onChange={(checked) =>
            router.replace(listHref(tenantId, checked), { scroll: false })
          }
        />
      </div>

      {!result ? (
        <div className="bg-placeholder h-64 w-full animate-pulse rounded-lg" />
      ) : result.status === "unauthenticated" ? (
        <StateCard
          message="サインインの有効期限が切れました。再度サインインしてください。"
          action={<LoginButton />}
        />
      ) : result.status === "forbidden" ? (
        <StateCard message="このテナントの顧客を表示する権限がありません。" />
      ) : result.status === "error" ? (
        <StateCard
          message="顧客一覧を読み込めませんでした。時間をおいて再度お試しください。"
          action={
            <SecondaryButton onClick={() => setReloadKey((key) => key + 1)}>
              再試行
            </SecondaryButton>
          }
        />
      ) : (
        <DataTable
          caption="顧客一覧"
          columns={customerColumns(organizations)}
          rows={result.customers}
          rowKey={(customer) => customer.customerId ?? ""}
          rowHref={(customer) => `/customers/${customer.customerId}`}
          empty={
            <StateCard
              message={
                includeInactive
                  ? "このテナントにはまだ顧客が登録されていません。"
                  : "このテナントに有効な顧客はいません。無効な顧客は上のチェックボックスで表示できます。"
              }
              action={
                <PrimaryLink href="/customers/register">顧客を登録</PrimaryLink>
              }
            />
          }
        />
      )}
    </PageContainer>
  );
}
