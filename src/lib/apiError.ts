export async function ensureOk(res: Response, fallback: string) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || fallback);
  }
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "予期しないエラーが発生しました";
}
