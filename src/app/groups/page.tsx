"use client";

import { useOrgs } from "@/context/OrgsContext";
import { useUser } from "@/context/UserContext";
import { roleLabel } from "@/lib/roles";
import Link from "next/link";
import { useState } from "react";

export default function Groups() {
  const { user, loading: userLoading } = useUser();
  const { memberships, loading: orgsLoading, refreshOrgs } = useOrgs();

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating || !name.trim()) return;

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/group/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || errData.message || "組織の作成に失敗しました",
        );
      }

      setName("");
      await refreshOrgs();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました",
      );
    } finally {
      setCreating(false);
    }
  };

  if (userLoading || (user && orgsLoading)) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="bg-placeholder h-9 w-48 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-40 w-full animate-pulse rounded-2xl" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織
        </h1>
        <p className="text-subtle text-sm">
          組織を表示するにはサインインしてください。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          組織
        </h1>
        <p className="text-muted mt-2">所属している組織の一覧です。</p>
      </section>

      <section className="border-border bg-surface rounded-2xl border p-6">
        <h2 className="text-foreground text-sm font-medium">
          新しい組織を作成
        </h2>
        <form onSubmit={handleCreate} className="mt-4 flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="組織名"
            required
            className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-primary text-on-primary hover:bg-primary-hover flex h-11 items-center justify-center rounded-full px-5 transition-colors disabled:opacity-50"
          >
            {creating ? "作成中..." : "作成"}
          </button>
        </form>
        {error && <p className="text-danger mt-3 text-sm">{error}</p>}
      </section>

      <section className="flex flex-col gap-3">
        {memberships.length === 0 ? (
          <div className="border-border bg-surface rounded-2xl border border-dashed p-8 text-center">
            <p className="text-muted text-sm">
              まだ組織に所属していません。上のフォームから作成してください。
            </p>
          </div>
        ) : (
          memberships.map(({ group, role }) => (
            <Link
              key={group.groupId}
              href={`/groups/${group.groupId}`}
              className="border-border bg-surface hover:bg-hover flex items-center justify-between rounded-2xl border p-5 transition-colors"
            >
              <div>
                <p className="text-foreground font-medium">{group.name}</p>
                <p className="text-subtle mt-0.5 truncate text-xs">
                  {group.groupId}
                </p>
              </div>
              <span className="border-border text-muted rounded-full border px-3 py-1 text-xs font-medium">
                {roleLabel(role)}
              </span>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
