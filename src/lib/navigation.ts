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
    label: "顧客登録",
    description: "新しい顧客を登録します。",
    href: "/customers/register",
    activePrefix: "/customers",
  },
  {
    label: "組織",
    description: "所属している組織を管理します。",
    href: "/groups",
    activePrefix: "/groups",
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
