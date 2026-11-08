# メモ: ShareArea のカード一覧と、Box 上の見え方のずれ（検討中）

| 項目 | 内容 |
| --- | --- |
| 状態 | **検討中**（方式は暫定。未確認事項あり） |
| 作成日 | 2026-11-09 |
| 対象 | ShareArea 画面のカード一覧（本番では API が返す）、Box UI Elements 用のトークン発行 |
| 関連 | [SS 画面 技術仕様書](./spec-ss-screen.md)、[Box API 呼び出し回数の削減対応 報告書](./report-box-api-call-reduction.md) |

> このリポジトリの API 層はモックで、ShareArea の一覧は `shareAreaConfig.ts` の固定値である。以下の「本番の仕組み」は、担当者から聞いた内容で、リポジトリのコードでは確認できていない。

## 1. 背景と課題

### 1.1 本番の仕組み（聞いた内容）

- Box の `share` フォルダの下に、センターごとのフォルダがある。センターに対応する Box グループが、そのフォルダにコラボレートされている。
- ShareArea 画面は、**DB の所属情報**（センター員か、ゲストか）に応じて、API が返す閲覧可能な領域の一覧を、カードで表示する。
- 所属センターの変更、ゲストの招待のときは、API がその領域へのコラボレートを行う。
- コラボレートは、このアプリの画面（SS）からしか行わない。
- ゲストは**センター単位**で、**社内の Box ユーザー**である。
- 運用では、センターのトップフォルダではなく、**下層のフォルダに絞ってコラボレートしたい**場合がある。その場合は `can_view_path` を有効にして行う。招待された側は、招待されたフォルダの親の階層を辿れる（それ以外のフォルダは見えない）。

### 1.2 課題

センター員でもゲストでもないユーザーが、他センターの下層フォルダに招待されたとき、**Box 上では親の階層を辿れるのに、ShareArea にカードが出ない**（カードの判定が、DB の所属だけだから）。入口がなく、アプリから辿れない。

## 2. 検討した方式

| 方式 | 内容 | 判断 |
| --- | --- | --- |
| A: ユーザー単位の招待数を DB に持つ | 招待のたびに +1 / -1 | **不採用**。直接招待、グループ経由、グループごとの招待が混在し、グループのメンバーの増減だけでアクセス可否が変わる。ユーザー単位の数では追えない |
| A': センター単位で DB に記録 | 「どのグループ・ユーザーが、どのセンターに招待されているか」をセンター単位で持つ。Box への問い合わせなし | 可能性あり。API 呼び出しがゼロ。招待の取り消しの数え方がずれる可能性があり、突き合わせが要る |
| **B: Box 側の見え方を正とする** | そのユーザーとして、`share` 直下の子フォルダを取得し、見えるものをカードに加える | **暫定採用**。グループ・直接招待・継承を Box が解決してくれる。API 呼び出しは、保存で抑える |
| Box のイベント通知 | コラボレートの追加・削除の通知で DB を更新する | **未検証**（通知の対象範囲、数の上限） |

## 3. 方式 B

### 3.1 流れ

```
ブラウザ ──GET /api/share-areas──▶ Express
                                    ├─ ① DB: 所属から、センター員・ゲストの領域（今の処理）
                                    ├─ ② Box: そのユーザーとして share の子フォルダを取得（新規。保存あり）
                                    └─ ③ ①と②を合わせて返す。②にだけある領域は「招待のみ」
```

- ②は**サーバーで実行する**。ブラウザには、Box の呼び出しを任せない（サーバーで保存でき、トークンの権限を広げずに済む）。
- Box の失敗時は、①の結果だけを返す（既存の画面が止まらないように）。

### 3.2 API 呼び出し回数

保存なしだと、ShareArea を開くたびに Box への問い合わせが 1 回増える。想定ユーザー 400 人、月 22 営業日（8,800 利用者日）の上限の見積り。

| 方式 | 1 人が 1 日に Box へ問い合わせる回数 | 月間（400 人） | 上限（100,000）に対する割合 |
| --- | --- | --- | --- |
| 保存なし（1 日 2 回開く） | 2 | 17,600 | 18% |
| 保存なし（1 日 5 回開く） | 5 | 44,000 | 44% |
| 保存なし（1 日 10 回開く） | 10 | 88,000 | **88%** |
| サーバーで 1 時間以上保存 + 変更時に破棄 | 約 1 | **約 9,000** | 9% |

- 変更はすべて自社のサーバーを通るため、**所属変更、コラボレートの追加・削除、ゲストの招待・削除のたびに、該当ユーザー（グループなら全メンバー）の保存を破棄**できる。
- 1 回の取得は、`share` の子を `fields=id,name`、最大 1,000 件で取る 1 回。フォルダが増えても、センターが 1,000 を超えない限り 1 回。
- 現在の ShareArea の一覧 API の月間呼び出し回数（サーバーのアクセスログ）が分かれば、「1 日に何回開くか」の実測値になる。

## 4. トークンの発行（Box UI Elements 用）

### 4.1 確認できた事実

- 認証は **JWT**。
- Box UI Elements のために、**box user id に応じたユーザー自身のトークン**を、`withUserSubject(userId)` で発行して、クライアントに返す実装が、すでにある。
- SDK は、`withUserSubject` を持つもの（`box-typescript-sdk-gen` 系）。
- 発行時に **`downscopeToken` を呼んでいる**（担当者の記憶。コードで要確認）。
- フロントの流れは、`getBoxAccountId(userCd)` → `getBoxAccessToken(accountId)`。フォルダ ID は渡していない。

### 4.2 `withUserSubject` と As-User の違い

As-User ではない。

| | `withUserSubject(userId)` | As-User |
| --- | --- | --- |
| トークンの持ち主 | そのユーザー自身（JWT の `box_sub_type` が `user`） | サービスアカウント |
| ユーザーとして動く方法 | トークン自体が、そのユーザーのもの | リクエストに `As-User` ヘッダー（新しい SDK では `client.withAsUserHeader(userId)`） |
| 必要な権限 | ユーザートークンの発行（Generate User Access Tokens） | ユーザーとして API を呼ぶ（Perform Actions as Users） |

「そのユーザーの権限で API を呼ぶ」結果は同じ。御社は、前者がすでに有効で、As-User の追加承認は不要。

### 4.3 方式 B と、トークン発行の関係

- **B をサーバーで実行する場合**: クライアントに返すトークンの発行コードは、**変えなくてよい**。サーバーが `withUserSubject(boxUserId)` で作った認証から、直接、`share` の一覧を取得する。
- **ブラウザから直接 Box を呼ぶ場合のみ**: 返すトークンが、`share` の一覧を取れる必要がある。`downscopeToken` を使っているため、次の 2 点を確認する。

| 確認点 | 条件 |
| --- | --- |
| 第 2 引数（resource） | 指定なし、または `share` フォルダ。**`share` より狭いフォルダに固定していると、`share` の一覧は取れない** |
| 第 1 引数（スコープの配列） | フォルダの一覧を取れるもの（通常は `base_explorer`。Box のスコープの定義で要確認） |

絞っても、ユーザーの権限を超えることはない（ユーザーの権限と、絞った範囲の重なりだけが使える）。

```ts
const userAuth = jwtAuth.withUserSubject(boxUserId);
const token = await userAuth.downscopeToken(
  ["base_explorer", /* 既存のスコープ */],
  `https://api.box.com/2.0/folders/${SHARE_FOLDER_ID}`,   // resource: share 全体
);
```

## 5. サーバーの実装スケッチ（方式 B）

> 動作確認はしていない。import とメソッド名は、御社の SDK のバージョンに合わせる。`jwtAuth` は、既存の `BoxJwtAuth` のインスタンス。

```ts
// shareFolders.ts ── そのユーザーとして、share 直下で見えるフォルダを取得する
import { BoxClient } from "box-typescript-sdk-gen/lib/client.generated";   // 既存の import に合わせる
import { jwtAuth } from "./boxAuth";

const SHARE_FOLDER_ID = process.env.BOX_SHARE_FOLDER_ID!;
const TTL_MS = 60 * 60 * 1000;

export type VisibleFolder = { id: string; name: string };

// userAuth は使い回す（毎回作ると、毎回トークンを取りに行く）
const authByUser = new Map<string, ReturnType<typeof jwtAuth.withUserSubject>>();
const clientFor = (boxUserId: string) => {
  let auth = authByUser.get(boxUserId);
  if (!auth) {
    auth = jwtAuth.withUserSubject(boxUserId);
    authByUser.set(boxUserId, auth);
  }
  return new BoxClient({ auth });
};

async function fetchVisibleFolders(boxUserId: string): Promise<VisibleFolder[]> {
  const client = clientFor(boxUserId);
  const folders: VisibleFolder[] = [];
  try {
    for (let offset = 0; ; ) {
      const page = await client.folders.getFolderItems(SHARE_FOLDER_ID, {
        queryParams: { fields: ["id", "name"], limit: 1000, offset },
      });
      const entries = page.entries ?? [];
      for (const e of entries) {
        if (e.type === "folder") folders.push({ id: e.id, name: e.name ?? "" });
      }
      offset += entries.length;
      if (entries.length === 0 || offset >= (page.totalCount ?? 0)) break;
    }
  } catch (e: any) {
    const status = e?.responseInfo?.statusCode;
    if (status === 403 || status === 404) return [];   // share が見えないユーザー
    throw e;
  }
  return folders;
}

// ユーザーごとの保存（同時の要求は 1 回にまとめる）
const cache = new Map<string, { value: VisibleFolder[]; expiresAt: number }>();
const inflight = new Map<string, Promise<VisibleFolder[]>>();

export async function getVisibleFolders(userCd: string, boxUserId: string) {
  const hit = cache.get(userCd);
  if (hit && Date.now() < hit.expiresAt) return hit.value;
  const running = inflight.get(userCd);
  if (running) return running;

  const p = fetchVisibleFolders(boxUserId)
    .then((value) => {
      cache.set(userCd, { value, expiresAt: Date.now() + TTL_MS });
      return value;
    })
    .finally(() => inflight.delete(userCd));
  inflight.set(userCd, p);
  return p;
}

export const invalidateVisibleFolders = (userCd: string) => cache.delete(userCd);
```

```ts
// routes/shareAreas.ts
router.get("/share-areas", requireLogin, async (req, res) => {
  const { userCd, boxUserId } = req.session.user!;       // boxUserId は、セッション（サーバー側）から取る
  const fromDb = await db.findAreasByAffiliation(userCd); // 今の処理

  let visible: VisibleFolder[] = [];
  try {
    visible = await getVisibleFolders(userCd, boxUserId);
  } catch (e) {
    logger.warn({ err: e, userCd }, "Box の取得に失敗。DB の結果のみ返す");
  }

  const known = new Set(fromDb.map((a) => a.boxFolderId));
  const centers = await db.findCentersByBoxFolderIds(visible.map((f) => f.id));
  const invited = centers
    .filter((c) => !known.has(c.boxFolderId))
    .map((c) => ({ ...c, kind: "invited" as const }));

  res.json([...fromDb, ...invited]);
});

// 変更時に保存を破棄する（所属変更、コラボレート追加・削除、ゲスト招待・削除の処理の最後に呼ぶ）
export async function afterAccessChanged(target: { type: "user" | "group"; id: string }) {
  if (target.type === "user") return invalidateVisibleFolders(target.id);
  for (const m of await db.findUsersByGroup(target.id)) invalidateVisibleFolders(m.userCd);
}
```

- `boxUserId` は、**クライアントから受け取らない**（受け取ると、他のユーザーになりすませる）。
- 複数のサーバーで動かす場合、`cache` と `authByUser` はサーバーごとに別になる。共有するなら Redis 等が必要。
- 429（レート制限）は、`Retry-After` を見て待つ処理を足す。

## 6. 未確認事項・次の確認

| # | 確認すること | 方法 |
| --- | --- | --- |
| 1 | 既存の `downscopeToken` の引数（スコープの配列と、resource の有無） | 発行コードを見る |
| 2 | **`can_view_path` だけで招待されたユーザーが、`share` の一覧を取得したとき、経路上のフォルダだけが返るか**（404・空・全件のどれか） | 実際のユーザーで試す |
| 3 | `share` の子の一覧に、招待された下層フォルダの「親（センターのトップ）」が出るか | 同上 |
| 4 | グループ経由の招待でも、`can_view_path` が効くか | Box のドキュメントと実機 |
| 5 | JWT のトークン発行の呼び出しが、月間の上限に数えられるか | Box の管理コンソールの使用状況、または Box に問い合わせ |
| 6 | 現在の ShareArea 一覧 API の月間呼び出し回数（1 人が 1 日に開く回数の実測） | サーバーのアクセスログ |
| 7 | SDK のメソッド名・戻り値（`getFolderItems`、`entries`、`totalCount`、`responseInfo.statusCode`） | 使用中のバージョンの型定義 |
| 8 | 複数台構成か（保存の置き場所） | 構成を確認 |
| 9 | A'（センター単位で DB）を採用する場合の、取り消しの数え方と突き合わせの方法 | 方式 B の結果次第で検討 |

## 7. 次にやること

1. 上の 1〜3 を確認し、方式 B（サーバーで実行）が成り立つかを確定する。
2. 成り立てば、サーバーに実装し、保存と破棄の呼び出し箇所（所属変更、コラボレート、ゲスト）を洗い出す。
3. フロントは、`kind: "invited"` のカードの表示（ゲストとの区別、開いたときの動作）を決める。SS 画面は、入口がトップのままで、`can_view_path` により辿れる想定。
