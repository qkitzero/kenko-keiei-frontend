import { hasControlChar, isTooLong, toHalfWidthDigits } from "@/lib/text";

const PHONE_PATTERN = /^0\d{9,10}$/;

const EMAIL_PATTERN = /^[^\s<>@,;:"()[\]\\]+@[^\s<>@,;:"()[\]\\]+$/;

export function normalizePhone(value: string): string {
  return toHalfWidthDigits(value).replace(/[-－\s　]/g, "");
}

export function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(normalizePhone(value));
}

export function isValidEmail(value: string): boolean {
  return (
    !isTooLong(value) && !hasControlChar(value) && EMAIL_PATTERN.test(value)
  );
}
