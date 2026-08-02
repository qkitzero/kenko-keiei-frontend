"use client";

import LogoutButton from "@/components/LogoutButton";
import { MENU_PANEL, MENU_TRIGGER } from "@/components/menu";
import { useUser } from "@/context/UserContext";
import { useDismissableMenu } from "@/lib/useDismissableMenu";
import { useCallback, useState } from "react";

export default function AccountMenu() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { containerRef, triggerRef } = useDismissableMenu(open, close);

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`${MENU_TRIGGER} gap-2 border-transparent pr-2 pl-1`}
      >
        <span className="bg-primary text-on-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {user.displayName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">
          {user.displayName}
        </span>
      </button>

      {open && (
        <div className={MENU_PANEL}>
          <div className="px-2.5 py-2">
            <p className="text-foreground truncate text-sm font-medium">
              {user.displayName}
            </p>
            <p className="text-subtle mt-0.5 truncate text-xs">{user.userId}</p>
          </div>
          <div className="bg-border my-1 h-px" />
          <dl className="space-y-1.5 px-2.5 py-1.5 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-subtle">表示名</dt>
              <dd className="text-foreground">{user.displayName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-subtle">生年月日</dt>
              <dd className="text-foreground">
                {user.birthDate.year}年{user.birthDate.month}月
                {user.birthDate.day}日
              </dd>
            </div>
          </dl>
          <div className="bg-border my-1 h-px" />
          <div className="p-1">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
