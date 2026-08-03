"use client";

import Card from "@/components/Card";
import DataTable, { type Column } from "@/components/DataTable";
import LoginButton from "@/components/LoginButton";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import StateCard from "@/components/StateCard";
import TextField from "@/components/TextField";
import { useTenantScope, useTenants } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { ensureOk, errorMessage } from "@/lib/apiError";
import { Organization, buildOrganizationName } from "@/lib/organization";
import { TEXT_MAX_LENGTH } from "@/lib/text";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type LoadResult =
  | { status: "ok"; organizations: Organization[] }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error" };

type LoadedList = { key: string; result: LoadResult };

const ORGANIZATION_COLUMNS: Column<Organization>[] = [
  { header: "組織名", cell: (organization) => organization.name },
  {
    header: "ID",
    cell: (organization) => (
      <span className="text-subtle font-mono text-xs">
        {organization.organizationId}
      </span>
    ),
    align: "end",
  },
];

async function loadOrganizations(tenantId: string): Promise<LoadResult> {
  const res = await fetch(
    `/api/fitness/organizations?tenantId=${encodeURIComponent(tenantId)}`,
  );
  if (!res.ok) {
    if (res.status === 401) return { status: "unauthenticated" };
    if (res.status === 403) return { status: "forbidden" };
    return { status: "error" };
  }
  const data = await res.json();
  const organizations: Organization[] = (data.organizations ?? []).filter(
    (organization: Organization) => organization.organizationId,
  );
  return { status: "ok", organizations };
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Organizations />
    </Suspense>
  );
}

function Organizations() {
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

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const tenantId = useTenantScope();
  const requestKey = `${reloadKey}:${tenantId}`;
  const result = loaded?.key === requestKey ? loaded.result : null;

  useEffect(() => {
    if (!tenantId || searchParams.get("tenantId") === tenantId) return;
    router.replace(`/organizations?tenantId=${encodeURIComponent(tenantId)}`, {
      scroll: false,
    });
  }, [tenantId, searchParams, router]);

  useEffect(() => {
    if (!tenantId) return;
    let active = true;
    (async () => {
      const loadResult = await loadOrganizations(tenantId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      setLoaded({ key: requestKey, result: loadResult });
    })();
    return () => {
      active = false;
    };
  }, [tenantId, requestKey]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;

    const parsed = buildOrganizationName(name);
    if (!parsed.ok) {
      setCreateError(parsed.error);
      return;
    }

    setCreating(true);
    setCreateError("");
    void (async () => {
      try {
        const res = await fetch("/api/fitness/organization/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, name: parsed.name }),
        });
        await ensureOk(res, "組織の作成に失敗しました");
        setName("");
        setReloadKey((key) => key + 1);
      } catch (err: unknown) {
        setCreateError(errorMessage(err));
      } finally {
        setCreating(false);
      }
    })();
  };

  if (userLoading || (user && tenantsLoading)) {
    return <PageSkeleton />;
  }

  if (!user) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          組織
        </h1>
        <p className="text-subtle text-sm">
          組織を表示するにはサインインしてください。
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
          対象のテナントを読み込めないため、組織を表示できません。
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
          組織を扱うにはテナントに所属する必要があります。
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
        title="組織"
        description={`${tenantName}に登録されている組織の一覧です。顧客の所属先として使います。`}
      />

      <Card title="新しい組織を作成">
        <form onSubmit={handleCreate} className="flex gap-2">
          <TextField
            value={name}
            onChange={setName}
            placeholder="組織名"
            aria-label="組織名"
            maxLength={TEXT_MAX_LENGTH}
            required
            className="max-w-sm flex-1"
          />
          <PrimaryButton type="submit" disabled={creating}>
            {creating ? "作成中..." : "作成"}
          </PrimaryButton>
        </form>
        {createError && (
          <p className="text-danger mt-3 text-sm">{createError}</p>
        )}
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-subtle text-sm tabular-nums">
          {result?.status === "ok" && `${result.organizations.length}件`}
        </p>

        {!result ? (
          <div className="bg-placeholder h-48 w-full animate-pulse rounded-lg" />
        ) : result.status === "unauthenticated" ? (
          <StateCard
            message="サインインの有効期限が切れました。再度サインインしてください。"
            action={<LoginButton />}
          />
        ) : result.status === "forbidden" ? (
          <StateCard message="このテナントの組織を表示する権限がありません。" />
        ) : result.status === "error" ? (
          <StateCard
            message="組織一覧を読み込めませんでした。時間をおいて再度お試しください。"
            action={
              <SecondaryButton onClick={() => setReloadKey((key) => key + 1)}>
                再試行
              </SecondaryButton>
            }
          />
        ) : (
          <DataTable
            caption="組織一覧"
            columns={ORGANIZATION_COLUMNS}
            rows={result.organizations}
            rowKey={(organization) => organization.organizationId ?? ""}
            rowHref={(organization) =>
              `/organizations/${organization.organizationId}`
            }
            empty={
              <StateCard message="このテナントにはまだ組織が登録されていません。上のフォームから作成してください。" />
            }
          />
        )}
      </div>
    </PageContainer>
  );
}
