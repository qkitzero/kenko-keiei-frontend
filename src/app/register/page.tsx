"use client";

import Card from "@/components/Card";
import PageMessage from "@/components/PageMessage";
import PageSkeleton from "@/components/PageSkeleton";
import PrimaryButton from "@/components/PrimaryButton";
import SignedOut from "@/components/SignedOut";
import TextField from "@/components/TextField";
import { useUser } from "@/context/UserContext";
import { takeReturnTo } from "@/lib/returnTo";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
  const router = useRouter();
  const { status, refreshUser } = useUser();

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
      router.push(takeReturnTo() || "/");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "予期しないエラーが発生しました",
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <PageSkeleton width="detail" />;
  }

  if (status === "signedOut") {
    return <SignedOut pathname="/register" />;
  }

  if (status === "error") {
    return (
      <PageMessage
        title="ユーザー情報を取得できませんでした"
        message="時間をおいて再度お試しください。"
      />
    );
  }

  if (status === "ready") {
    return (
      <PageMessage
        title="プロフィールは作成済みです"
        link={{ href: "/", label: "ホームに戻る" }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <Card as="div" padding="lg" className="w-full max-w-sm">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          プロフィールを作成
        </h1>
        <p className="text-muted mt-1 mb-6 text-sm">
          アカウント設定を完了するために、あなたの情報を教えてください。
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            id="displayName"
            label="表示名"
            value={displayName}
            onChange={setDisplayName}
            required
          />

          <TextField
            id="birthDate"
            label="生年月日"
            type="date"
            value={birthDate}
            onChange={setBirthDate}
            required
          />

          {error && <p className="text-danger text-sm">{error}</p>}

          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "登録中..." : "登録"}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
