export const TEXT_MAX_LENGTH = 255;

const CONTROL_CHAR_PATTERN = /\p{Cc}/u;

export function isTooLong(value: string): boolean {
  return [...value].length > TEXT_MAX_LENGTH;
}

export function hasControlChar(value: string): boolean {
  return CONTROL_CHAR_PATTERN.test(value);
}
