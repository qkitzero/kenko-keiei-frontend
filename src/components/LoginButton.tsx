"use client";

import PrimaryButton, { type PrimarySize } from "@/components/PrimaryButton";
import { useState } from "react";

type LoginButtonProps = {
  size?: PrimarySize;
  className?: string;
};

export default function LoginButton({ size, className }: LoginButtonProps) {
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
      size={size}
      className={className}
    >
      {isLoading ? "ログイン中..." : "ログイン"}
    </PrimaryButton>
  );
}
