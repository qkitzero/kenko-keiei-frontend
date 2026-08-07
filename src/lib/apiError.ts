const SESSION_EXPIRED =
  "サインインの有効期限が切れました。再度サインインしてください。";

const UPSTREAM_MESSAGES: Record<string, string> = {
  unauthenticated: SESSION_EXPIRED,
  "refresh failed": SESSION_EXPIRED,
  "failed to resolve the signed in staff": SESSION_EXPIRED,
  "upstream request failed":
    "サーバーに接続できませんでした。時間をおいて再度お試しください。",
  "measured on cannot be in the future": "測定日に未来の日付は指定できません。",
  "customer in use":
    "測定履歴が登録されているため削除できません。一覧から隠すだけなら無効化を使ってください。",
  "customer not found": "顧客が見つかりません。",
  "measurement not found": "測定が見つかりません。",
  "measurement item not found":
    "測定項目が見つかりません。ページを再読み込みして入力し直してください。",
  "invalid value count":
    "入力した値の数が測定項目の試行回数と合っていません。ページを再読み込みして入力し直してください。",
  "invalid value for value type":
    "測定項目の入力形式に合わない値が含まれています。ページを再読み込みして入力し直してください。",
  "invalid side":
    "左右の指定が測定項目に合っていません。ページを再読み込みして入力し直してください。",
  "duplicate value": "同じ試行・左右の値が重複しています。",
  "duplicate entry": "同じ測定項目が重複しています。",
  "invalid age at measurement":
    "測定日時点の年齢を計算できませんでした。顧客の生年月日を確認してください。",
  "judgment not found": "判定が見つかりません。",
  "invalid advice": "アドバイスに使用できない文字が含まれています。",
};

export function upstreamMessage(message: unknown): string {
  return typeof message === "string" ? (UPSTREAM_MESSAGES[message] ?? "") : "";
}

export async function ensureOk(res: Response, fallback: string) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      upstreamMessage(data.message) || data.error || data.message || fallback,
    );
  }
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "予期しないエラーが発生しました";
}

export function runWithError(
  setError: (message: string) => void,
  fn: () => Promise<void>,
): Promise<void> {
  setError("");
  return fn().catch((err: unknown) => setError(errorMessage(err)));
}
