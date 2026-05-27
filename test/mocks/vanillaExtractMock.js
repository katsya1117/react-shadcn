// Vanilla Extract (.css.ts) ファイルのモック
// Proxy を使って任意のプロパティアクセスに空文字を返す
module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => (typeof prop === "string" ? prop : ""),
  },
);
