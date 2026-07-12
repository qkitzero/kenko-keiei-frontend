"use client";

import { useUser } from "@/context/UserContext";
import { ensureOk, errorMessage } from "@/lib/apiError";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

type Customer = { customerId: string; name: string };

type LoadResult =
  | { status: "ok"; data: Customer }
  | { status: "not_found" }
  | { status: "error" };

async function loadCustomer(customerId: string): Promise<LoadResult> {
  const res = await fetch(`/api/fitness/customer/${customerId}`);
  if (!res.ok) {
    return { status: res.status === 404 ? "not_found" : "error" };
  }
  const data = await res.json();
  if (!data.customerId) return { status: "not_found" };
  return { status: "ok", data };
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  return <CustomerDetail key={customerId} customerId={customerId} />;
}

function CustomerDetail({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [fetched, setFetched] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const applyResult = useCallback((result: LoadResult) => {
    if (result.status === "ok") {
      setCustomer(result.data);
      setName(result.data.name);
      setNotFound(false);
      setLoadError(false);
    } else if (result.status === "not_found") {
      setNotFound(true);
    } else {
      setLoadError(true);
    }
  }, []);

  const reload = useCallback(async () => {
    const result = await loadCustomer(customerId).catch(
      () => ({ status: "error" }) as const,
    );
    applyResult(result);
  }, [customerId, applyResult]);

  useEffect(() => {
    if (userLoading || !user) return;
    let active = true;
    (async () => {
      const result = await loadCustomer(customerId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      applyResult(result);
      setFetched(true);
    })();
    return () => {
      active = false;
    };
  }, [user, userLoading, customerId, applyResult]);

  const withError = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (savingName || !name.trim()) return;
    setSavingName(true);
    void withError(async () => {
      const res = await fetch(`/api/fitness/customer/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      await ensureOk(res, "顧客名の更新に失敗しました");
      await reload();
    }).finally(() => setSavingName(false));
  };

  const handleDelete = () => {
    if (deleting) return;
    if (
      !window.confirm(
        "本当にこの顧客を削除しますか？この操作は取り消せません。",
      )
    ) {
      return;
    }
    setDeleting(true);
    void withError(async () => {
      const res = await fetch(`/api/fitness/customer/${customerId}`, {
        method: "DELETE",
      });
      await ensureOk(res, "顧客の削除に失敗しました");
      router.push("/customers/register");
    }).finally(() => setDeleting(false));
  };

  if (userLoading || (user && !fetched)) {
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
          この顧客を表示するにはサインインしてください。
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          顧客が見つかりません
        </h1>
        <Link
          href="/customers/register"
          className="text-muted text-sm underline"
        >
          顧客登録に戻る
        </Link>
      </main>
    );
  }

  if (loadError || !customer) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          顧客を読み込めませんでした
        </h1>
        <p className="text-subtle text-sm">時間をおいて再度お試しください。</p>
        <Link
          href="/customers/register"
          className="text-muted text-sm underline"
        >
          顧客登録に戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <Link
          href="/customers/register"
          className="text-subtle text-sm hover:underline"
        >
          ← 顧客登録
        </Link>
      </div>

      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <p className="text-subtle mt-1 truncate text-xs">
          {customer.customerId}
        </p>
      </section>

      {error && <p className="text-danger text-sm">{error}</p>}

      <section className="border-border bg-surface rounded-2xl border p-6">
        <h2 className="text-foreground text-sm font-medium">顧客設定</h2>
        <form onSubmit={handleRename} className="mt-4 flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-border bg-surface text-foreground focus:border-border-strong focus:ring-foreground/20 flex-1 rounded-xl border px-3 py-2 outline-none focus:ring-2"
          />
          <button
            type="submit"
            disabled={savingName}
            className="border-border text-foreground hover:bg-hover flex h-11 items-center justify-center rounded-full border px-5 transition-colors disabled:opacity-50"
          >
            {savingName ? "保存中..." : "名前を更新"}
          </button>
        </form>
        <div className="border-border mt-4 flex items-center justify-between border-t pt-4">
          <p className="text-subtle text-sm">
            この顧客を削除します。元に戻せません。
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="border-danger/40 text-danger hover:bg-danger/10 flex h-11 items-center justify-center rounded-full border px-5 transition-colors disabled:opacity-50"
          >
            {deleting ? "削除中..." : "顧客を削除"}
          </button>
        </div>
      </section>
    </main>
  );
}
