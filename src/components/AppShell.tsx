"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), []);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  if (pathname === "/register") {
    return <>{children}</>;
  }

  const signedIn = !loading && !!user;
  const withSidebar = loading || signedIn;

  return (
    <div className="flex min-h-full flex-1">
      {withSidebar && (
        <Sidebar
          ready={signedIn}
          open={drawerOpen}
          onClose={closeDrawer}
          openButtonRef={openButtonRef}
        />
      )}
      <div
        className={`flex min-w-0 flex-1 flex-col ${withSidebar ? "md:pl-56" : ""}`}
      >
        <TopBar
          ready={signedIn}
          loading={loading}
          drawerOpen={drawerOpen}
          onToggleDrawer={toggleDrawer}
          openButtonRef={openButtonRef}
        />
        {children}
      </div>
    </div>
  );
}
