"use client";

import { useState } from "react";

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login");
      const { loginUrl } = await res.json();
      window.location.href = loginUrl;
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
    >
      {isLoading ? "ログイン中..." : "ログイン"}
    </button>
  );
}
