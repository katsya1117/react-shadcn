/**
 * ローカル開発用の Box アクセストークン。
 *
 * このリポジトリの API 層はモックで、ログイン処理もないため、ローカルでは Box の Content Explorer を
 * そのままでは表示できない（isLogin が true にならず、モックが返すトークンも偽物のため）。
 * 開発時に限り、開発用トークンがあれば、ログイン状態やモックのトークンに関係なく、それで接続する。
 *
 * トークンの渡し方（優先順）:
 * 1. ブラウザの localStorage の `box_dev_token`（ページを再読み込みするだけで差し替えられる）
 * 2. `.env.local` の `VITE_BOX_DEV_TOKEN`（開発サーバーの再起動が必要。`*.local` は gitignore 済み）
 *
 * 開発用トークンは、Box Developer Console のアプリの設定から発行する。有効期間は 60 分。
 * 本番ビルドでは、`configureBoxDevToken({ enabled: false })` のまま（main.tsx が DEV のときのみ有効にする）で、
 * localStorage に古いトークンが残っていても、本物のトークンを上書きしない。
 */

export const BOX_DEV_TOKEN_STORAGE_KEY = "box_dev_token";

let enabled = false;
let envToken: string | undefined;

/**
 * 貼り付けのときにありがちな入力ミスを取り除く。
 * - 前後の空白
 * - 前後の引用符（`"…"`、`'…'`。コンソールの出力やJSONからのコピーで付く）
 * - 先頭の `Bearer `（付けたまま渡すと `Bearer Bearer …` になり、Box に 401 で拒否される）
 */
export const normalizeBoxToken = (
  raw: string | null | undefined,
): string | undefined => {
  if (!raw) return undefined;
  let token = raw.trim();
  token = token.replace(/^(["'`])(.*)\1$/s, "$2").trim();
  token = token.replace(/^Bearer(?:\s+|$)/i, "").trim();
  return token || undefined;
};

/** 起動時（main.tsx）に設定する。enabled は、開発時（import.meta.env.DEV）のみ true にする */
export const configureBoxDevToken = (options: {
  enabled: boolean;
  envToken?: string;
}) => {
  enabled = options.enabled;
  envToken = normalizeBoxToken(options.envToken);
};

/** 有効で、トークンが設定されているときのみ、そのトークンを返す */
export const getBoxDevToken = (): string | undefined => {
  if (!enabled) return undefined;
  const stored =
    typeof localStorage === "undefined"
      ? null
      : localStorage.getItem(BOX_DEV_TOKEN_STORAGE_KEY);
  return normalizeBoxToken(stored) ?? envToken;
};
