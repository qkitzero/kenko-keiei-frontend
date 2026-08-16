"use client";

import PageMessage from "@/components/PageMessage";
import PrimaryLink from "@/components/PrimaryLink";
import SecondaryButton from "@/components/SecondaryButton";
import Sidebar from "@/components/Sidebar";
import SignedOut from "@/components/SignedOut";
import TopBar from "@/components/TopBar";
import { useUser } from "@/context/UserContext";
import { currentReturnTo, takeReturnTo } from "@/lib/returnTo";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function ProfileRequired() {
  return (
    <PageMessage
      title="プロフィールの作成が必要です"
      message="アプリを使うには、はじめにプロフィールを作成してください。"
      action={<PrimaryLink href="/register">プロフィールを作成</PrimaryLink>}
    />
  );
}

function LoadFailed() {
  const { refreshUser } = useUser();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    if (retrying) return;
    setRetrying(true);
    void refreshUser().finally(() => setRetrying(false));
  };

  return (
    <PageMessage
      title="ユーザー情報を取得できませんでした"
      message="時間をおいて再度お試しください。"
      action={
        <SecondaryButton onClick={handleRetry} disabled={retrying}>
          {retrying ? "再試行中..." : "再試行"}
        </SecondaryButton>
      }
    />
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const reconciledRef = useRef(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), []);

  useEffect(() => {
    if (status !== "ready" || reconciledRef.current) return;
    reconciledRef.current = true;
    const pending = takeReturnTo();
    if (pending && pending !== currentReturnTo()) {
      router.replace(pending);
    }
  }, [status, router]);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  if (status === "signedOut") {
    return <SignedOut pathname={pathname} />;
  }

  if (status === "noProfile") {
    return <ProfileRequired />;
  }

  if (status === "error") {
    return <LoadFailed />;
  }

  const ready = status === "ready";

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar
        ready={ready}
        open={drawerOpen}
        onClose={closeDrawer}
        openButtonRef={openButtonRef}
      />
      <div className="flex min-w-0 flex-1 flex-col md:pl-56 print:pl-0">
        <TopBar
          ready={ready}
          drawerOpen={drawerOpen}
          onToggleDrawer={toggleDrawer}
          openButtonRef={openButtonRef}
        />
        {children}
      </div>
    </div>
  );
}
