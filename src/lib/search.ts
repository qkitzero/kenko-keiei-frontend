const HIRAGANA_PATTERN = /[ぁ-ゖ]/g;

const KATAKANA_OFFSET = 0x60;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(HIRAGANA_PATTERN, (char) =>
      String.fromCharCode(char.charCodeAt(0) + KATAKANA_OFFSET),
    )
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function matchesSearchText(
  values: (string | undefined)[],
  query: string,
): boolean {
  if (!query) return true;
  return values.some(
    (value) => value && normalizeSearchText(value).includes(query),
  );
}
