export const PRINT_FILE_NAME_MAX_LENGTH = 120;

const RESERVED_CHAR_PATTERN = /[\\/:*?"<>|]/g;
const CONTROL_CHAR_PATTERN = /\p{Cc}/gu;
const EDGE_PATTERN = /^[.\s_]+|[.\s_]+$/g;

function segment(value: string): string {
  return value
    .replace(CONTROL_CHAR_PATTERN, "")
    .replace(RESERVED_CHAR_PATTERN, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(EDGE_PATTERN, "");
}

function truncate(value: string, max: number): string {
  return [...value].slice(0, max).join("").replace(EDGE_PATTERN, "");
}

export function printFileName(parts: string[]): string {
  const cleaned = parts.map(segment).filter(Boolean);
  if (cleaned.length === 0) return "";

  const lengths = cleaned.map((part) => [...part].length);
  let total = lengths.reduce((sum, length) => sum + length, 0);
  total += cleaned.length - 1;

  while (total > PRINT_FILE_NAME_MAX_LENGTH) {
    const longest = lengths.indexOf(Math.max(...lengths));
    if (lengths[longest] <= 1) break;
    lengths[longest] -= 1;
    total -= 1;
  }

  return cleaned
    .map((part, index) => truncate(part, lengths[index]))
    .filter(Boolean)
    .join("_");
}
