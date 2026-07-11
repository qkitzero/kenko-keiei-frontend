"use client";

import { useOrgs } from "@/context/OrgsContext";
import { useUser } from "@/context/UserContext";
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

  return {
    status: "ok",
    data: {
      group,
      members: membersRes.ok ? ((await membersRes.json()).members ?? []) : [],
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
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました",
      );
    }
  };

  const ensureOk = async (res: Response, fallback: string) => {
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || fallback);
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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="bg-placeholder h-9 w-56 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-64 w-full animate-pulse rounded-2xl" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <p className="text-subtle text-sm">
          この組織を表示するにはサインインしてください。
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織が見つかりません
        </h1>
        <Link href="/groups" className="text-muted text-sm underline">
          組織一覧に戻る
        </Link>
      </main>
    );
  }

  if (loadError || !group) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織を読み込めませんでした
        </h1>
        <p className="text-subtle text-sm">時間をおいて再度お試しください。</p>
        <Link href="/groups" className="text-muted text-sm underline">
          組織一覧に戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
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

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {canManage && (
        <section className="border-border bg-surface rounded-2xl border p-6">
          <h2 className="text-foreground text-sm font-medium">組織設定</h2>
          <form onSubmit={handleRename} className="mt-4 flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2"
            />
            <button
              type="submit"
              disabled={savingName}
              className="border-border text-foreground hover:bg-hover flex h-11 items-center justify-center rounded-full border px-5 transition-colors disabled:opacity-50"
            >
              {savingName ? "保存中..." : "名前を更新"}
            </button>
          </form>
          {owner && (
            <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-subtle text-sm">
                この組織を削除します。元に戻せません。
              </p>
              <button
                onClick={handleDeleteGroup}
                className="flex h-11 items-center justify-center rounded-full border border-rose-500/40 px-5 text-rose-500 transition-colors hover:bg-rose-500/10"
              >
                組織を削除
              </button>
            </div>
          )}
        </section>
      )}

      <section className="border-border bg-surface rounded-2xl border p-6">
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
                    <select
                      value={m.role}
                      onChange={(e) =>
                        handleRoleChange(m.userId, e.target.value)
                      }
                      className="border-border bg-surface text-foreground rounded-lg border px-2 py-1 text-xs outline-none"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-muted text-xs">
                      {roleLabel(m.role)}
                    </span>
                  )}
                  {canManage && !rowIsOwner && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      className="text-subtle text-xs hover:text-rose-500"
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
            <input
              type="text"
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              placeholder="ユーザーID"
              required
              className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="border-border bg-surface text-foreground rounded-xl border px-2 py-2 text-sm outline-none"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addingMember}
              className="bg-foreground text-background hover:bg-primary-hover flex h-11 items-center justify-center rounded-full px-5 text-sm transition-colors disabled:opacity-50"
            >
              {addingMember ? "追加中..." : "追加"}
            </button>
          </form>
        )}
      </section>

      <section className="border-border bg-surface rounded-2xl border p-6">
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
                    className="text-subtle text-xs hover:text-rose-500"
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
            <input
              type="text"
              value={newChildId}
              onChange={(e) => setNewChildId(e.target.value)}
              placeholder="下位組織のID"
              required
              className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
            <button
              type="submit"
              disabled={addingChild}
              className="border-border text-foreground hover:bg-hover flex h-11 items-center justify-center rounded-full border px-5 text-sm transition-colors disabled:opacity-50"
            >
              {addingChild ? "追加中..." : "下位組織を追加"}
            </button>
          </form>
        )}
      </section>

      {parents.length > 0 && (
        <section className="border-border bg-surface rounded-2xl border p-6">
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
        </section>
      )}
    </main>
  );
}
