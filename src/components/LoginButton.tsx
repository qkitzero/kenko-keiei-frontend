"use client";

import PrimaryButton, { type PrimarySize } from "@/components/PrimaryButton";
import { currentReturnTo, rememberReturnTo } from "@/lib/returnTo";
import { useState } from "react";

type LoginButtonProps = {
  size?: PrimarySize;
  className?: string;
};

export default function LoginButton({ size, className }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setFailed(false);
    try {
      const returnTo = currentReturnTo();
      rememberReturnTo(returnTo);
      const res = await fetch(
        `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
      );
      if (!res.ok) throw new Error("login unavailable");
      const { loginUrl } = (await res.json()) as { loginUrl?: string };
      if (!loginUrl) throw new Error("login unavailable");
      window.location.href = loginUrl;
    } catch {
      setIsLoading(false);
      setFailed(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <PrimaryButton
        onClick={handleLogin}
        disabled={isLoading}
        size={size}
        className={className}
      >
        {isLoading ? "ログイン中..." : "ログイン"}
      </PrimaryButton>
      {failed && (
        <p className="text-danger text-sm">
          ログインを開始できませんでした。時間をおいて再度お試しください。
        </p>
      )}
    </div>
  );
}
