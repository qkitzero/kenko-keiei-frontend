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

    const [year, month, day] = birthDate
      .split("-")
      .map((str) => parseInt(str, 10));

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
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.06] bg-white p-8 dark:border-white/[.1] dark:bg-zinc-950">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          プロフィールを作成
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          アカウント設定を完了するために、あなたの情報を教えてください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              表示名
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-xl border border-black/[.1] bg-white px-3 py-2 text-black outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/[.4]"
            />
          </div>

          <div>
            <label
              htmlFor="birthDate"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              生年月日
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="w-full rounded-xl border border-black/[.1] bg-white px-3 py-2 text-black outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/[.4]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {loading ? "登録中..." : "登録"}
          </button>

          {error && <p className="text-sm text-rose-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}
