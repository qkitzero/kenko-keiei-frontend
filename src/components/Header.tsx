"use client";

import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
import OrgSwitcher from "@/components/OrgSwitcher";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/register") {
    return null;
  }

  return (
    <header className="border-border bg-surface/80 sticky top-0 z-20 flex w-full items-center justify-between border-b px-6 py-4 backdrop-blur">
      <Link
        href="/"
        className="text-foreground text-lg font-semibold tracking-tight"
      >
        健康経営
      </Link>

      <div className="flex items-center gap-3">
        {!loading && user && <OrgSwitcher />}
        <div className="relative" ref={menuRef}>
          {loading ? (
            <div className="bg-placeholder h-8 w-8 animate-pulse rounded-full" />
          ) : user ? (
            <>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:bg-hover flex cursor-pointer items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors"
              >
                <span className="bg-foreground text-background flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="text-foreground text-sm font-medium">
                  {user.displayName}
                </span>
              </button>
              {isMenuOpen && (
                <div className="border-border bg-surface absolute right-0 mt-2 min-w-56 rounded-xl border p-2 shadow-lg">
                  <div className="px-3 py-2">
                    <p className="text-foreground text-sm font-medium">
                      {user.displayName}
                    </p>
                    <p className="text-subtle mt-0.5 truncate text-xs">
                      {user.userId}
                    </p>
                  </div>
                  <div className="bg-border my-1 h-px" />
                  <div className="px-1 pb-1">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-28">
              <LoginButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
