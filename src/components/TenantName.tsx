"use client";

import CopyButton from "@/components/CopyButton";
import SecondaryButton from "@/components/SecondaryButton";
import { useTenantName } from "@/lib/useTenantName";
import { useState } from "react";

export default function TenantName({ tenantId }: { tenantId: string }) {
  const state = useTenantName(tenantId);
  const [retrying, setRetrying] = useState(false);

  if (state.status === "loading") {
    return (
      <span className="bg-placeholder block h-5 w-40 animate-pulse rounded" />
    );
  }

  if (state.status === "ok") {
    return state.name ? (
      <>{state.name}</>
    ) : (
      <span className="text-subtle">名前が未登録のテナント</span>
    );
  }

  const handleRetry = () => {
    if (retrying || state.status !== "error") return;
    setRetrying(true);
    void state.refresh().finally(() => setRetrying(false));
  };

  return (
    <div>
      <p className="text-subtle text-sm">
        {state.status === "error"
          ? "テナント名を取得できませんでした"
          : "あなたが所属していないテナントです"}
      </p>
      <span className="text-subtle mt-0.5 flex items-start gap-1 font-mono text-xs">
        <span className="min-w-0 break-all">{tenantId}</span>
        <CopyButton value={tenantId} label="テナント ID をコピー" />
      </span>
      {state.status === "error" && (
        <div className="mt-2">
          <SecondaryButton size="sm" onClick={handleRetry} disabled={retrying}>
            {retrying ? "再取得中..." : "テナント名を再取得"}
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
