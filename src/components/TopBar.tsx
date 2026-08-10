"use client";

import AccountMenu from "@/components/AccountMenu";
import TenantSwitcher from "@/components/TenantSwitcher";
import { APP_NAME } from "@/lib/app";
import Link from "next/link";

type TopBarProps = {
  ready: boolean;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  openButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export default function TopBar({
  ready,
  drawerOpen,
  onToggleDrawer,
  openButtonRef,
}: TopBarProps) {
  return (
    <header className="border-border bg-surface/85 sticky top-0 z-10 shrink-0 border-b backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {ready ? (
            <button
              ref={openButtonRef}
              onClick={onToggleDrawer}
              aria-label="メニュー"
              aria-expanded={drawerOpen}
              aria-controls="app-nav-drawer"
              className="text-muted hover:bg-hover hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="size-4"
                aria-hidden
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : (
            <div className="size-8 shrink-0 md:hidden" aria-hidden />
          )}
          <Link
            href="/"
            className="text-foreground min-w-0 truncate text-sm font-semibold tracking-tight md:hidden"
          >
            {APP_NAME}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {ready ? (
            <>
              <TenantSwitcher />
              <AccountMenu />
            </>
          ) : (
            <>
              <div
                className="border-border h-8 w-28 shrink-0 rounded-md border sm:w-44"
                aria-hidden
              />
              <div
                className="bg-placeholder size-6 shrink-0 animate-pulse rounded-full"
                aria-hidden
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
