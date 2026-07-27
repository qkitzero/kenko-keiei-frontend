"use client";

import Card from "@/components/Card";
import CustomerFields from "@/components/CustomerFields";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import { useOrgs } from "@/context/OrgsContext";
import { useUser } from "@/context/UserContext";
import { ensureOk, errorMessage } from "@/lib/apiError";
import {
  CustomerFormValues,
  EMPTY_CUSTOMER_FORM,
  buildCustomerPayload,
} from "@/lib/customer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerRegister() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const {
    memberships,
    loading: orgsLoading,
    error: orgsError,
    selectedGroupId,
    refreshOrgs,
  } = useOrgs();

  const [values, setValues] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  if (userLoading || orgsLoading) {
    return (
      <PageContainer>
        <div className="bg-placeholder h-9 w-56 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-40 w-full animate-pulse rounded-2xl" />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer centered>
        <p className="text-subtle text-sm">
          顧客を登録するにはサインインしてください。
        </p>
      </PageContainer>
    );
  }

  if (orgsError) {
    const handleRetry = () => {
      if (retrying) return;
      setRetrying(true);
      void refreshOrgs().finally(() => setRetrying(false));
    };

    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          組織情報を取得できませんでした
        </h1>
        <p className="text-subtle text-sm">
          登録先の組織を読み込めないため、顧客を登録できません。
        </p>
        <SecondaryButton onClick={handleRetry} disabled={retrying}>
          {retrying ? "再試行中..." : "再試行"}
        </SecondaryButton>
      </PageContainer>
    );
  }

  if (memberships.length === 0) {
    return (
      <PageContainer centered>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          登録先の組織がありません
        </h1>
        <p className="text-subtle text-sm">
          顧客を登録するには組織に所属する必要があります。
        </p>
        <Link href="/groups" className="text-muted text-sm underline">
          組織を管理
        </Link>
      </PageContainer>
    );
  }

  const groupId = selectedGroupId;
  const orgName =
    memberships.find(({ group }) => group.groupId === groupId)?.group.name ??
    "";

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
        body: JSON.stringify({ ...result.payload, groupId }),
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
    <PageContainer>
      <div>
        <Link href="/customers" className="text-subtle text-sm hover:underline">
          ← 顧客一覧
        </Link>
      </div>

      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          顧客を登録
        </h1>
        <p className="text-muted mt-2">新しい顧客の情報を入力してください。</p>
      </section>

      <Card>
        <h2 className="text-foreground text-sm font-medium">
          新しい顧客を登録
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-6">
          <div>
            <p className="text-muted text-sm font-medium">登録先の組織</p>
            <p className="text-foreground mt-1 text-sm">{orgName}</p>
            {memberships.length > 1 && (
              <p className="text-subtle mt-1 text-xs">
                ヘッダーの組織メニューで切り替えられます。
              </p>
            )}
          </div>

          <CustomerFields
            values={values}
            onChange={setValues}
            disabled={loading}
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
