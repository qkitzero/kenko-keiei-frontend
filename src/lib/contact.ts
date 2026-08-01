import { toHalfWidthDigits } from "@/lib/text";

const PHONE_PATTERN = /^0\d{9,10}$/;

export function normalizePhone(value: string): string {
  return toHalfWidthDigits(value).replace(/[-－\s　]/g, "");
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value));
}
