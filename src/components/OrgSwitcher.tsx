"use client";

import { useOrgs } from "@/context/OrgsContext";
import { roleLabel } from "@/lib/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function OrgSwitcher() {
  const { memberships, loading } = useOrgs();
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

  const match = pathname.match(/^\/groups\/([^/]+)/);
  const activeId = match?.[1];
  const activeOrg = activeId
    ? memberships.find((m) => m.group.groupId === activeId)?.group
    : memberships[0]?.group;

  if (loading) {
    return <div className="bg-placeholder h-7 w-32 animate-pulse rounded-lg" />;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="border-border text-foreground hover:bg-hover flex max-w-[12rem] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
      >
        <span className="truncate">{activeOrg?.name ?? "組織"}</span>
        <span className="text-subtle text-xs">▾</span>
      </button>

      {open && (
        <div className="border-border bg-surface absolute right-0 mt-2 min-w-64 rounded-xl border p-2 shadow-lg">
          {memberships.length === 0 ? (
            <p className="text-subtle px-3 py-2 text-xs">
              所属している組織はありません。
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {memberships.map(({ group, role }) => {
                const isActive = group.groupId === activeId;
                return (
                  <Link
                    key={group.groupId}
                    href={`/groups/${group.groupId}`}
                    onClick={() => setOpen(false)}
                    className={`hover:bg-hover flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive ? "bg-hover" : ""
                    }`}
                  >
                    <span className="text-foreground truncate text-sm">
                      {group.name}
                    </span>
                    <span className="text-subtle shrink-0 text-xs">
                      {roleLabel(role)}
                    </span>
                  </Link>
                );
              })}
            </div>
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
