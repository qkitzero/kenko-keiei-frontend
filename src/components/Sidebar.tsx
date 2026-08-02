"use client";

import NavIcon from "@/components/NavIcon";
import { APP_NAME } from "@/lib/app";
import { NAV_ITEMS, isNavItemActive, type NavItem } from "@/lib/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  onClick?: () => void;
}) {
  const active = isNavItemActive(pathname, item);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={
        pathname === item.href ? "page" : active ? "true" : undefined
      }
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary-subtle text-primary"
          : "text-muted hover:bg-hover hover:text-foreground"
      }`}
    >
      <NavIcon name={item.icon} className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="flex flex-col gap-0.5 px-2 py-2"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          pathname={pathname}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}

function NavSkeleton() {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-2" aria-hidden>
      {NAV_ITEMS.map((item) => (
        <div key={item.href} className="flex h-9 items-center px-2.5">
          <div className="bg-placeholder h-4 w-24 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

type SidebarProps = {
  ready: boolean;
  open: boolean;
  onClose: () => void;
  openButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export default function Sidebar({
  ready,
  open,
  onClose,
  openButtonRef,
}: SidebarProps) {
  const pathname = usePathname();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const lastPathnameRef = useRef(pathname);
  const skipFocusRestoreRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.isComposing) {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || !panel.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !panel.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    function handleMediaChange(event: MediaQueryListEvent) {
      if (event.matches) onClose();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (
        !skipFocusRestoreRef.current &&
        lastPathnameRef.current === pathname
      ) {
        openButtonRef.current?.focus();
      }
      skipFocusRestoreRef.current = false;
    }
    lastPathnameRef.current = pathname;
  }, [open, pathname, openButtonRef]);

  const handleNavigate = () => {
    skipFocusRestoreRef.current = true;
    onClose();
  };

  return (
    <>
      <aside className="border-border bg-surface fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r md:flex">
        <div className="flex h-14 shrink-0 items-center px-4">
          <Link
            href="/"
            className="text-foreground truncate text-sm font-semibold tracking-tight"
          >
            {APP_NAME}
          </Link>
        </div>
        {ready ? <NavList pathname={pathname} /> : <NavSkeleton />}
      </aside>

      {ready &&
        isClient &&
        createPortal(
          <div
            id="app-nav-drawer"
            inert={!open}
            className={`fixed inset-0 z-30 transition-[visibility] duration-200 md:hidden ${
              open ? "visible" : "pointer-events-none invisible"
            }`}
          >
            <div
              onClick={onClose}
              className={`bg-foreground/40 absolute inset-0 transition-opacity duration-200 ${
                open ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="メニュー"
              className={`border-border bg-surface absolute inset-y-0 left-0 flex w-64 flex-col border-r shadow-lg transition-transform duration-200 ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="border-border flex h-14 shrink-0 items-center justify-between border-b px-4">
                <span className="text-foreground truncate text-sm font-semibold">
                  {APP_NAME}
                </span>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  aria-label="メニューを閉じる"
                  className="text-muted hover:bg-hover hover:text-foreground flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors"
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
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <NavList pathname={pathname} onNavigate={handleNavigate} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
