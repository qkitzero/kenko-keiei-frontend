"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import DataTable, { type Column } from "@/components/DataTable";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import StateCard from "@/components/StateCard";
import TextField from "@/components/TextField";
import { useTenants, type TenantMembership } from "@/context/TenantsContext";
import { useUser } from "@/context/UserContext";
import { roleLabel } from "@/lib/roles";
import { useState } from "react";

const TENANT_COLUMNS: Column<TenantMembership>[] = [
  { header: "テナント名", cell: ({ tenant }) => tenant.name },
  {
    header: "ID",
    cell: ({ tenant }) => (
      <span className="text-subtle font-mono text-xs">{tenant.tenantId}</span>
    ),
  },
  {
    header: "ロール",
    cell: ({ role }) => <Badge size="sm">{roleLabel(role)}</Badge>,
    align: "end",
  },
];

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
    return <PageSkeleton />;
  }

  if (!user) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
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
      <PageHeader
        title="テナント"
        description="所属しているテナントの一覧です。顧客と組織はテナントごとに管理します。"
      />

      <Card title="新しいテナントを作成">
        <form onSubmit={handleCreate} className="flex gap-2">
          <TextField
            value={name}
            onChange={setName}
            placeholder="テナント名"
            aria-label="テナント名"
            required
            className="max-w-sm flex-1"
          />
          <PrimaryButton type="submit" disabled={creating}>
            {creating ? "作成中..." : "作成"}
          </PrimaryButton>
        </form>
        {error && <p className="text-danger mt-3 text-sm">{error}</p>}
      </Card>

      <div className="flex flex-col gap-3">
        <p className="text-subtle text-sm tabular-nums">
          {memberships.length}件
        </p>
        <DataTable
          caption="所属テナント一覧"
          columns={TENANT_COLUMNS}
          rows={memberships}
          rowKey={({ tenant }) => tenant.tenantId}
          rowHref={({ tenant }) => `/tenants/${tenant.tenantId}`}
          empty={
            <StateCard message="まだテナントに所属していません。上のフォームから作成してください。" />
          }
        />
      </div>
    </PageContainer>
  );
}
