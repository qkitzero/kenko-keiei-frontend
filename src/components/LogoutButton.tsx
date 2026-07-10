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
      className="border-border hover:bg-hover flex h-11 w-full cursor-pointer items-center justify-center rounded-full border border-solid px-5 transition-colors hover:border-transparent disabled:opacity-50"
    >
      {isLoading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
