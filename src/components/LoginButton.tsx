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
      className="bg-foreground text-background hover:bg-primary-hover flex h-12 w-full items-center justify-center rounded-full px-5 transition-colors disabled:opacity-50"
    >
      {isLoading ? "ログイン中..." : "ログイン"}
    </button>
  );
}
