export const TEXT_MAX_LENGTH = 255;

const CONTROL_CHAR_PATTERN = /\p{Cc}/u;

export function isTooLong(value: string, max = TEXT_MAX_LENGTH): boolean {
  return [...value].length > max;
}

export function hasControlChar(value: string): boolean {
  return CONTROL_CHAR_PATTERN.test(value);
}

export function hasControlCharExceptBreaks(value: string): boolean {
  for (const char of value) {
    if (char === "\n" || char === "\r" || char === "\t") continue;
    if (CONTROL_CHAR_PATTERN.test(char)) return true;
  }
  return false;
}

export function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
}

export function toHalfWidthNumber(value: string): string {
  return toHalfWidthDigits(value).replace(/[．。]/g, ".");
}
