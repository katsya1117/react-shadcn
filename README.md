# react-shadcn

React + TypeScript + Redux Toolkit + Vite + shadcn/ui の業務向け管理画面プロジェクトです。
「画面/状態/依存」の全体像を素早く把握できるように、構成図とページ別の整理を置いています。

## クイックスタート

```bash
# 依存関係
$ yarn install

# 開発サーバ
$ yarn dev

# テスト
$ yarn test
$ yarn test:coverage
```

## 構成図

```
Browser
  └─ App (src/App.tsx)
      └─ Routes (UrlPath)
          └─ Pages (src/components/pages)
              ├─ Layout (src/components/frame/Layout.tsx)
              │   ├─ Header / TabsBar / SideMenu
              │   └─ children
              ├─ parts (AutoComplete / Pagination / JobSearch など)
              └─ ui (shadcnコンポーネント)

Redux
  └─ store (src/store/index.ts)
      └─ slices (src/redux/slices)
           ├─ user / autoComplete / permission / center / ui
           └─ job (※実装は src/store/jobSlice.ts 側で接続)

API
  └─ src/api (型定義・APIクライアント)
```

## 依存関係図

```
Pages
  ├─ frame (Layout / Header / TabsBar / SideMenu)
  ├─ parts (AutoComplete / Pagination / JobSearch / ...)
  ├─ ui (shadcn)
  └─ Redux hooks
        └─ slices (user / permission / autoComplete / center / ui / job)
              └─ src/api (リクエスト/レスポンス型, APIクライアント)
```

## 主要ディレクトリ

- `src/components/frame`: アプリの枠組み（Header / TabsBar / SideMenu / Layout）
- `src/components/pages`: 画面単位のコンポーネント
- `src/components/parts`: 画面内で使う中粒度パーツ（AutoComplete / Pagination など）
- `src/components/ui`: shadcn/ui のラッパー
- `src/redux/slices`: Redux Toolkit slices
- `src/store`: store 本体（configureStore）と一部 slice
- `src/api`: API 型定義・クライアント
- `test`: Jest の共通セットアップとテストユーティリティ

## 主要ファイル/責務一覧

- `src/App.tsx`: ルーティング定義（UrlPath と対応）
- `src/constant/UrlPath.ts`: 画面の URL 定義
- `src/components/frame/Layout.tsx`: アプリ共通レイアウト枠
- `src/store/index.ts`: Redux store の組み立て
- `src/redux/slices/userSlice.ts`: ユーザー管理の主スライス
- `src/redux/slices/permissionSlice.ts`: 権限データ
- `src/redux/slices/autoCompleteSlice.ts`: AutoComplete データ
- `src/redux/slices/uiSlice.ts`: UI 状態（サイドメニューなど）
- `src/api/index.ts`: API 型定義・エンドポイント
- `test/jest.setup.ts`: Jest 全体の共通モック/初期化

## Layout props の使い分け

`Layout` は `src/components/frame/Layout.tsx` の共通フレームです。  
受け取る props は次の 5 つです。

| prop           | 型        | 省略時      | 効果                                                             |
| -------------- | --------- | ----------- | ---------------------------------------------------------------- |
| `hideSideMenu` | `boolean` | `false`     | 左サイドメニューを描画しません。あわせて本文の左余白も消えます。 |
| `hideHeader`   | `boolean` | `false`     | 上部ヘッダーを描画しません。                                     |
| `hideTabs`     | `boolean` | `false`     | `TabsBar` 自体を描画しません。                                   |
| `fluid`        | `boolean` | `false`     | 本文の最大幅 `912px` 制限を外し、画面幅いっぱいを使います。      |
| `subtitle`     | `string`  | `undefined` | ヘッダータイトルの右に補足テキストを表示します。                 |

`Header` のタイトルは現在の URL から自動判定します。主な判定は次の通りです。

- `/OA/` 配下: `OA連携`
- `/manage/` 配下: `管理`
- `/job/ShareArea` 配下: `センター専用領域`
- それ以外の個別ルート: `MyPage`, `JOB SEARCH`, `LOG SEARCH` など

ヘッダー右上のユーザーメニューは全画面で共通です。  
必要に応じて `subtitle` だけを足します。

### 通常ページの使い方

多くのページは単に `<Layout>` だけを使っています。

```tsx
<Layout>
  {...page content}
</Layout>
```

この場合の挙動は次の通りです。

- サイドメニューを表示する
- ヘッダーを表示する
- `TabsBar` は描画する
- 本文幅は最大 `912px`

補足:

- `TabsBar` は `hideTabs` が `false` でも、URL が `/OA/` または `/manage/` 配下でなければ中身を返しません
- そのため、`<Layout>` だけ書いているページでも、実際にタブが見えるのは OA 連携系と管理系のページだけです

### SS の使い方

`SS` は次のように `Layout` を使っています。

```tsx
<Layout
  hideTabs
  fluid
  subtitle={areaName}
>
  {...page content}
</Layout>
```

この指定にしている理由は次の通りです。

- `hideTabs`
  - SS は OA/管理タブ文脈のページではないため、上部タブを明示的に消しています
  - `TabsBar` 側が空描画になるのを待つのではなく、レイアウト上も不要な要素として外しています
- `fluid`
  - SS は Box Content Explorer と右パネルを横並びで使うため、通常の `912px` 幅では狭すぎます
  - 幅制限を外して、ページ全幅を使えるようにしています
- `subtitle={areaName}`
  - ヘッダー本体は URL から自動で `センター専用領域` になります
  - その右に、ShareArea から渡されたルートフォルダ名を表示します
- ページ左上の見出し
  - 本文側では SS 固有の `共有領域管理` を表示します

### props ごとの判断基準

- `hideSideMenu`
  - ログイン後の通常画面では基本使わない
  - 埋め込み画面や、メニュー文脈を消したい全画面 UI の時だけ使う
- `hideHeader`
  - 同じく特殊画面向け
  - 通常の業務画面では使わない
- `hideTabs`
  - タブ文脈に属さないが、`TabsBar` の描画自体も切りたい時に使う
  - SS はこのケース
- `fluid`
  - テーブル、Explorer、左右 2 カラムなど、横幅を必要とする画面で使う
  - 文章中心やフォーム中心の画面では使わない
- `subtitle`
  - 自動タイトルはそのまま使い、対象名だけ補足したい時に使う
  - SS のように「親カテゴリ / 対象領域」を見せたい画面に向いています

## 状態管理メモ

- Redux store は `src/store/index.ts` が実体です。
- `job` については `src/store/jobSlice.ts` が store に接続され、
  `src/redux/slices/jobSlice.ts` は UI 用のモック selector が残っています。
  本番統合時はここを一本化する想定です。

## 画面別: 入出力 / 依存 / 状態

※「状態」は Redux / ローカル state の要点だけ記載。

### /, /job/MyPage → `MyPage`

- 入力: なし
- 依存: Layout, Card
- 状態: なし（表示のみ）

### /job/JobSearch → `JobSearch`

- 入力: 検索条件（Conditions / SearchSet）
- 依存: Layout, jobSelector, getJobList, userSelector, Conditions, SearchSet
- 状態: Redux（user/login, job/list）、ローカル（条件・mode・open）

### /job/ShareArea → `ShareArea`

- 入力: 共有領域の検索/切替（モック）
- 依存: Layout, UI components
- 状態: ローカル（areas）

### /job/LogSearch → `LogSearch`

- 入力: 期間・ユーザー・差分・ジョブ名
- 依存: Layout, AutoCompleteMulti, UI components
- 状態: ローカル（検索条件, page）

### /job/JobCreate → `JobCreate`

- 入力: なし（モック表示）
- 依存: Layout
- 状態: なし

### /job/Tool → `Tool`

- 入力: なし（モック表示）
- 依存: Layout
- 状態: なし

### /OA/Users → `OAUsers`

- 入力: なし
- 依存: Layout
- 状態: なし

### /OA/Orders → `OAOrders`

- 入力: なし
- 依存: Layout
- 状態: なし

### /manage/User → `UserManage`

- 入力: 表示名/ユーザーID/メール/センター
- 依存: userSlice(getUserList, selectors), AutoCompleteMulti, Pagination, UserTabsShell
- 状態: Redux（user.list, searchCondition, search result）、ローカル（検索入力）

### /manage/User/new → `UserCreate`

- 入力: ADユーザー検索条件 / 登録実行
- 依存: userSlice(getAdUserList, userCreation, selectors), toast, UserTabsShell, Pagination
- 状態: Redux（ad user list/条件）、ローカル（検索入力、表示状態）

### /manage/User/:user_cd → `UserEdit`

- 入力: user_cd (route param), 編集フォーム
- 依存: userSlice, permissionSlice, autoCompleteSlice, SearchSetApi, zod, UserTabsShell
- 状態: Redux（userInfo/permission/autoComplete）、ローカル（フォーム・UI状態）

### /manage/Center → `CenterManage`

- 入力: キーワード検索
- 依存: CenterTabsShell, UI components
- 状態: ローカル（keyword/検索結果）

### /manage/Center/new → `CenterCreate`

- 入力: センター登録フォーム（モック）
- 依存: CenterTabsShell, UI components
- 状態: ローカル（フォーム）

### /manage/Center/:center_cd → `CenterEdit`

- 入力: center_cd (route param)
- 依存: CenterTabsShell, UI components, toast
- 状態: ローカル（メンバー管理・シートUI）

### /manage/Role → `RoleManage`

- 入力: 権限テンプレの選択/編集
- 依存: Layout, UI components
- 状態: ローカル（選択中テンプレ・フォーム）

### /manage/Information → `Information`

- 入力: なし
- 依存: Layout
- 状態: なし

### /manage/System → `System`

- 入力: なし
- 依存: Layout
- 状態: なし

### /manage/UserSetting → `UserSetting`

- 入力: なし
- 依存: Layout
- 状態: なし

### /manage/Batch → `Batch`

- 入力: なし
- 依存: Layout
- 状態: なし

### /user/MyPageEdit → `MyPageEdit`

- 入力: なし（モック）
- 依存: Layout
- 状態: なし

### /user/Profile → `UserProfile`

- 入力: なし（モック）
- 依存: Layout
- 状態: なし

### /job/ShareArea/:folderId/manage → `SS`

- 入力: `folderId`（route param）
- 依存: Layout, Box Content Explorer, BoxManage, AutoComplete, toast
- 状態: ローカル（選択中フォルダ, コラボレータ編集状態, モックコラボ設定）

### /Development → `Development`

- 入力: なし（モック）
- 依存: Layout
- 状態: なし

## 未ルーティング / 作業中

- `ResetSearchset.tsx`: App からは未使用。検索セット関連の実装途中。
- `SearchSet.tsx`（pages 配下）: 単独ページとして未使用。
- `Help.tsx` / `Notifications.tsx` / `OAIntegration.tsx` / `ToolPage.tsx` / `CenterArea.tsx`:
  現在の App ルーティングでは未使用。

---

必要なら、この README を「図 + 依存 + 画面別」だけの軽量版にもできます。

整理しました。今の ss 周りはこう揃えています。

ssSlice.ts (line 39) の mutation thunk は API 1 回だけ にしました。create/delete/update の中で getFolderCollaborations はもう呼びません。
再取得は SS.tsx (line 257) の refreshCollaborations に寄せ、一覧取得も更新後の再取得も dispatch(...).unwrap() を component 側で try/catch しています。更新 API のあとに再取得しているのは、今の reducer が mutation 成功時に byFolderId を直接更新しておらず、ssSlice.ts (line 121) 付近でも表示データは getFolderCollaborations.fulfilled でしか変わらないからです。つまり、今の構成では再取得しないと表示更新は保証されません。

「昨今の標準」で言うと、Redux Toolkit 公式は server-state には RTK Query を推していて、自動再取得は invalidation でやる形です。
ただ、この画面は createAsyncThunk ベースなので、その前提で一番筋が良いのは「thunk は単機能」「component が unwrap と成功後フローを管理」です。今回の整理はその寄せ方です。将来 RTK Query に寄せるなら、この再取得 dispatch 自体を消せます。
公式: https://redux-toolkit.js.org/api/createAsyncThunk#unwrapping-result-actions
公式: https://redux-toolkit.js.org/rtk-query/usage/automated-refetching

補足すると、unwrap() を付けない dispatch(thunk) は、失敗しても Promise 自体は reject されず rejected action を返して resolve します。unwrap() を付けた時だけ、fulfilled は payload を返し、rejected は throw されるので try/catch に入ります。今の ssSlice は rejectWithValue を使っていないので、catch に来るのは主に API 呼び出しが throw した時の error です。

確認は npx eslint src/components/pages/SS.tsx src/redux/slices/ssSlice.ts と npm test -- --runInBand src/components/pages/SS.test.tsx が通っています。
