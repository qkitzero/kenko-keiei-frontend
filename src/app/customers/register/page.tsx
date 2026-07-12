"use client";

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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="bg-placeholder h-9 w-56 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-40 w-full animate-pulse rounded-2xl" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <p className="text-subtle text-sm">
          顧客を登録するにはサインインしてください。
        </p>
      </main>
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
    <div className="bg-surface-muted flex flex-1 flex-col items-center justify-center px-6">
      <div className="border-border bg-surface w-full max-w-sm rounded-2xl border p-8">
        <h1 className="text-foreground mb-2 text-2xl font-semibold tracking-tight">
          顧客を登録
        </h1>
        <p className="text-muted mb-6 text-sm">
          新しい顧客の情報を入力してください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="text-muted mb-1 block text-sm font-medium"
            >
              顧客名
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active flex h-12 w-full items-center justify-center rounded-full px-5 transition-colors disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録"}
          </button>

          {error && <p className="text-danger text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
