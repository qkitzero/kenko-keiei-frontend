"use client";

import { useUser } from "@/context/UserContext";
import { FEATURE_NAV_ITEMS } from "@/lib/navigation";
import Link from "next/link";

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
          健康経営管理システム
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

      <section className="border-border bg-surface rounded-2xl border p-6">
        <h2 className="text-subtle text-sm font-medium">はじめに</h2>
        <p className="text-muted mt-3 text-sm">
          サインインしています。健康・生産性に関する機能は、準備が整い次第ここに表示されます。
        </p>
      </section>

      <section>
        <h2 className="text-subtle text-sm font-medium">機能</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {FEATURE_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-border bg-surface hover:bg-hover flex items-center justify-between gap-4 rounded-2xl border p-6 transition-colors"
            >
              <div>
                <p className="text-foreground font-medium">{item.label}</p>
                <p className="text-muted mt-1 text-sm">{item.description}</p>
              </div>
              <span className="text-subtle" aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
