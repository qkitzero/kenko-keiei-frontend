"use client";

import { useUser } from "@/context/UserContext";

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          健康経営
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">健康経営ポータル</p>
        <p className="mt-2 text-sm text-zinc-500">
          右上のログインボタンからサインインしてください。
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          おかえりなさい、{user.displayName}さん。
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          健康経営ポータル
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/[.06] bg-white p-6 dark:border-white/[.1] dark:bg-zinc-950">
          <h2 className="text-sm font-medium text-zinc-500">プロフィール</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">表示名</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {user.displayName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">生年月日</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {user.birthDate.year}年{user.birthDate.month}月
                {user.birthDate.day}日
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-black/[.06] bg-white p-6 dark:border-white/[.1] dark:bg-zinc-950">
          <h2 className="text-sm font-medium text-zinc-500">はじめに</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            サインインしています。健康・生産性に関する機能は、準備が整い次第ここに表示されます。
          </p>
        </div>
      </section>
    </main>
  );
}
