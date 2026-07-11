export type Role = "owner" | "admin" | "member";

export const ROLES: Role[] = ["owner", "admin", "member"];

export const ASSIGNABLE_ROLES: Role[] = ["admin", "member"];

const ROLE_LABELS: Record<Role, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as Role] ?? role;
}

export function canManageMembers(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function isOwner(role: string | undefined): boolean {
  return role === "owner";
}
