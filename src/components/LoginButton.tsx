"use client";

import PrimaryButton from "@/components/PrimaryButton";
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
    <PrimaryButton
      onClick={handleLogin}
      disabled={isLoading}
      size="lg"
      className="w-full"
    >
      {isLoading ? "ログイン中..." : "ログイン"}
    </PrimaryButton>
  );
}
