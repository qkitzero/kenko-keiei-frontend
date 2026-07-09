"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/logout");
      const { logoutUrl } = await res.json();
      window.location.href = logoutUrl;
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex h-11 w-full cursor-pointer items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
    >
      {isLoading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
