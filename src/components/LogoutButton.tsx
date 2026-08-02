"use client";

import SecondaryButton from "@/components/SecondaryButton";
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
    <SecondaryButton
      onClick={handleLogout}
      disabled={isLoading}
      size="sm"
      className="w-full"
    >
      {isLoading ? "ログアウト中..." : "ログアウト"}
    </SecondaryButton>
  );
}
