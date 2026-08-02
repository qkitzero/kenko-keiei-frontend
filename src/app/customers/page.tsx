"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import LoginButton from "@/components/LoginButton";
import PageContainer from "@/components/PageContainer";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import { useTenantScope, useTenants } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { Customer, birthDateLabel, genderLabel } from "@/lib/customer";
import { organizationName } from "@/lib/organization";
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

function PageSkeleton() {
  return (
    <PageContainer>
      <div className="bg-placeholder h-9 w-48 animate-pulse rounded-lg" />
      <div className="bg-placeholder h-40 w-full animate-pulse rounded-2xl" />
    </PageContainer>
  );
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
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
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
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
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
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
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
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight">
            顧客
          </h1>
          <p className="text-muted mt-2">
            {tenantName}に登録されている顧客の一覧です。
          </p>
          {memberships.length > 1 && (
            <p className="text-subtle mt-1 text-sm">
              ヘッダーのテナントメニューで表示するテナントを切り替えられます。
            </p>
          )}
        </div>
        <PrimaryLink href="/customers/register" className="shrink-0">
          顧客を登録
        </PrimaryLink>
      </section>

      <Checkbox
        label="無効な顧客も表示する"
        checked={includeInactive}
        onChange={(checked) =>
          router.replace(listHref(tenantId, checked), { scroll: false })
        }
      />

      <section className="flex flex-col gap-3">
        {!result ? (
          <>
            <div className="bg-placeholder h-20 w-full animate-pulse rounded-2xl" />
            <div className="bg-placeholder h-20 w-full animate-pulse rounded-2xl" />
            <div className="bg-placeholder h-20 w-full animate-pulse rounded-2xl" />
          </>
        ) : result.status === "unauthenticated" ? (
          <Card as="div" padding="lg" dashed className="text-center">
            <p className="text-muted text-sm">
              サインインの有効期限が切れました。再度サインインしてください。
            </p>
            <div className="mt-4 flex justify-center">
              <div className="w-40">
                <LoginButton />
              </div>
            </div>
          </Card>
        ) : result.status === "forbidden" ? (
          <Card as="div" padding="lg" dashed className="text-center">
            <p className="text-muted text-sm">
              このテナントの顧客を表示する権限がありません。
            </p>
          </Card>
        ) : result.status === "error" ? (
          <Card as="div" padding="lg" dashed className="text-center">
            <p className="text-muted text-sm">
              顧客一覧を読み込めませんでした。時間をおいて再度お試しください。
            </p>
            <div className="mt-4 flex justify-center">
              <SecondaryButton onClick={() => setReloadKey((key) => key + 1)}>
                再試行
              </SecondaryButton>
            </div>
          </Card>
        ) : result.customers.length === 0 ? (
          <Card as="div" padding="lg" dashed className="text-center">
            <p className="text-muted text-sm">
              {includeInactive
                ? "このテナントにはまだ顧客が登録されていません。"
                : "このテナントに有効な顧客はいません。無効な顧客は上のチェックボックスで表示できます。"}
            </p>
            <Link
              href="/customers/register"
              className="text-muted mt-3 inline-block text-sm underline"
            >
              顧客を登録
            </Link>
          </Card>
        ) : (
          result.customers.map((customer) => (
            <Card
              key={customer.customerId}
              href={`/customers/${customer.customerId}`}
              padding="sm"
              className="flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-foreground flex items-center gap-2 font-medium">
                  <span className="truncate">{customer.name}</span>
                  {customer.isActive === false && (
                    <Badge size="sm" tone="subtle" className="shrink-0">
                      無効
                    </Badge>
                  )}
                </p>
                <p className="text-subtle mt-0.5 truncate text-xs">
                  {[
                    customer.nameKana,
                    organizationName(organizations, customer.organizationId),
                  ]
                    .filter(Boolean)
                    .join(" ・ ")}
                </p>
              </div>
              <div className="text-muted shrink-0 text-right text-xs">
                <p>{genderLabel(customer.gender) || "性別未登録"}</p>
                <p className="mt-0.5">
                  {birthDateLabel(customer.birthDate) || "生年月日未登録"}
                </p>
              </div>
            </Card>
          ))
        )}
      </section>
    </PageContainer>
  );
}
