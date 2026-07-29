"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import TextField from "@/components/TextField";
import { useTenants } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { roleLabel } from "@/lib/roles";
import { useState } from "react";

export default function Tenants() {
  const { user, loading: userLoading } = useUser();
  const { memberships, loading: tenantsLoading, refreshTenants } = useTenants();

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
          errData.error || errData.message || "テナントの作成に失敗しました",
        );
      }

      setName("");
      await refreshTenants();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました",
      );
    } finally {
      setCreating(false);
    }
  };

  if (userLoading || (user && tenantsLoading)) {
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
          テナント
        </h1>
        <p className="text-subtle text-sm">
          テナントを表示するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          テナント
        </h1>
        <p className="text-muted mt-2">所属しているテナントの一覧です。</p>
      </section>

      <Card>
        <h2 className="text-foreground text-sm font-medium">
          新しいテナントを作成
        </h2>
        <form onSubmit={handleCreate} className="mt-4 flex gap-3">
          <TextField
            value={name}
            onChange={setName}
            placeholder="テナント名"
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
              まだテナントに所属していません。上のフォームから作成してください。
            </p>
          </Card>
        ) : (
          memberships.map(({ tenant, role }) => (
            <Card
              key={tenant.tenantId}
              href={`/tenants/${tenant.tenantId}`}
              padding="sm"
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-foreground font-medium">{tenant.name}</p>
                <p className="text-subtle mt-0.5 truncate text-xs">
                  {tenant.tenantId}
                </p>
              </div>
              <Badge>{roleLabel(role)}</Badge>
            </Card>
          ))
        )}
      </section>
    </PageContainer>
  );
}
