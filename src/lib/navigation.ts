export type NavItem = {
  label: string;
  description: string;
  href: string;
  activePrefix: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "ホーム",
    description: "健康経営ポータルのホームです。",
    href: "/",
    activePrefix: "/",
  },
  {
    label: "顧客",
    description: "顧客を一覧・登録します。",
    href: "/customers",
    activePrefix: "/customers",
  },
  {
    label: "組織",
    description: "顧客の所属先になる組織を管理します。",
    href: "/organizations",
    activePrefix: "/organizations",
  },
  {
    label: "テナント",
    description: "所属しているテナントを管理します。",
    href: "/tenants",
    activePrefix: "/tenants",
  },
];

export const FEATURE_NAV_ITEMS = NAV_ITEMS.filter(
  (item) => item.activePrefix !== "/",
);

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return (
    pathname === item.activePrefix ||
    pathname.startsWith(`${item.activePrefix}/`)
  );
}
