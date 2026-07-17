"use client";

import { isNavItemActive, NAV_ITEMS, type NavItem } from "@/lib/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

function NavLink({
  item,
  pathname,
  className,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  className: string;
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
      className={`rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-hover text-foreground"
          : "text-muted hover:bg-hover hover:text-foreground"
      } ${className}`}
    >
      {item.label}
    </Link>
  );
}

export default function GlobalNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const lastPathnameRef = useRef(pathname);
  const skipFocusRestoreRef = useRef(false);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsDrawerOpen(false);
  }

  useEffect(() => {
    if (!isDrawerOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.isComposing) {
        setIsDrawerOpen(false);
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
      if (event.matches) {
        setIsDrawerOpen(false);
      }
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
  }, [isDrawerOpen]);

  useEffect(() => {
    if (isDrawerOpen) {
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
  }, [isDrawerOpen, pathname]);

  return (
    <>
      <nav
        aria-label="グローバルナビゲーション"
        className="hidden shrink-0 items-center gap-1 md:flex"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            className="px-3 py-1.5"
          />
        ))}
      </nav>

      <button
        ref={openButtonRef}
        onClick={() => setIsDrawerOpen((open) => !open)}
        aria-label="メニュー"
        aria-expanded={isDrawerOpen}
        aria-controls="global-nav-drawer"
        className="text-foreground hover:bg-hover flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isClient &&
        createPortal(
          <div
            id="global-nav-drawer"
            inert={!isDrawerOpen}
            className={`fixed inset-0 z-30 transition-[visibility] duration-200 md:hidden ${
              isDrawerOpen ? "visible" : "pointer-events-none invisible"
            }`}
          >
            <div
              onClick={() => setIsDrawerOpen(false)}
              className={`bg-foreground/40 absolute inset-0 transition-opacity duration-200 ${
                isDrawerOpen ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="メニュー"
              className={`border-border bg-surface absolute inset-y-0 left-0 flex w-64 flex-col border-r shadow-lg transition-transform duration-200 ${
                isDrawerOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-4">
                <span className="text-foreground text-sm font-semibold">
                  メニュー
                </span>
                <button
                  ref={closeButtonRef}
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="メニューを閉じる"
                  className="text-foreground hover:bg-hover flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="bg-border h-px" />
              <nav
                aria-label="グローバルナビゲーション"
                className="flex flex-col gap-1 p-2"
              >
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    className="px-3 py-2"
                    onClick={() => {
                      skipFocusRestoreRef.current = true;
                      setIsDrawerOpen(false);
                    }}
                  />
                ))}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
