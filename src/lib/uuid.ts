const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function normalizeId(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isSameId(
  left: string | undefined,
  right: string | undefined,
): boolean {
  return normalizeId(left) === normalizeId(right);
}
