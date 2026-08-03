"use client";

import LoginButton from "@/components/LoginButton";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import StateCard from "@/components/StateCard";
import StatTile from "@/components/StatTile";
import { useTenantScope, useTenants } from "@/context/TenantsContext";
import { useResource, type ResourceState } from "@/lib/useResource";
import { Suspense, useState } from "react";

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

const selectCount = (body: unknown) => (body as { count?: number }).count ?? 0;

function toTileState(state: ResourceState<number>) {
  if (state.status === "loading") return { status: "loading" } as const;
  if (state.status === "ok") {
    return { status: "ok", value: state.data } as const;
  }
  return { status: "error" } as const;
}

function TenantSummary({
  tenantId,
  tenantTile,
}: {
  tenantId: string;
  tenantTile: React.ReactNode;
}) {
  const query = encodeURIComponent(tenantId);
  const customers = useResource(
    `/api/fitness/customers/count?tenantId=${query}`,
    selectCount,
  );
  const organizations = useResource(
    `/api/fitness/organizations/count?tenantId=${query}`,
    selectCount,
  );

  if (
    customers.status === "unauthenticated" ||
    organizations.status === "unauthenticated"
  ) {
    return (
      <StateCard
        message="サインインの有効期限が切れました。再度サインインしてください。"
        action={<LoginButton />}
      />
    );
  }

  return (
    <div className={GRID}>
      <StatTile
        label="顧客"
        href="/customers"
        state={toTileState(customers)}
        unit="人"
      />
      <StatTile
        label="組織"
        href="/organizations"
        state={toTileState(organizations)}
      />
      {tenantTile}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    refreshTenants,
  } = useTenants();
  const tenantId = useTenantScope();
  const [retrying, setRetrying] = useState(false);

  if (tenantsLoading) {
    return <PageSkeleton />;
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
          所属しているテナントを読み込めないため、状況を表示できません。
        </p>
        <SecondaryButton onClick={handleRetryTenants} disabled={retrying}>
          {retrying ? "再試行中..." : "再試行"}
        </SecondaryButton>
      </PageContainer>
    );
  }

  const tenantName =
    memberships.find(({ tenant }) => tenant.tenantId === tenantId)?.tenant
      .name ?? "";

  const tenantTile = (
    <StatTile
      label="所属テナント"
      href="/tenants"
      state={{ status: "ok", value: memberships.length }}
    />
  );

  return (
    <PageContainer>
      <PageHeader
        title="ホーム"
        description={
          tenantName
            ? `${tenantName}のデータを表示しています。`
            : "テナントを作成すると、顧客や組織を登録できます。"
        }
        actions={
          tenantId && (
            <PrimaryLink href="/customers/register">顧客を登録</PrimaryLink>
          )
        }
      />

      {tenantId ? (
        <TenantSummary tenantId={tenantId} tenantTile={tenantTile} />
      ) : (
        <div className={GRID}>{tenantTile}</div>
      )}

      {memberships.length === 0 && (
        <StateCard
          message="まだテナントに所属していません。テナントを作成すると顧客や組織を登録できます。"
          action={<PrimaryLink href="/tenants">テナントを管理</PrimaryLink>}
        />
      )}
    </PageContainer>
  );
}
