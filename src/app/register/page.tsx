"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
  const router = useRouter();
  const { refreshUser } = useUser();

  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const dateParts = birthDate.split("-").map((str) => parseInt(str, 10));
    if (dateParts.length !== 3 || dateParts.some(isNaN)) {
      setError("生年月日を正しく入力してください。");
      setLoading(false);
      return;
    }
    const [year, month, day] = dateParts;

    try {
      const res = await fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          birthDate: { year, month, day },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "ユーザー登録に失敗しました");
      }

      await refreshUser();
      router.push("/");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-muted flex flex-1 flex-col items-center justify-center px-6">
      <div className="border-border bg-surface w-full max-w-sm rounded-2xl border p-8">
        <h1 className="text-foreground mb-2 text-2xl font-semibold tracking-tight">
          プロフィールを作成
        </h1>
        <p className="text-muted mb-6 text-sm">
          アカウント設定を完了するために、あなたの情報を教えてください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="text-muted mb-1 block text-sm font-medium"
            >
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="birthDate"
              className="text-muted mb-1 block text-sm font-medium"
            >
              生年月日
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-on-primary hover:bg-primary-hover flex h-12 w-full items-center justify-center rounded-full px-5 transition-colors disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録"}
          </button>

          {error && <p className="text-danger text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
