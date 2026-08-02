"use client";

import ManageTenantsLink from "@/components/ManageTenantsLink";
import { tenantIdFromPathname, useTenants } from "@/context/TenantsContext";
import { roleLabel } from "@/lib/roles";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TenantSwitcher() {
  const { memberships, loading, error, selectedTenantId, selectTenant } =
    useTenants();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.isComposing) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const pathTenantId = tenantIdFromPathname(pathname);
  const shownTenantId = pathTenantId || selectedTenantId;
  const activeTenant = memberships.find(
    ({ tenant }) => tenant.tenantId === shownTenantId,
  )?.tenant;

  const handleSelect = (tenantId: string) => {
    selectTenant(tenantId);
    setOpen(false);
    if (pathTenantId) {
      router.push(`/tenants/${tenantId}`);
    }
  };

  if (loading) {
    return <div className="bg-placeholder h-7 w-32 animate-pulse rounded-lg" />;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="border-border text-foreground hover:bg-hover flex max-w-[14rem] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
      >
        <span className="text-subtle hidden shrink-0 text-xs font-normal sm:inline">
          テナント
        </span>
        <span className="truncate">{activeTenant?.name ?? "—"}</span>
        <span className="text-subtle text-xs">▾</span>
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 mt-2 min-w-64 rounded-xl border p-2 shadow-lg">
          <ManageTenantsLink onClick={() => setOpen(false)} />

          <div className="bg-border my-1 h-px" />

          {memberships.length === 0 ? (
            <p className="text-subtle px-3 py-2 text-xs">
              {error
                ? "テナント情報を取得できませんでした。"
                : "所属しているテナントはありません。"}
            </p>
          ) : (
            <>
              <p className="text-subtle px-3 py-2 text-xs">
                表示中のテナントを切り替えます。
              </p>
              <div className="max-h-72 overflow-y-auto">
                {memberships.map(({ tenant, role }) => {
                  const isActive = tenant.tenantId === selectedTenantId;
                  return (
                    <button
                      key={tenant.tenantId}
                      onClick={() => handleSelect(tenant.tenantId)}
                      aria-current={isActive ? "true" : undefined}
                      className={`hover:bg-hover flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        isActive ? "bg-hover" : ""
                      }`}
                    >
                      <span className="text-foreground truncate text-sm">
                        {tenant.name}
                      </span>
                      <span className="text-subtle flex shrink-0 items-center gap-1.5 text-xs">
                        {roleLabel(role)}
                        <span
                          className={isActive ? "text-primary" : "invisible"}
                          aria-hidden
                        >
                          ✓
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
