const RETURN_TO_KEY = "kenko-keiei.returnTo";

const BLOCKED_SEGMENTS = new Set(["api", "register"]);

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value) return "";
  if (!value.startsWith("/")) return "";
  if (value.startsWith("//")) return "";
  if (value.includes("\\")) return "";
  if (/\s/.test(value)) return "";
  if (BLOCKED_SEGMENTS.has(value.split(/[/?#]/)[1] ?? "")) return "";
  return value;
}

export function currentReturnTo(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function rememberReturnTo(value: string): void {
  const returnTo = sanitizeReturnTo(value);
  try {
    if (returnTo) {
      window.sessionStorage.setItem(RETURN_TO_KEY, returnTo);
    } else {
      window.sessionStorage.removeItem(RETURN_TO_KEY);
    }
  } catch {
    return;
  }
}

export function takeReturnTo(): string {
  try {
    const value = window.sessionStorage.getItem(RETURN_TO_KEY);
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    return sanitizeReturnTo(value);
  } catch {
    return "";
  }
}
