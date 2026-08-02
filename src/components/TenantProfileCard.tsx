"use client";

import Card from "@/components/Card";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import TenantProfileFields from "@/components/TenantProfileFields";
import { ensureOk, runWithError } from "@/lib/apiError";
import {
  EMPTY_TENANT_PROFILE_FORM,
  TenantProfileFormValues,
  buildTenantProfilePayload,
  tenantProfileToForm,
} from "@/lib/tenantProfile";
import { useCallback, useEffect, useState } from "react";

type LoadResult =
  | { status: "ok"; values: TenantProfileFormValues }
  | { status: "missing" }
  | { status: "error" };

async function loadTenantProfile(tenantId: string): Promise<LoadResult> {
  const res = await fetch(`/api/fitness/tenant/${tenantId}/profile`);
  if (res.status === 404) return { status: "missing" };
  if (!res.ok) return { status: "error" };

  const data = await res.json();
  return {
    status: "ok",
    values: data.profile
      ? tenantProfileToForm(data.profile)
      : EMPTY_TENANT_PROFILE_FORM,
  };
}

export default function TenantProfileCard({ tenantId }: { tenantId: string }) {
  const [values, setValues] = useState(EMPTY_TENANT_PROFILE_FORM);
  const [fetched, setFetched] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadTenantProfile(tenantId).catch(
        () => ({ status: "error" }) as const,
      );
      if (!active) return;
      if (result.status === "error") {
        setLoadError(true);
      } else {
        setValues(
          result.status === "ok" ? result.values : EMPTY_TENANT_PROFILE_FORM,
        );
        setLoadError(false);
      }
      setFetched(true);
    })();
    return () => {
      active = false;
    };
  }, [tenantId, reloadKey]);

  const handleChange = useCallback((next: TenantProfileFormValues) => {
    setValues(next);
    setSaved(false);
  }, []);

  const handleRetry = () => {
    setFetched(false);
    setLoadError(false);
    setReloadKey((key) => key + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const parsed = buildTenantProfilePayload(values);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setSaving(true);
    setSaved(false);
    void runWithError(setError, async () => {
      const res = await fetch(`/api/fitness/tenant/${tenantId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.payload),
      });
      await ensureOk(res, "テナント情報の保存に失敗しました");

      const data = await res.json().catch(() => null);
      if (data?.profile) {
        setValues(tenantProfileToForm(data.profile));
        setSaved(true);
        return;
      }

      const reloaded = await loadTenantProfile(tenantId).catch(
        () => ({ status: "error" }) as const,
      );
      if (reloaded.status !== "ok") {
        throw new Error(
          "保存は完了しましたが、最新の情報を取得できませんでした。ページを再読み込みしてください。",
        );
      }
      setValues(reloaded.values);
      setSaved(true);
    }).finally(() => setSaving(false));
  };

  if (!fetched) {
    return (
      <Card title="テナント情報">
        <div className="bg-placeholder h-48 w-full animate-pulse rounded-md" />
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card title="テナント情報">
        <p className="text-subtle text-sm">
          テナント情報を取得できませんでした。
        </p>
        <div className="mt-3">
          <SecondaryButton onClick={handleRetry}>再取得</SecondaryButton>
        </div>
      </Card>
    );
  }

  return (
    <Card title="テナント情報">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <TenantProfileFields
          values={values}
          onChange={handleChange}
          disabled={saving}
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          {saved && <p className="text-subtle text-sm">保存しました</p>}
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
