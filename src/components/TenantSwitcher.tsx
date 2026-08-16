"use client";

import { MENU_ITEM, MENU_PANEL, MENU_TRIGGER } from "@/components/menu";
import { tenantIdFromPathname, useTenants } from "@/context/TenantsContext";
import { roleLabel } from "@/lib/roles";
import { useDismissableMenu } from "@/lib/useDismissableMenu";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function TenantSwitcher() {
  const { memberships, loading, error, selectedTenantId, selectTenant } =
    useTenants();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { containerRef, triggerRef } = useDismissableMenu(open, close);

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

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`${MENU_TRIGGER} max-w-56 gap-1.5`}
      >
        <span className="text-subtle sr-only shrink-0 text-xs font-normal sm:not-sr-only">
          テナント
        </span>
        {loading ? (
          <span className="bg-placeholder h-3.5 w-20 animate-pulse rounded" />
        ) : (
          <span className="truncate">{activeTenant?.name ?? "—"}</span>
        )}
        <span className="text-subtle text-xs" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className={`${MENU_PANEL} w-64 sm:w-80`}>
          {loading ? (
            <p className="text-subtle px-2.5 py-2 text-xs">
              テナント情報を読み込んでいます。
            </p>
          ) : memberships.length === 0 ? (
            <p className="text-subtle px-2.5 py-2 text-xs">
              {error
                ? "テナント情報を取得できませんでした。"
                : "所属しているテナントはありません。"}
            </p>
          ) : (
            <>
              <p className="text-subtle px-2.5 py-1.5 text-xs">
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
                      className={`${MENU_ITEM} ${isActive ? "bg-hover" : ""}`}
                    >
                      <span className="text-foreground break-words">
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
