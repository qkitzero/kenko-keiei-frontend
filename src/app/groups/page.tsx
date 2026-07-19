"use client";

import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import TextField from "@/components/TextField";
import { useOrgs } from "@/context/OrgsContext";
import { useUser } from "@/context/UserContext";
import { roleLabel } from "@/lib/roles";
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
      <PageContainer>
        <div className="bg-placeholder h-9 w-48 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-40 w-full animate-pulse rounded-2xl" />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織
        </h1>
        <p className="text-subtle text-sm">
          組織を表示するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          組織
        </h1>
        <p className="text-muted mt-2">所属している組織の一覧です。</p>
      </section>

      <Card>
        <h2 className="text-foreground text-sm font-medium">
          新しい組織を作成
        </h2>
        <form onSubmit={handleCreate} className="mt-4 flex gap-3">
          <TextField
            value={name}
            onChange={setName}
            placeholder="組織名"
            required
            className="flex-1"
          />
          <PrimaryButton type="submit" disabled={creating}>
            {creating ? "作成中..." : "作成"}
          </PrimaryButton>
        </form>
        {error && <p className="text-danger mt-3 text-sm">{error}</p>}
      </Card>

      <section className="flex flex-col gap-3">
        {memberships.length === 0 ? (
          <Card as="div" padding="lg" dashed className="text-center">
            <p className="text-muted text-sm">
              まだ組織に所属していません。上のフォームから作成してください。
            </p>
          </Card>
        ) : (
          memberships.map(({ group, role }) => (
            <Card
              key={group.groupId}
              href={`/groups/${group.groupId}`}
              padding="sm"
              className="flex items-center justify-between"
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
            </Card>
          ))
        )}
      </section>
    </PageContainer>
  );
}
