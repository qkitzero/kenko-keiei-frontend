"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import DangerZone from "@/components/DangerZone";
import DataTable, { type Column } from "@/components/DataTable";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import SectionHeader from "@/components/SectionHeader";
import Select from "@/components/Select";
import StateCard from "@/components/StateCard";
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
  const [renameError, setRenameError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [childError, setChildError] = useState("");

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
    void runWithError(setRenameError, async () => {
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
    void runWithError(setDeleteError, async () => {
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
    void runWithError(setMemberError, async () => {
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
    void runWithError(setMemberError, async () => {
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
    if (
      !window.confirm(
        "このメンバーをテナントから外しますか？この操作は取り消せません。",
      )
    ) {
      return;
    }
    void runWithError(setMemberError, async () => {
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
    void runWithError(setChildError, async () => {
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
    if (!window.confirm("この下位テナントとの紐付けを解除しますか？")) {
      return;
    }
    void runWithError(setChildError, async () => {
      const res = await fetch(
        `/api/group/${tenantId}/children/${childTenantId}`,
        { method: "DELETE" },
      );
      await ensureOk(res, "下位テナントの解除に失敗しました");
      await reload();
    });
  };

  if (userLoading || (user && !fetched)) {
    return <PageSkeleton width="detail" />;
  }

  if (!user) {
    return (
      <PageMessage message="このテナントを表示するにはサインインしてください。" />
    );
  }

  if (notFound) {
    return (
      <PageMessage
        title="テナントが見つかりません"
        link={{ href: "/tenants", label: "テナント一覧に戻る" }}
      />
    );
  }

  if (loadError || !tenant) {
    return (
      <PageMessage
        title="テナントを読み込めませんでした"
        message="時間をおいて再度お試しください。"
        link={{ href: "/tenants", label: "テナント一覧に戻る" }}
      />
    );
  }

  const memberColumns: Column<Member>[] = [
    {
      header: "ユーザー ID",
      cell: (member) => (
        <span className="font-mono text-xs">
          {member.userId}
          {member.userId === user.userId && (
            <span className="text-subtle font-sans"> (あなた)</span>
          )}
        </span>
      ),
    },
    {
      header: "ロール",
      cell: (member) =>
        canManage && !isOwner(member.role) ? (
          <Select
            size="sm"
            aria-label={`${member.userId}のロール`}
            value={member.role}
            onChange={(role) => handleRoleChange(member.userId, role)}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </Select>
        ) : (
          <span className="text-muted text-xs">{roleLabel(member.role)}</span>
        ),
      align: "end",
    },
  ];

  if (canManage && members.some((member) => !isOwner(member.role))) {
    memberColumns.push({
      header: "操作",
      cell: (member) =>
        isOwner(member.role) ? null : (
          <SecondaryButton
            size="sm"
            variant="danger"
            onClick={() => handleRemoveMember(member.userId)}
          >
            削除
          </SecondaryButton>
        ),
      align: "end",
    });
  }

  const childColumns: Column<Tenant>[] = [
    {
      header: "テナント名",
      cell: (child) => (
        <Link
          href={`/tenants/${child.tenantId}`}
          className="text-foreground font-medium hover:underline"
        >
          {child.name}
        </Link>
      ),
    },
  ];

  if (canManage) {
    childColumns.push({
      header: "操作",
      cell: (child) => (
        <SecondaryButton
          size="sm"
          onClick={() => handleRemoveChild(child.tenantId)}
        >
          解除
        </SecondaryButton>
      ),
      align: "end",
    });
  }

  const parentColumns: Column<Tenant>[] = [
    {
      header: "テナント名",
      cell: (parent) => (
        <Link
          href={`/tenants/${parent.tenantId}`}
          className="text-foreground font-medium hover:underline"
        >
          {parent.name}
        </Link>
      ),
    },
  ];

  return (
    <PageContainer width="detail">
      <PageHeader
        backHref="/tenants"
        backLabel="テナント一覧"
        title={tenant.name}
        meta={myRole && <Badge>{roleLabel(myRole)}</Badge>}
      />

      <Card title="テナント設定">
        <dl>
          <dt className="text-muted text-sm font-medium">テナント ID</dt>
          <dd className="text-subtle mt-1 truncate font-mono text-xs">
            {tenant.tenantId}
          </dd>
        </dl>
        {canManage && (
          <form onSubmit={handleRename} className="mt-6 flex gap-2">
            <TextField
              value={name}
              onChange={setName}
              aria-label="テナント名"
              required
              className="max-w-sm flex-1"
            />
            <SecondaryButton type="submit" disabled={savingName}>
              {savingName ? "保存中..." : "名前を更新"}
            </SecondaryButton>
          </form>
        )}
        {renameError && (
          <p className="text-danger mt-3 text-sm">{renameError}</p>
        )}
      </Card>

      {isMember && <TenantProfileCard tenantId={tenantId} />}

      <section className="flex flex-col gap-3">
        <SectionHeader title="メンバー" count={members.length} />
        <DataTable
          caption="メンバー一覧"
          columns={memberColumns}
          rows={members}
          rowKey={(member) => member.userId}
          empty={<StateCard message="メンバーはいません。" />}
        />
        {memberError && <p className="text-danger text-sm">{memberError}</p>}
        {canManage && (
          <Card padding="sm">
            <form
              onSubmit={handleAddMember}
              className="flex flex-wrap items-end gap-2"
            >
              <TextField
                label="ユーザー ID"
                value={newMemberId}
                onChange={setNewMemberId}
                required
                className="min-w-56 flex-1"
              />
              <Select
                label="ロール"
                value={newMemberRole}
                onChange={setNewMemberRole}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </Select>
              <PrimaryButton type="submit" disabled={addingMember}>
                {addingMember ? "追加中..." : "メンバーを追加"}
              </PrimaryButton>
            </form>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="下位テナント" count={children.length} />
        <DataTable
          caption="下位テナント一覧"
          columns={childColumns}
          rows={children}
          rowKey={(child) => child.tenantId}
          empty={<StateCard message="下位テナントはありません。" />}
        />
        {childError && <p className="text-danger text-sm">{childError}</p>}
        {canManage && (
          <Card padding="sm">
            <form
              onSubmit={handleAddChild}
              className="flex flex-wrap items-end gap-2"
            >
              <TextField
                label="下位テナントの ID"
                value={newChildId}
                onChange={setNewChildId}
                required
                className="min-w-56 flex-1"
              />
              <SecondaryButton type="submit" disabled={addingChild}>
                {addingChild ? "追加中..." : "下位テナントを追加"}
              </SecondaryButton>
            </form>
          </Card>
        )}
      </section>

      {parents.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="上位テナント" count={parents.length} />
          <DataTable
            caption="上位テナント一覧"
            columns={parentColumns}
            rows={parents}
            rowKey={(parent) => parent.tenantId}
          />
        </section>
      )}

      {owner && (
        <DangerZone
          title="テナントの削除"
          description="このテナントを削除します。元に戻せません。"
          error={deleteError}
          action={
            <SecondaryButton variant="danger" onClick={handleDeleteTenant}>
              テナントを削除
            </SecondaryButton>
          }
        />
      )}
    </PageContainer>
  );
}
