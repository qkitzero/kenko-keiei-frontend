"use client";

import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";
import PrimaryButton from "@/components/PrimaryButton";
import TextField from "@/components/TextField";
import { useUser } from "@/context/UserContext";
import { errorMessage } from "@/lib/apiError";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerRegister() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (userLoading) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/fitness/customer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || errData.message || "顧客の登録に失敗しました",
        );
      }

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
        <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
          <TextField
            value={name}
            onChange={setName}
            placeholder="顧客名"
            required
            className="flex-1"
          />
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "登録中..." : "登録"}
          </PrimaryButton>
        </form>
        {error && <p className="text-danger mt-3 text-sm">{error}</p>}
      </Card>
    </PageContainer>
  );
}
