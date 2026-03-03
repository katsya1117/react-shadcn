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

### /ss → `SS`
- 入力: なし（モック）
- 依存: Layout
- 状態: なし

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
