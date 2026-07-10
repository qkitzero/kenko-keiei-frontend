"use client";

import { useUser } from "@/context/UserContext";

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="bg-placeholder h-9 w-64 animate-pulse rounded-lg" />
        <div className="bg-placeholder h-40 w-full animate-pulse rounded-2xl" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          健康経営
        </h1>
        <p className="text-muted">健康経営ポータル</p>
        <p className="text-subtle mt-2 text-sm">
          右上のログインボタンからサインインしてください。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          おかえりなさい、{user.displayName}さん。
        </h1>
        <p className="text-muted mt-2">健康経営ポータル</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border-border bg-surface rounded-2xl border p-6">
          <h2 className="text-subtle text-sm font-medium">プロフィール</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-subtle">表示名</dt>
              <dd className="text-foreground font-medium">
                {user.displayName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-subtle">生年月日</dt>
              <dd className="text-foreground font-medium">
                {user.birthDate.year}年{user.birthDate.month}月
                {user.birthDate.day}日
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-6">
          <h2 className="text-subtle text-sm font-medium">はじめに</h2>
          <p className="text-muted mt-3 text-sm">
            サインインしています。健康・生産性に関する機能は、準備が整い次第ここに表示されます。
          </p>
        </div>
      </section>
    </main>
  );
}
