# 試作: フォルダ取得キャッシュと更新ボタン（未使用）

| 項目 | 内容 |
| --- | --- |
| 状態 | **未使用。** どこからも import していない。実現可否を探る試作で、実現の Go は出ていない |
| 本番との関係 | 本番環境は、この試作を追加したコミット `319f0c3` の直前の状態（=この試作は入っていない）。本番に反映するときは、ここを含めない |
| 経緯 | Box の月間 API 呼び出し上限（100,000 回）への対策の当たりづけ。背景は [docs/report-box-api-call-reduction.md](../../../docs/report-box-api-call-reduction.md)、設計は [docs/spec-box-folder-cache.md](../../../docs/spec-box-folder-cache.md) |

使っていなくても、型チェックとテスト（`yarn test`）の対象にしている。壊れていないことが、常に確認できる。

## 構成

| ファイル | 内容 |
| --- | --- |
| `boxFolderCache.ts`（+ test） | フォルダ取得（`GET /folders/{id}`）を 5 分間保存する中継処理（axios の interceptor）。本体 |
| `useBoxExplorerWithRefresh.ts`（+ test） | `useFolderNavigation`（本番相当）に、更新（`handleRefresh`）を足した版。**別版としてコピーしている**（更新の結果のイベントは、フックの内部の ref と `handleNavigate` に絡むため） |
| `useExplorerCacheRefresh.ts`（+ test） | `useBoxFolderCacheOptions`（`show()` に渡すキャッシュの中継処理）と、`useRefreshAll`（更新ボタンの処理） |

あわせて、次の場所に、目印 `[PROTO-CACHE-REFRESH]` 付きのコメントアウトがある（`grep -rn PROTO-CACHE-REFRESH src`）。

- `src/hooks/useBoxExplorer.ts`: 1/5、2/5、3/5、4/5（前半）
- `src/pages/SS.tsx`: 1/5、2/5、4/5、5/5（`useBoxExplorer.ts` の分と、対になっている）
- `src/main.tsx`: `configureBoxFolderCache`
- `src/components/ss/PathBar.tsx`: 更新ボタンは、`onRefresh` を渡したときだけ出る（コメントアウトではなく、省略可能な props）

## 有効にする手順

1. `src/hooks/useBoxExplorer.ts` と `src/pages/SS.tsx` の、`[PROTO-CACHE-REFRESH]` 1/5〜5/5 のコメントアウトを外す。
   - 1/5: import を有効にする（`useBoxExplorer.ts` は `useBoxExplorerWithRefresh` と `useBoxFolderCacheOptions`、`SS.tsx` は `useRefreshAll`）。
   - 2/5: `useBoxExplorer.ts` で、`useFolderNavigation(...)` の呼び出しを `useBoxExplorerWithRefresh(...)` に差し替える（引数は同じ）。`handleRefresh` を受け取り、フックの戻り値にも足す。`SS.tsx` でも、`useBoxExplorer` の戻り値から `handleRefresh` を受け取る。元の `useFolderNavigation` の import は、不要になれば消す。
   - 3/5: `useBoxExplorer.ts` の `show()` の options に `...cacheOptions` を足し、依存配列にも `cacheOptions` を足す。
   - 4/5: `useBoxExplorer.ts` に `const cacheOptions = useBoxFolderCacheOptions();` を置く（`show()` の effect より前）。`SS.tsx` には `const handleRefreshAll = useRefreshAll({ handleRefresh, refreshCollaborations });` を、`refreshCollaborations` より後ろに置く。
   - 5/5: `SS.tsx` で、`PathBar` に `onRefresh` を渡す。
2. `src/main.tsx` の `configureBoxFolderCache` のコメントアウトを外す（import も）。
3. フォルダ取得のキャッシュを使うときは、`.env.local` に `VITE_BOX_FOLDER_CACHE=true` を入れて、開発サーバーを再起動する（既定は無効。更新ボタンは、キャッシュが無効でも使える）。
4. テストを直す。`src/pages/SS.test.tsx` は `@/hooks/useFolderNavigation` をモックしている。`useBoxExplorer` の中で差し替えた後は、`@/prototypes/box-cache-refresh/useBoxExplorerWithRefresh` をモックする必要がある（`src/hooks/useBoxExplorer.test.tsx` も同様）。キャッシュと更新の、SS 側のテストは、`git show 319f0c3 -- src/pages/SS.test.tsx` に残っている。

手順 1〜2 の後に `yarn build`（型チェック）が通ることを、確認済み（2026-11-25）。

## 保守

- `useFolderNavigation` を直したら、`useBoxExplorerWithRefresh` にも反映する（コピーのため）。
- 試作を完全に消す場合は、先にタグ（例: `prototype/box-cache-refresh`）を付けてから、このフォルダと、`[PROTO-CACHE-REFRESH]` のコメントアウトを消す。
