"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import TenantProfileCard from "@/components/TenantProfileCard";
import TextField from "@/components/TextField";
import { useTenants } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { ensureOk, runWithError } from "@/lib/apiError";
import {
  ASSIGNABLE_ROLES,
  canManageMembers,
  isOwner,
  roleLabel,
} from "@/lib/roles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

type Tenant = { tenantId: string; name: string };
type Member = { userId: string; role: string };

type TenantData = {
  tenant: Tenant;
  members: Member[];
  children: Tenant[];
  parents: Tenant[];
};

type LoadResult =
  | { status: "ok"; data: TenantData }
  | { status: "not_found" }
  | { status: "error" };

type GroupResponse = { groupId?: string; name?: string };

function toTenant(group: GroupResponse | undefined): Tenant | null {
  if (!group?.groupId) return null;
  return { tenantId: group.groupId, name: group.name ?? "" };
}

function toTenants(groups: unknown): Tenant[] {
  if (!Array.isArray(groups)) return [];
  return (groups as GroupResponse[]).flatMap((group) => {
    const tenant = toTenant(group);
    return tenant ? [tenant] : [];
  });
}

async function loadTenantData(tenantId: string): Promise<LoadResult> {
  const [tenantRes, membersRes, childrenRes, parentsRes] = await Promise.all([
    fetch(`/api/group/${tenantId}`),
    fetch(`/api/group/${tenantId}/members`),
    fetch(`/api/group/${tenantId}/children`),
    fetch(`/api/group/${tenantId}/parents`),
  ]);

  if (!tenantRes.ok) {
    return { status: tenantRes.status === 404 ? "not_found" : "error" };
  }
  const tenant = toTenant((await tenantRes.json()).group);
  if (!tenant) return { status: "not_found" };

  if (!membersRes.ok) {
    return { status: "error" };
  }

  return {
    status: "ok",
    data: {
      tenant,
      members: (await membersRes.json()).members ?? [],
      children: childrenRes.ok
        ? toTenants((await childrenRes.json()).groups)
        : [],
      parents: parentsRes.ok ? toTenants((await parentsRes.json()).groups) : [],
    },
  };
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);
  return <TenantDetail key={tenantId} tenantId={tenantId} />;
}

function TenantDetail({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { refreshTenants } = useTenants();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [children, setChildren] = useState<Tenant[]>([]);
  const [parents, setParents] = useState<Tenant[]>([]);
  const [fetched, setFetched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);
  const [newChildId, setNewChildId] = useState("");
  const [addingChild, setAddingChild] = useState(false);

  const myRole = members.find((m) => m.userId === user?.userId)?.role;
  const canManage = canManageMembers(myRole);
  const owner = isOwner(myRole);
  const isMember = myRole !== undefined;

  const applyResult = useCallback((result: LoadResult) => {
    if (result.status === "ok") {
      setTenant(result.data.tenant);
      setName(result.data.tenant.name);
      setMembers(result.data.members);
      setChildren(result.data.children);
      setParents(result.data.parents);
      setNotFound(false);
      setLoadError(false);
    } else if (result.status === "not_found") {
      setNotFound(true);
    } else {
      setLoadError(true);
    }
  }, []);

  const reload = useCallback(async () => {
    const result = await loadTenantData(tenantId).catch(
      () => ({ status: "error" }) as const,
    );
    applyResult(result);
  }, [tenantId, applyResult]);

  useEffect(() => {
    if (userLoading || !user) return;
    let active = true;
    (async () => {
      const result = await loadTenantData(tenantId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      applyResult(result);
      setFetched(true);
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, tenantId, applyResult]);

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingName || !name.trim()) return;
    setSavingName(true);
    void runWithError(setError, async () => {
      const res = await fetch(`/api/group/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      await ensureOk(res, "テナント名の更新に失敗しました");
      await reload();
      await refreshTenants();
    }).finally(() => setSavingName(false));
  };

  const handleDeleteTenant = () => {
    if (
      !window.confirm(
        "本当にこのテナントを削除しますか？この操作は取り消せません。",
      )
    ) {
      return;
    }
    void runWithError(setError, async () => {
      const res = await fetch(`/api/group/${tenantId}`, { method: "DELETE" });
      await ensureOk(res, "テナントの削除に失敗しました");
      await refreshTenants();
      router.push("/tenants");
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (addingMember || !newMemberId.trim()) return;
    setAddingMember(true);
    void runWithError(setError, async () => {
      const res = await fetch(`/api/group/${tenantId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newMemberId.trim(),
          role: newMemberRole,
        }),
      });
      await ensureOk(res, "メンバーの追加に失敗しました");
      setNewMemberId("");
      setNewMemberRole("member");
      await reload();
    }).finally(() => setAddingMember(false));
  };

  const handleRoleChange = (userId: string, role: string) => {
    void runWithError(setError, async () => {
      const res = await fetch(`/api/group/${tenantId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      await ensureOk(res, "ロールの変更に失敗しました");
      await reload();
    });
  };

  const handleRemoveMember = (userId: string) => {
    void runWithError(setError, async () => {
      const res = await fetch(`/api/group/${tenantId}/members/${userId}`, {
        method: "DELETE",
      });
      await ensureOk(res, "メンバーの削除に失敗しました");
      await reload();
    });
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (addingChild || !newChildId.trim()) return;
    setAddingChild(true);
    void runWithError(setError, async () => {
      const res = await fetch(`/api/group/${tenantId}/children`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childGroupId: newChildId.trim() }),
      });
      await ensureOk(res, "下位テナントの追加に失敗しました");
      setNewChildId("");
      await reload();
    }).finally(() => setAddingChild(false));
  };

  const handleRemoveChild = (childTenantId: string) => {
    void runWithError(setError, async () => {
      const res = await fetch(
        `/api/group/${tenantId}/children/${childTenantId}`,
        { method: "DELETE" },
      );
      await ensureOk(res, "下位テナントの解除に失敗しました");
      await reload();
    });
  };

  if (userLoading || (user && !fetched)) {
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
          このテナントを表示するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  if (notFound) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          テナントが見つかりません
        </h1>
        <Link href="/tenants" className="text-muted text-sm underline">
          テナント一覧に戻る
        </Link>
      </PageContainer>
    );
  }

  if (loadError || !tenant) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          テナントを読み込めませんでした
        </h1>
        <p className="text-subtle text-sm">時間をおいて再度お試しください。</p>
        <Link href="/tenants" className="text-muted text-sm underline">
          テナント一覧に戻る
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div>
        <Link href="/tenants" className="text-subtle text-sm hover:underline">
          ← テナント一覧
        </Link>
      </div>

      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {tenant.name}
        </h1>
        <p className="text-subtle mt-1 truncate text-xs">{tenant.tenantId}</p>
        {myRole && (
          <Badge className="mt-3 inline-block">
            あなたのロール: {roleLabel(myRole)}
          </Badge>
        )}
      </section>

      {error && <p className="text-danger text-sm">{error}</p>}

      {canManage && (
        <Card>
          <h2 className="text-foreground text-sm font-medium">テナント設定</h2>
          <form onSubmit={handleRename} className="mt-4 flex gap-3">
            <TextField
              value={name}
              onChange={setName}
              required
              className="flex-1"
            />
            <SecondaryButton type="submit" disabled={savingName}>
              {savingName ? "保存中..." : "名前を更新"}
            </SecondaryButton>
          </form>
          {owner && (
            <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-subtle text-sm">
                このテナントを削除します。元に戻せません。
              </p>
              <SecondaryButton variant="danger" onClick={handleDeleteTenant}>
                テナントを削除
              </SecondaryButton>
            </div>
          )}
        </Card>
      )}

      {isMember && <TenantProfileCard tenantId={tenantId} />}

      <Card>
        <h2 className="text-foreground text-sm font-medium">
          メンバー ({members.length})
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {members.map((m) => {
            const rowIsOwner = isOwner(m.role);
            return (
              <li
                key={m.userId}
                className="border-border flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <span className="text-foreground truncate text-sm">
                  {m.userId}
                  {m.userId === user.userId && (
                    <span className="text-subtle"> (あなた)</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {canManage && !rowIsOwner ? (
                    <Select
                      size="sm"
                      value={m.role}
                      onChange={(role) => handleRoleChange(m.userId, role)}
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="text-muted text-xs">
                      {roleLabel(m.role)}
                    </span>
                  )}
                  {canManage && !rowIsOwner && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="text-subtle hover:text-danger text-xs"
                    >
                      削除
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {canManage && (
          <form
            onSubmit={handleAddMember}
            className="border-border mt-4 flex gap-2 border-t pt-4"
          >
            <TextField
              value={newMemberId}
              onChange={setNewMemberId}
              placeholder="ユーザーID"
              required
              className="flex-1"
            />
            <Select value={newMemberRole} onChange={setNewMemberRole}>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
            <PrimaryButton type="submit" disabled={addingMember}>
              {addingMember ? "追加中..." : "追加"}
            </PrimaryButton>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="text-foreground text-sm font-medium">
          下位テナント ({children.length})
        </h2>
        {children.length === 0 ? (
          <p className="text-subtle mt-3 text-sm">下位テナントはありません。</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {children.map((c) => (
              <li
                key={c.tenantId}
                className="border-border flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <Link
                  href={`/tenants/${c.tenantId}`}
                  className="text-foreground truncate text-sm hover:underline"
                >
                  {c.name}
                </Link>
                {canManage && (
                  <button
                    onClick={() => handleRemoveChild(c.tenantId)}
                    className="text-subtle hover:text-danger text-xs"
                  >
                    解除
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManage && (
          <form
            onSubmit={handleAddChild}
            className="border-border mt-4 flex gap-2 border-t pt-4"
          >
            <TextField
              value={newChildId}
              onChange={setNewChildId}
              placeholder="下位テナントのID"
              required
              className="flex-1"
            />
            <SecondaryButton type="submit" disabled={addingChild}>
              {addingChild ? "追加中..." : "下位テナントを追加"}
            </SecondaryButton>
          </form>
        )}
      </Card>

      {parents.length > 0 && (
        <Card>
          <h2 className="text-foreground text-sm font-medium">
            上位テナント ({parents.length})
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {parents.map((p) => (
              <li
                key={p.tenantId}
                className="border-border rounded-xl border px-4 py-3"
              >
                <Link
                  href={`/tenants/${p.tenantId}`}
                  className="text-foreground truncate text-sm hover:underline"
                >
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageContainer>
  );
}
