"use client";

import Badge from "@/components/Badge";
import Card from "@/components/Card";
import DataTable, { type Column } from "@/components/DataTable";
import NoTenantCard from "@/components/NoTenantCard";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import TextField from "@/components/TextField";
import { useTenants, type TenantMembership } from "@/context/TenantsContext";
import { roleLabel } from "@/lib/roles";
import Link from "next/link";
import { useState } from "react";

const TENANT_COLUMNS: Column<TenantMembership>[] = [
  {
    header: "テナント名",
    cell: ({ tenant }) => (
      <Link
        href={`/tenants/${tenant.tenantId}`}
        className="text-foreground font-medium hover:underline"
      >
        {tenant.name}
      </Link>
    ),
  },
  {
    header: "ロール",
    cell: ({ role }) => <Badge size="sm">{roleLabel(role)}</Badge>,
    align: "end",
  },
];

export default function Tenants() {
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

  if (tenantsLoading) {
    return <PageSkeleton shape="count" form />;
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
          empty={<NoTenantCard />}
        />
      </div>
    </PageContainer>
  );
}
