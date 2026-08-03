export type NavIconName = "home" | "customers" | "organizations" | "tenants";

export type NavItem = {
  label: string;
  description: string;
  href: string;
  activePrefix: string;
  icon: NavIconName;
};

const HOME_NAV_ITEM: NavItem = {
  label: "ホーム",
  description: "健康経営ポータルのホームです。",
  href: "/",
  activePrefix: "/",
  icon: "home",
};

export const FEATURE_NAV_ITEMS: NavItem[] = [
  {
    label: "顧客",
    description: "顧客を一覧・登録します。",
    href: "/customers",
    activePrefix: "/customers",
    icon: "customers",
  },
  {
    label: "組織",
    description: "顧客の所属先になる組織を管理します。",
    href: "/organizations",
    activePrefix: "/organizations",
    icon: "organizations",
  },
  {
    label: "テナント",
    description: "所属しているテナントを管理します。",
    href: "/tenants",
    activePrefix: "/tenants",
    icon: "tenants",
  },
];

export const NAV_ITEMS: NavItem[] = [HOME_NAV_ITEM, ...FEATURE_NAV_ITEMS];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return (
    pathname === item.activePrefix ||
    pathname.startsWith(`${item.activePrefix}/`)
  );
}
