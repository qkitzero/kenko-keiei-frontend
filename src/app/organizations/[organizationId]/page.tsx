"use client";

import Card from "@/components/Card";
import LoginButton from "@/components/LoginButton";
import PageContainer from "@/components/PageContainer";
import SecondaryButton from "@/components/SecondaryButton";
import TextField from "@/components/TextField";
import { useTenants } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { ensureOk, runWithError } from "@/lib/apiError";
import { Organization, buildOrganizationName } from "@/lib/organization";
import { TEXT_MAX_LENGTH } from "@/lib/text";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

type LoadResult =
  | { status: "ok"; data: Organization }
  | { status: "not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

async function loadOrganization(organizationId: string): Promise<LoadResult> {
  const res = await fetch(`/api/fitness/organization/${organizationId}`);
  if (!res.ok) {
    if (res.status === 404) return { status: "not_found" };
    if (res.status === 401) return { status: "unauthenticated" };
    return { status: "error" };
  }
  const data = await res.json();
  if (!data.organization?.organizationId) return { status: "not_found" };
  return { status: "ok", data: data.organization };
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = use(params);
  return (
    <OrganizationDetail key={organizationId} organizationId={organizationId} />
  );
}

function OrganizationDetail({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    selectTenant,
    refreshTenants,
  } = useTenants();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [fetched, setFetched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryingTenants, setRetryingTenants] = useState(false);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const applyOrganization = useCallback((data: Organization) => {
    setOrganization(data);
    setName(data.name ?? "");
  }, []);

  const applyResult = useCallback(
    (result: LoadResult) => {
      if (result.status === "ok") {
        applyOrganization(result.data);
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
    [applyOrganization],
  );

  useEffect(() => {
    if (userLoading || !user) return;
    let active = true;
    (async () => {
      const result = await loadOrganization(organizationId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      applyResult(result);
      setFetched(true);
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, organizationId, applyResult]);

  const orgTenantId = organization?.tenantId ?? "";
  const memberTenantId = memberships.some(
    ({ tenant }) => tenant.tenantId === orgTenantId,
  )
    ? orgTenantId
    : "";
  const [seenTenantId, setSeenTenantId] = useState(memberTenantId);

  if (seenTenantId !== memberTenantId) {
    setSeenTenantId(memberTenantId);
    if (memberTenantId) selectTenant(memberTenantId);
  }

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingName) return;

    const parsed = buildOrganizationName(name);
    if (!parsed.ok) {
      setSaveError(parsed.error);
      return;
    }

    setSavingName(true);
    void runWithError(setSaveError, async () => {
      const res = await fetch(`/api/fitness/organization/${organizationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: parsed.name }),
      });
      await ensureOk(res, "組織名の更新に失敗しました");

      const data = await res.json().catch(() => null);
      if (data?.organization?.organizationId) {
        applyOrganization(data.organization);
        return;
      }

      const reloaded = await loadOrganization(organizationId).catch(
        () => ({ status: "error" }) as const,
      );
      if (reloaded.status !== "ok") {
        throw new Error(
          "更新は完了しましたが、最新の情報を取得できませんでした。ページを再読み込みしてください。",
        );
      }
      applyOrganization(reloaded.data);
    }).finally(() => setSavingName(false));
  };

  const handleDelete = () => {
    if (deleting) return;
    if (
      !window.confirm(
        "本当にこの組織を削除しますか？この操作は取り消せません。",
      )
    ) {
      return;
    }
    setDeleting(true);
    void runWithError(setDeleteError, async () => {
      const res = await fetch(`/api/fitness/organization/${organizationId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 500
            ? "この組織を削除できませんでした。顧客が所属している組織は削除できないため、先に対象の顧客の所属組織を変更してください。"
            : "組織の削除に失敗しました",
        );
      }
      router.push("/organizations");
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
          この組織を表示するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  if (notFound) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織が見つかりません
        </h1>
        <Link href="/organizations" className="text-muted text-sm underline">
          組織一覧に戻る
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

  if (loadError || !organization) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織を読み込めませんでした
        </h1>
        <p className="text-subtle text-sm">時間をおいて再度お試しください。</p>
        <Link href="/organizations" className="text-muted text-sm underline">
          組織一覧に戻る
        </Link>
      </PageContainer>
    );
  }

  const handleRetryTenants = () => {
    if (retryingTenants) return;
    setRetryingTenants(true);
    void refreshTenants().finally(() => setRetryingTenants(false));
  };

  const tenantName = memberships.find(
    ({ tenant }) => tenant.tenantId === organization.tenantId,
  )?.tenant.name;

  return (
    <PageContainer>
      <div>
        <Link
          href="/organizations"
          className="text-subtle text-sm hover:underline"
        >
          ← 組織一覧
        </Link>
      </div>

      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {organization.name}
        </h1>
        <p className="text-subtle mt-1 truncate text-xs">
          {organization.organizationId}
        </p>
      </section>

      <Card>
        <h2 className="text-foreground text-sm font-medium">組織設定</h2>
        <div className="mt-4">
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
                {organization.tenantId}
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
        <form onSubmit={handleRename} className="mt-4 flex gap-3">
          <TextField
            value={name}
            onChange={setName}
            maxLength={TEXT_MAX_LENGTH}
            placeholder="組織名"
            aria-label="組織名"
            required
            className="flex-1"
          />
          <SecondaryButton type="submit" disabled={savingName}>
            {savingName ? "保存中..." : "名前を更新"}
          </SecondaryButton>
        </form>
        {saveError && <p className="text-danger mt-3 text-sm">{saveError}</p>}
      </Card>

      <Card>
        <h2 className="text-foreground text-sm font-medium">組織の削除</h2>
        {deleteError && (
          <p className="text-danger mt-3 text-sm">{deleteError}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-subtle text-sm">
            この組織を削除します。元に戻せません。顧客が所属している組織は削除できません。
          </p>
          <SecondaryButton
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "削除中..." : "組織を削除"}
          </SecondaryButton>
        </div>
      </Card>
    </PageContainer>
  );
}
