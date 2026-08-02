export type NavItem = {
  label: string;
  description: string;
  href: string;
  activePrefix: string;
};

type FeatureNavItem = NavItem & {
  globalNav: boolean;
};

const HOME_NAV_ITEM: NavItem = {
  label: "ホーム",
  description: "健康経営ポータルのホームです。",
  href: "/",
  activePrefix: "/",
};

export const TENANT_NAV_ITEM: FeatureNavItem = {
  label: "テナント",
  description: "所属しているテナントを管理します。",
  href: "/tenants",
  activePrefix: "/tenants",
  globalNav: false,
};

export const FEATURE_NAV_ITEMS: FeatureNavItem[] = [
  {
    label: "顧客",
    description: "顧客を一覧・登録します。",
    href: "/customers",
    activePrefix: "/customers",
    globalNav: true,
  },
  {
    label: "組織",
    description: "顧客の所属先になる組織を管理します。",
    href: "/organizations",
    activePrefix: "/organizations",
    globalNav: true,
  },
  TENANT_NAV_ITEM,
];

export const GLOBAL_NAV_ITEMS: NavItem[] = [
  HOME_NAV_ITEM,
  ...FEATURE_NAV_ITEMS.filter((item) => item.globalNav),
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return (
    pathname === item.activePrefix ||
    pathname.startsWith(`${item.activePrefix}/`)
  );
}
