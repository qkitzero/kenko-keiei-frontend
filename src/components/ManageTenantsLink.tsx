"use client";

import { isNavItemActive, TENANT_NAV_ITEM } from "@/lib/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ManageTenantsLink({
  onClick,
}: {
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, TENANT_NAV_ITEM);

  return (
    <Link
      href={TENANT_NAV_ITEM.href}
      onClick={onClick}
      aria-current={
        pathname === TENANT_NAV_ITEM.href ? "page" : active ? "true" : undefined
      }
      className={`text-foreground hover:bg-hover block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-hover" : ""
      }`}
    >
      テナントを管理
    </Link>
  );
}
