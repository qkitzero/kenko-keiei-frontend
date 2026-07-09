"use client";

import LoginButton from "@/components/LoginButton";
import LogoutButton from "@/components/LogoutButton";
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
    <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-black/[.06] bg-white/80 px-6 py-4 backdrop-blur dark:border-white/[.1] dark:bg-black/80">
      <Link
        href="/"
        className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50"
      >
        健康経営
      </Link>

      <div className="relative" ref={menuRef}>
        {loading ? (
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        ) : user ? (
          <>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {user.displayName}
              </span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 min-w-56 rounded-xl border border-black/[.06] bg-white p-2 shadow-lg dark:border-white/[.1] dark:bg-zinc-950">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {user.displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {user.userId}
                  </p>
                </div>
                <div className="my-1 h-px bg-black/[.06] dark:bg-white/[.08]" />
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
    </header>
  );
}
