"use client";

import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import Select from "@/components/Select";
import TextField from "@/components/TextField";
import { useOrgs } from "@/context/OrgsContext";
import { useUser } from "@/context/UserContext";
import { ensureOk, errorMessage } from "@/lib/apiError";
import {
  ASSIGNABLE_ROLES,
  canManageMembers,
  isOwner,
  roleLabel,
} from "@/lib/roles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

type Group = { groupId: string; name: string };
type Member = { userId: string; role: string };

type GroupData = {
  group: Group;
  members: Member[];
  children: Group[];
  parents: Group[];
};

type LoadResult =
  | { status: "ok"; data: GroupData }
  | { status: "not_found" }
  | { status: "error" };

async function loadGroupData(groupId: string): Promise<LoadResult> {
  const [groupRes, membersRes, childrenRes, parentsRes] = await Promise.all([
    fetch(`/api/group/${groupId}`),
    fetch(`/api/group/${groupId}/members`),
    fetch(`/api/group/${groupId}/children`),
    fetch(`/api/group/${groupId}/parents`),
  ]);

  if (!groupRes.ok) {
    return { status: groupRes.status === 404 ? "not_found" : "error" };
  }
  const group: Group | undefined = (await groupRes.json()).group;
  if (!group) return { status: "not_found" };

  if (!membersRes.ok) {
    return { status: "error" };
  }

  return {
    status: "ok",
    data: {
      group,
      members: (await membersRes.json()).members ?? [],
      children: childrenRes.ok ? ((await childrenRes.json()).groups ?? []) : [],
      parents: parentsRes.ok ? ((await parentsRes.json()).groups ?? []) : [],
    },
  };
}

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  return <GroupDetail key={groupId} groupId={groupId} />;
}

function GroupDetail({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { refreshOrgs } = useOrgs();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [children, setChildren] = useState<Group[]>([]);
  const [parents, setParents] = useState<Group[]>([]);
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

  const applyResult = useCallback((result: LoadResult) => {
    if (result.status === "ok") {
      setGroup(result.data.group);
      setName(result.data.group.name);
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
    const result = await loadGroupData(groupId).catch(
      () => ({ status: "error" }) as const,
    );
    applyResult(result);
  }, [groupId, applyResult]);

  useEffect(() => {
    if (userLoading || !user) return;
    let active = true;
    (async () => {
      const result = await loadGroupData(groupId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      applyResult(result);
      setFetched(true);
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, groupId, applyResult]);

  const withError = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingName || !name.trim()) return;
    setSavingName(true);
    void withError(async () => {
      const res = await fetch(`/api/group/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      await ensureOk(res, "組織名の更新に失敗しました");
      await reload();
      await refreshOrgs();
    }).finally(() => setSavingName(false));
  };

  const handleDeleteGroup = () => {
    if (
      !window.confirm(
        "本当にこの組織を削除しますか？この操作は取り消せません。",
      )
    ) {
      return;
    }
    void withError(async () => {
      const res = await fetch(`/api/group/${groupId}`, { method: "DELETE" });
      await ensureOk(res, "組織の削除に失敗しました");
      await refreshOrgs();
      router.push("/groups");
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (addingMember || !newMemberId.trim()) return;
    setAddingMember(true);
    void withError(async () => {
      const res = await fetch(`/api/group/${groupId}/members`, {
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
    void withError(async () => {
      const res = await fetch(`/api/group/${groupId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      await ensureOk(res, "ロールの変更に失敗しました");
      await reload();
    });
  };

  const handleRemoveMember = (userId: string) => {
    void withError(async () => {
      const res = await fetch(`/api/group/${groupId}/members/${userId}`, {
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
    void withError(async () => {
      const res = await fetch(`/api/group/${groupId}/children`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childGroupId: newChildId.trim() }),
      });
      await ensureOk(res, "下位組織の追加に失敗しました");
      setNewChildId("");
      await reload();
    }).finally(() => setAddingChild(false));
  };

  const handleRemoveChild = (childGroupId: string) => {
    void withError(async () => {
      const res = await fetch(
        `/api/group/${groupId}/children/${childGroupId}`,
        { method: "DELETE" },
      );
      await ensureOk(res, "下位組織の解除に失敗しました");
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
        <Link href="/groups" className="text-muted text-sm underline">
          組織一覧に戻る
        </Link>
      </PageContainer>
    );
  }

  if (loadError || !group) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織を読み込めませんでした
        </h1>
        <p className="text-subtle text-sm">時間をおいて再度お試しください。</p>
        <Link href="/groups" className="text-muted text-sm underline">
          組織一覧に戻る
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div>
        <Link href="/groups" className="text-subtle text-sm hover:underline">
          ← 組織一覧
        </Link>
      </div>

      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {group.name}
        </h1>
        <p className="text-subtle mt-1 truncate text-xs">{group.groupId}</p>
        {myRole && (
          <span className="border-border text-muted mt-3 inline-block rounded-full border px-3 py-1 text-xs font-medium">
            あなたのロール: {roleLabel(myRole)}
          </span>
        )}
      </section>

      {error && <p className="text-danger text-sm">{error}</p>}

      {canManage && (
        <Card>
          <h2 className="text-foreground text-sm font-medium">組織設定</h2>
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
                この組織を削除します。元に戻せません。
              </p>
              <SecondaryButton variant="danger" onClick={handleDeleteGroup}>
                組織を削除
              </SecondaryButton>
            </div>
          )}
        </Card>
      )}

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
              className="flex-1 text-sm"
            />
            <Select value={newMemberRole} onChange={setNewMemberRole}>
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
            <PrimaryButton
              type="submit"
              disabled={addingMember}
              className="text-sm"
            >
              {addingMember ? "追加中..." : "追加"}
            </PrimaryButton>
          </form>
        )}
      </Card>

      <Card>
        <h2 className="text-foreground text-sm font-medium">
          下位組織 ({children.length})
        </h2>
        {children.length === 0 ? (
          <p className="text-subtle mt-3 text-sm">下位組織はありません。</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {children.map((c) => (
              <li
                key={c.groupId}
                className="border-border flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <Link
                  href={`/groups/${c.groupId}`}
                  className="text-foreground truncate text-sm hover:underline"
                >
                  {c.name}
                </Link>
                {canManage && (
                  <button
                    onClick={() => handleRemoveChild(c.groupId)}
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
              placeholder="下位組織のID"
              required
              className="flex-1 text-sm"
            />
            <SecondaryButton
              type="submit"
              disabled={addingChild}
              className="text-sm"
            >
              {addingChild ? "追加中..." : "下位組織を追加"}
            </SecondaryButton>
          </form>
        )}
      </Card>

      {parents.length > 0 && (
        <Card>
          <h2 className="text-foreground text-sm font-medium">
            上位組織 ({parents.length})
          </h2>
          <ul className="mt-4 flex flex-col gap-2">
            {parents.map((p) => (
              <li
                key={p.groupId}
                className="border-border rounded-xl border px-4 py-3"
              >
                <Link
                  href={`/groups/${p.groupId}`}
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
