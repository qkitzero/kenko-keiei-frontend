"use client";

import { groupIdFromPathname, useOrgs } from "@/context/OrgsContext";
import { roleLabel } from "@/lib/roles";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function OrgSwitcher() {
  const { memberships, loading, error, selectedGroupId, selectGroup } =
    useOrgs();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pathGroupId = groupIdFromPathname(pathname);
  const shownGroupId = pathGroupId || selectedGroupId;
  const activeOrg = memberships.find(
    ({ group }) => group.groupId === shownGroupId,
  )?.group;

  const handleSelect = (groupId: string) => {
    selectGroup(groupId);
    setOpen(false);
    if (pathGroupId) {
      router.push(`/groups/${groupId}`);
    }
  };

  if (loading) {
    return <div className="bg-placeholder h-7 w-32 animate-pulse rounded-lg" />;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="border-border text-foreground hover:bg-hover flex max-w-[14rem] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
      >
        <span className="text-subtle hidden shrink-0 text-xs font-normal sm:inline">
          組織
        </span>
        <span className="truncate">{activeOrg?.name ?? "—"}</span>
        <span className="text-subtle text-xs">▾</span>
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 mt-2 min-w-64 rounded-xl border p-2 shadow-lg">
          {memberships.length === 0 ? (
            <p className="text-subtle px-3 py-2 text-xs">
              {error
                ? "組織情報を取得できませんでした。"
                : "所属している組織はありません。"}
            </p>
          ) : (
            <>
              <p className="text-subtle px-3 py-2 text-xs">
                表示中の組織を切り替えます。
              </p>
              <div className="max-h-72 overflow-y-auto">
                {memberships.map(({ group, role }) => {
                  const isActive = group.groupId === selectedGroupId;
                  return (
                    <button
                      key={group.groupId}
                      onClick={() => handleSelect(group.groupId)}
                      aria-current={isActive ? "true" : undefined}
                      className={`hover:bg-hover flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                        isActive ? "bg-hover" : ""
                      }`}
                    >
                      <span className="text-foreground truncate text-sm">
                        {group.name}
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

          <div className="bg-border my-1 h-px" />

          <Link
            href="/groups"
            onClick={() => setOpen(false)}
            className="text-foreground hover:bg-hover block rounded-lg px-3 py-2 text-sm transition-colors"
          >
            組織を管理
          </Link>
        </div>
      )}
    </div>
  );
}
