const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function isSameId(
  left: string | undefined,
  right: string | undefined,
): boolean {
  return (
    (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase()
  );
}
