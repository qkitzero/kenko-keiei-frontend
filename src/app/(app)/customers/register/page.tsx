"use client";

import Card from "@/components/Card";
import CustomerFields from "@/components/CustomerFields";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import { useTenants } from "@/context/TenantsContext";
import { ensureOk, errorMessage } from "@/lib/apiError";
import {
  CustomerFormValues,
  EMPTY_CUSTOMER_FORM,
  buildCustomerPayload,
} from "@/lib/customer";
import { useOrganizations } from "@/lib/useOrganizations";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerRegister() {
  const router = useRouter();
  const {
    memberships,
    loading: tenantsLoading,
    error: tenantsError,
    selectedTenantId,
    refreshTenants,
  } = useTenants();

  const [values, setValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const organizations = useOrganizations(selectedTenantId);

  const [scopedTenantId, setScopedTenantId] = useState(selectedTenantId);
  if (scopedTenantId !== selectedTenantId) {
    setScopedTenantId(selectedTenantId);
    setValues((current) => ({ ...current, organizationId: "" }));
  }

  if (tenantsLoading) {
    return <PageSkeleton width="detail" back />;
  }

  if (tenantsError) {
    const handleRetry = () => {
      if (retrying) return;
      setRetrying(true);
      void refreshTenants().finally(() => setRetrying(false));
    };

    return (
      <PageMessage
        title="テナント情報を取得できませんでした"
        message="登録先のテナントを読み込めないため、顧客を登録できません。"
        action={
          <SecondaryButton onClick={handleRetry} disabled={retrying}>
            {retrying ? "再試行中..." : "再試行"}
          </SecondaryButton>
        }
      />
    );
  }

  if (memberships.length === 0) {
    return (
      <PageMessage
        title="登録先のテナントがありません"
        message="顧客を登録するにはテナントに所属する必要があります。"
        link={{ href: "/tenants", label: "テナントを管理" }}
      />
    );
  }

  const tenantId = selectedTenantId;
  const tenantName =
    memberships.find(({ tenant }) => tenant.tenantId === tenantId)?.tenant
      .name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const result = buildCustomerPayload(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fitness/customer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.payload, tenantId }),
      });
      await ensureOk(res, "顧客の登録に失敗しました");

      const { customerId } = await res.json();
      if (!customerId) {
        throw new Error("顧客の登録に失敗しました");
      }

      router.push(`/customers/${customerId}`);
    } catch (err: unknown) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <PageContainer width="detail">
      <PageHeader
        backHref="/customers"
        backLabel="顧客一覧"
        title="顧客を登録"
        description={`${tenantName}に新しい顧客を登録します。`}
      />

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CustomerFields
            values={values}
            onChange={setValues}
            disabled={loading}
            organizations={organizations}
          />

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex justify-end">
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "登録中..." : "登録"}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
