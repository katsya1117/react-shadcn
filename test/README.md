# テストの書き方ガイド（手順書）

このリポのテストは **Jest + ts-jest（ESM）+ React Testing Library** で動いています。
「まずこれを読めば誰でもテストが書ける」を目指した手順書です。迷ったらこのページに戻ってきてください。

---

## 0. まず覚える3つの鉄則

1. **モックは1か所（`jest.config.ts` の `moduleNameMapper` + `__mocks__/`）に集約する。**
   テストファイルの中で `jest.mock("@/...")` を**書かない**。
   （Node ESM 下では inline `jest.mock` が full-suite 実行で効いたり効かなかったりして事故ります）
2. **テスト対象“本体”は相対パスで import する**（`./PathBar`）。
   `@/...` で import するとモックに差し替わってしまうことがあります。
3. **レンダリングは `setup` / `setupWithStore` を使う。** `render` を直接呼ばない。

---

## 1. 実行コマンド

```bash
yarn test                              # 全テスト
yarn test:watch                        # 監視モード
yarn test:coverage                     # カバレッジ付き
npx jest src/pages/SS.test.tsx         # 1ファイルだけ
npx jest -t "追加ボタン"                # テスト名で絞り込み
```

---

## 2. テストは3パターンしかない

書きたいものがどれかを最初に決めると、ほぼ機械的に書けます。

| パターン | 対象の例 | 使うヘルパー |
|---|---|---|
| A. 純粋関数 | `buildPath()` などのロジック | なし（そのまま呼ぶ） |
| B. props だけのコンポーネント | `PathBar`, `CollaborationPanel` | `setup` |
| C. Redux / Router に依存するページ | `SS`, `UserEdit`, `ShareArea` | `setupWithStore` |

### パターンB テンプレート（props だけ）

`src/components/ss/PathBar.test.tsx` が実例です。

```tsx
import { jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { PathBar } from "./PathBar"; // ← 本体は相対 import

const baseProps = {
  relativePath: "",
  canGoBack: true,
  onGoBack: jest.fn(),
  /* …必要な props を全部デフォルトで用意 */
};

const render = (overrides = {}) => setup(<PathBar {...baseProps} {...overrides} />);

describe("PathBar", () => {
  it("戻るボタンを押すと onGoBack が呼ばれる", async () => {
    const onGoBack = jest.fn();
    const { user } = render({ onGoBack });
    await user.click(screen.getByLabelText("戻る"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });
});
```

ポイント:
- `baseProps` に**全 props のデフォルト**を置き、テストごとに必要な分だけ上書きする。
- `setup` の戻り値から `user`（userEvent）を受け取り、クリック・入力に使う。

### パターンC テンプレート（Redux + Router 付き）

`src/pages/UserEdit.test.tsx` / `src/pages/SS.test.tsx` が実例です。

```tsx
import { jest } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { UserEdit } from "./UserEdit";
import { userSliceReducer } from "@/redux/slices/userSlice";

const makeStore = (userPreload = {}) =>
  setupWithStore(<UserEdit />, {
    reducers: { user: userSliceReducer },        // 対象が読むスライスだけ
    preloadedState: { user: { isLogin: true, ...userPreload } },
  });

describe("UserEdit", () => {
  it("初期表示される", async () => {
    makeStore();
    await waitFor(() =>
      expect(screen.getByTestId("auto-complete-single")).toBeInTheDocument(),
    );
  });
});
```

---

## 3. `setup` と `setupWithStore` の使い分け

どちらも `test/test-utils/` にあります。

- **`setup(ui, options?)`** … `render` + `userEvent` をまとめただけ。戻り値 `{ user, ...RTLクエリ }`。
  → Redux も Router も要らないコンポーネントはこれ。
- **`setupWithStore(ui, { reducers, preloadedState? })`** … 上記に加えて
  - 渡した `reducers` から**本物のストア**を組み立てる（reducer はモックしない）
  - `<Provider>` と `<MemoryRouter>` でラップ
  - `dispatch` を spy 化
  - 戻り値 `{ user, store, dispatchSpy, ...RTLクエリ }`

`reducers` には**テスト対象が `useSelector` で読むスライスだけ**渡せば OK。
`preloadedState` は渡したスライスの一部だけ上書きできます。

---

## 4. モックの考え方 ― すでに用意されているものを使う

UI コンポーネントや外部依存の多くは **すでに共有モックが用意済み**です。
テスト対象がそれらを import していても、**何もしなくても自動でモックに差し替わります**。

主な共有モックと「テストからの触り方」:

| モジュール | テストでの見え方 |
|---|---|
| `@/components/layout/Layout` | `children` をそのまま描画（`data-testid="layout-mock"`） |
| `@/components/ui/select` | ネイティブ `<select data-testid="select">`。`user.selectOptions(el, value)` |
| `@/components/ui/radio-group` | `data-testid="radio-group"` + `<input type=radio>` |
| `@/components/ui/dialog` | `open` のときだけ `children` を描画（`data-testid="dialog"`） |
| `@/components/ui/tooltip` | Provider/Trigger は素通し、`TooltipContent` は非表示 |
| `@/components/ui/sonner` | `toast` は呼び出し記録用。`expect(toast.error).toHaveBeenCalledWith(...)` |
| `@/components/common/Confirm/ConfirmButton` | クリックすると `onHandle` を呼ぶ `<button>` |
| `@/components/common/AutoComplete/AutoCompleteSingle` | `<select data-testid="auto-complete-single">`（option: `""`, `"c1"`） |
| `@/components/common/AutoComplete/AutoCompleteMulti` | `<select data-testid="auto-complete-multi">` |
| `lucide-react` | 各アイコン → `data-testid="<アイコン名のケバブ>"`（`ChevronUp` → `"chevron-up"`） |
| `react-router` | `useNavigate`/`useParams`/`useLocation` 等。後述の global で制御 |
| `@/redux/slices/userSlice` ほか | thunk は `jest.fn()`、selector / reducer は本物 |
| `@/hooks/useBoxExplorer` | `jest.fn()`。テストで `(useBoxExplorer as jest.Mock).mockReturnValue(...)` |

> 完全な一覧は `jest.config.ts` の `moduleNameMapper`、実装は各 `__mocks__/` フォルダを見てください。

### react-router の制御（global 変数）

`react-router` モックはテスト間で共有される global で挙動を変えます。

```ts
(globalThis as any).mockParams = { rootFolderId: "370613768434" }; // useParams() の戻り
const mockNavigate = (globalThis as any).mockNavigate;             // useNavigate() の中身
expect(mockNavigate).toHaveBeenCalledWith("/job/ShareArea/xxx");
```

---

## 5. まだモックが無い依存をモックしたいとき（手順）

「`jest.mock` をテストに書く」のではなく、**共有モックを足します**。

1. 本体の隣に `__mocks__/` を作り、同名ファイルを置く。
   例: `src/components/foo/__mocks__/Foo.tsx`
   ```tsx
   import React from "react";
   /* eslint-disable @typescript-eslint/no-explicit-any */
   export const Foo = (props: any) => <div data-testid="foo" {...props} />;
   export default Foo;
   ```
2. `jest.config.ts` の `moduleNameMapper` に追記する（**`^@/(.*)$` の汎用行より上**に書く）。
   ```ts
   "^@/components/foo/Foo$": "<rootDir>/src/components/foo/__mocks__/Foo.tsx",
   ```
3. これで全テストで `@/components/foo/Foo` が自動的にモックになります。

モックを書くコツ:
- **見た目専用の要素は何も描画しない（`() => null`）。** 余計な DOM を作らない。
  例: `select` モックの `SelectTrigger` / `SelectValue` は `null`。
- **テストで掴みたい要素にだけ `data-testid` を付ける。**
- ハンドラ系 props（`onClick` 等）は、押せる要素に素直に繋ぐ。

---

## 6. よくあるエラーと対処

| 症状 | 原因 / 対処 |
|---|---|
| `In HTML, <div> cannot be a child of <select>` | モックがネイティブ要素の中に別の DOM を入れている。見た目要素は `() => null` にする |
| `... not wrapped in act(...)` | 非同期更新を待っていない。`await waitFor(() => expect(...))` で待つ |
| `The requested module 'react' does not provide an export named 'XxxProps'` | 型を値として import している。`import type { XxxProps } from "react"` に直す |
| `Unable to find element [data-testid=...]` で本体が実体描画されている | 本体を `@/...` で import してモックに化けている。**相対 import** に変える |
| 共有モックと違う testid で見つからない | テスト内に古い inline `jest.mock` が残っていないか確認（消して mapper に任せる） |
| full-suite だけ失敗する／カバレッジが 0% | ESM のモジュールキャッシュ問題。inline `jest.mock` をやめて `moduleNameMapper` に寄せる |

---

## 7. 提出前チェックリスト

- [ ] 本体は**相対 import**（`./Xxx`）になっている
- [ ] テストファイルに inline `jest.mock(...)` を**新規に追加していない**
- [ ] `setup` / `setupWithStore` を使っている
- [ ] `npx jest <そのファイル>` が green、かつ **console.error / warning が出ていない**
- [ ] 非同期は `await waitFor` / `await user.xxx` で待っている

---

## 参考になる実例

| 見たいもの | ファイル |
|---|---|
| props だけのコンポーネント | `src/components/ss/PathBar.test.tsx` |
| 確認ダイアログ・Select 操作 | `src/components/ss/CollaborationPanel.test.tsx` |
| Redux + Router ページ | `src/pages/SS.test.tsx`, `src/pages/UserEdit.test.tsx` |
| Layout モック下のページ | `src/pages/ShareArea.test.tsx` |
| ヘルパー本体 | `test/test-utils/setup.tsx`, `test/test-utils/setupWithStore.tsx` |
