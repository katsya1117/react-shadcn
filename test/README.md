# テストの書き方ガイド（手順書）

このリポのテストは **Jest（CommonJS 実行）+ ts-jest + React Testing Library** で動いています。
「まずこれを読めば誰でもテストが書ける」を目指した手順書です。迷ったらこのページに戻ってきてください。

---

## 0. まず覚える3つの鉄則

1. **モックしたい依存は、各テストの先頭で `jest.mock("@/…")` で明示する。**
   そのファイルが何をモックしているか、冒頭を見れば分かる状態にする。
2. **何度も使うモックの“中身”は `src/**/__mocks__/<同名>.tsx` に置き、`jest.mock("@/…")`（factory 無し）で呼ぶ。**
   そのテスト固有・1回しか使わないスタブは、`jest.mock("@/…", () => ({ … }))` と**その場に書く**。
3. **レンダリングは `setup` / `setupWithStore` を使う。** `render` を直接呼ばない。

> 補足: `react-router` / `lucide-react` / CSS・画像 などのインフラだけは `jest.config.ts` の
> `moduleNameMapper` で全テスト共通に固定しています（各テストに書く必要はありません）。

---

## 1. 実行コマンド

```bash
npm run test                           # 全テスト
npm run test:watch                     # 監視モード
npm run test:coverage                  # カバレッジ付き
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

### パターンA テンプレート（純粋関数）

`src/pages/ssHelpers.test.ts` / `src/pages/userEditSchema.test.ts` が実例です。

```ts
import { buildPath } from "./ssHelpers";

describe("buildPath", () => {
  test("id が '0' のとき ROOT のみを返す", () => {
    const folder = { id: "0", name: "All Files", pathCollection: { entries: [] } };
    expect(buildPath(folder)).toEqual({ fullPath: "\\share\\", relativePath: "" });
  });
});
```

ポイント:
- **モック不要**。`jest.mock` は一切書かない。
- `describe` + `test` で入力と期待値をそのまま書くだけ。
- 複数の入力パターン（境界値・null・空文字）を `test` を並べて網羅する。

---

### パターンB テンプレート（props だけ）

`src/components/ss/PathBar.test.tsx` が実例です。

```tsx
import { jest } from "@jest/globals";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { PathBar } from "./PathBar";

// PathBar が内部で使う UI 依存だけモックする（共有モックを1行で有効化）
jest.mock("@/components/ui/tooltip");

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
- **テスト対象（PathBar）自身は mock しない**。それが内部で使う依存（tooltip 等）だけ mock する。
- `baseProps` に**全 props のデフォルト**を置き、テストごとに必要な分だけ上書きする。

### パターンC テンプレート（Redux + Router 付き）

`src/pages/UserEdit.test.tsx` / `src/pages/SS.test.tsx` が実例です。

```tsx
import { jest } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import { setupWithStore } from "@test-utils";
import { UserEdit } from "./UserEdit";
import { userSliceReducer } from "@/redux/slices/userSlice";

// このテストでモックする依存（実体は src/**/__mocks__）
jest.mock("@/components/ui/select");
jest.mock("@/components/ui/sonner");
jest.mock("@/redux/slices/userSlice");

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

## 4. すでに用意済みの共有モック（`jest.mock("@/…")` で有効化）

下記は `src/**/__mocks__/` に実体があります。使いたいテストで `jest.mock("そのパス")` を**1行**書けば有効になります。

| `jest.mock(...)` するパス | テストでの見え方 |
|---|---|
| `@/components/layout/Layout` | `children` をそのまま描画（`data-testid="layout-mock"`） |
| `@/components/ui/select` | ネイティブ `<select data-testid="select">`。`user.selectOptions(el, value)` |
| `@/components/ui/radio-group` | `data-testid="radio-group"` + `<input type=radio>` |
| `@/components/ui/dialog` | `open` のときだけ `children` を描画（`data-testid="dialog"`） |
| `@/components/ui/tooltip` | Provider/Trigger は素通し、`TooltipContent` は非表示 |
| `@/components/ui/tabs` / `@/components/ui/dropdown-menu` | ラッパは素通しの簡易版 |
| `@/components/ui/sonner` | `toast` は呼び出し記録用。`expect(toast.error).toHaveBeenCalledWith(...)` |
| `@/components/common/Confirm/ConfirmButton` | クリックで `onHandle` を呼ぶ `<button>` |
| `@/components/common/Pagination/Pagination` / `@/components/common/LoadingOverlay` | 簡易スタブ |
| `@/components/common/AutoComplete/AutoCompleteSingle` | `<select data-testid="auto-complete-single">`（option: `""`, `"c1"`） |
| `@/components/common/AutoComplete/AutoCompleteMulti` | `<select data-testid="auto-complete-multi">` |
| `@/redux/slices/userSlice` / `@/redux/slices/permissionSlice` | thunk は `jest.fn()`、selector / reducer は本物（`jest.requireActual`） |

`jest.config.ts` の `moduleNameMapper` で**常時固定**されているインフラ（書かなくてよい）:

| 固定モック | テストでの見え方 |
|---|---|
| `react-router` | `useNavigate`/`useParams`/`useLocation` 等。下記の global で制御 |
| `lucide-react` | 各アイコン → `data-testid="<アイコン名のケバブ>"`（`ChevronUp` → `"chevron-up"`） |
| CSS / `.css.ts` / 画像 | 空スタブ |

### react-router の制御（global 変数）

```ts
(globalThis as any).mockParams = { rootFolderId: "370613768434" }; // useParams() の戻り
const mockNavigate = (globalThis as any).mockNavigate;             // useNavigate() の中身
expect(mockNavigate).toHaveBeenCalledWith("/job/ShareArea/xxx");
```

---

## 5. まだモックが無い依存をモックしたいとき

### (a) そのテストだけで使う → その場に factory を書く

```tsx
jest.mock("@/components/common/BoxManager/BoxManager", () => ({
  BoxManager: () => <div data-testid="box-manager" />,
}));
```

### (b) 複数テストで使い回す → `__mocks__/` に置いて1行で呼ぶ

1. 本体の隣に同名ファイルを作る。例: `src/components/foo/__mocks__/Foo.tsx`
   ```tsx
   import React from "react";
   /* eslint-disable @typescript-eslint/no-explicit-any */
   export const Foo = (props: any) => <div data-testid="foo" {...props} />;
   export default Foo;
   ```
2. 使うテストで有効化:
   ```ts
   jest.mock("@/components/foo/Foo");   // factory 無し → 隣の __mocks__/Foo.tsx を使う
   ```

モックを書くコツ:
- **見た目専用の要素は何も描画しない（`() => null`）。** 余計な DOM を作らない（例: `select` の `SelectTrigger`/`SelectValue`）。
- **テストで掴みたい要素にだけ `data-testid` を付ける。**
- **実体を一部だけ流用する manual mock は `jest.requireActual` を使う**（`from "../foo"` の再 export は自分自身に解決して無限ループになる。`__mocks__/userSlice.ts` 参照）。

---

## 6. よくあるエラーと対処

| 症状 | 原因 / 対処 |
|---|---|
| `In HTML, <div> cannot be a child of <select>` | モックがネイティブ要素の中に別の DOM を入れている。見た目要素は `() => null` にする |
| `... not wrapped in act(...)` | 非同期更新を待っていない。`await waitFor(() => expect(...))` で待つ |
| `The requested module 'react' does not provide an export named 'XxxProps'` | 型を値として import している。`import type { XxxProps } from "react"` に直す |
| `Maximum call stack size exceeded`（`__mocks__` 読み込み時） | manual mock が `from "../foo"` で自分を再 import している。`jest.requireActual("../foo")` に変える |
| `Unable to find element [data-testid=...]` | その依存を `jest.mock` し忘れている、または testid 違い。冒頭の `jest.mock` 行を確認 |
| モックが効かない/実体が描画される | 対象の `jest.mock("@/…")` を書いたか確認（CJS では書かないと実体が使われる） |

---

## 7. 非同期テストの読み方・書き方（Promise が出てきたら）

「Promise が絡むと途端に分からなくなる」を解消するための節です。
**このリポの非同期テストは、必ず「① 準備 → ② 操作 → ③ 待つ」の3層に分解できます。**

### なぜ `await` が要るのか（核心）

ボタンを押した**直後**には、まだ `toast` も画面更新も起きていません。

```
クリック → ハンドラ実行 → await dispatch(...) → Promise解決 → catch/then → toast / 再描画
         └─ ここまで同期 ─┘            └─ ここから先は「次の tick 以降（＝未来）」に起きる ─┘
```

`toast.error` や DOM 更新は **Promise が解決した後（未来）** に起きます。
だから押した直後に `expect` すると必ず失敗する。
`await waitFor(...)` は「**まだなら少し待って再チェック**」を繰り返して、この未来を待つ道具です。

### 3層分解の実例（`UserEdit.test.tsx` の「API 失敗」テスト）

```tsx
it("API が Error をスローすると そのメッセージを toast.error に渡す", async () => {
  // ① 準備: API を「失敗する Promise」に差し替える（本物の API は呼ばない）
  const spy = jest.spyOn(SearchSetApi.prototype, "clearSearchSet")
    .mockRejectedValueOnce(new Error("APIタイムアウト"));

  const { user } = makeStore();

  // ② 操作: ボタンを押す。await は「クリックによる再描画が一通り終わるまで」待つ
  await user.click(screen.getByText("リセット"));

  // ③ 待つ: 中の expect が通るまでリトライしながら待つ
  //    （失敗 Promise 解決 → catch → toast.error が呼ばれる、までのタイムラグを吸収）
  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith(
      "検索条件のリセットに失敗しました",
      expect.objectContaining({ description: "APIタイムアウト" }),
    );
  });

  spy.mockRestore(); // 差し替えた API を元に戻す（後片付け）
});
```

### このリポに出てくる非同期は4つだけ

| 書き方 | 何を待つ / している | 層 |
|---|---|---|
| `await user.click(...)` / `await user.type(...)` | 操作による**再描画の完了**を待つ。クリック・入力系は全部これ | ② |
| `await waitFor(() => expect(...))` | **expect が通るまで**リトライしながら待つ（非同期結果の検証） | ③ |
| `.mockResolvedValueOnce(x)` / `.mockRejectedValueOnce(e)` | API/thunk を**成功/失敗する Promise に偽装**する（本物は呼ばれない） | ① |
| `await act(async () => { cb() })` | 手動でコールバック（ResizeObserver 等）を発火させ**再描画を待つ** | ② |

> `mockResolvedValueOnce` / `mockRejectedValueOnce` の **`Once`** は「**次の1回だけ**」その値を返す意味。
> 2回目以降は元の挙動に戻る。連続で別の結果を試したいときに `.mockResolvedValueOnce(...).mockRejectedValueOnce(...)` と繋げる。

### 読むときのコツ

- `await` を見たら **「② 操作の完了待ち」か「③ 結果待ち」のどっちか** と判断する。
- `mockResolved/Rejected` を見たら **「① 準備。本物の API は呼ばれていない」** と読む。
- **この3分類だけで、このリポの非同期テストは全部読めます。**

### やりがちな失敗

| やりがち | どうなる | 正しくは |
|---|---|---|
| `user.click(...)` の `await` を付け忘れる | `act(...) warning`、たまに flaky | 操作系は必ず `await` |
| `waitFor` を使わず直後に `expect` | まだ Promise 未解決で**必ず失敗** | `await waitFor(() => expect(...))` で待つ |
| `waitFor` の中で `expect` を呼ばない | 何も待たずすぐ通ってしまう（無意味） | `waitFor` の中身は**必ず expect** |
| `mockResolvedValue`（Once 無し）で毎回同じ値 | 別テストに値が漏れて干渉 | 1回限りなら `...Once`、毎回なら `beforeEach` で設定 |

> 補足: `await expect(fn()).resolves/.rejects.toThrow()` という書き方も Jest にはありますが、
> **このリポでは使っていません**（UI 経由で結果を検証する `waitFor` 方式に統一）。
> 純粋関数（`ssHelpers` など）は同期なので `await` 自体が不要です。

---

## 8. 提出前チェックリスト

- [ ] テスト対象が内部で使う依存を、冒頭の `jest.mock("@/…")` で明示している
- [ ] 使い回すものは `__mocks__`＋1行、固有のものはその場 factory、で書き分けている
- [ ] `setup` / `setupWithStore` を使っている
- [ ] `npx jest <そのファイル>` が green、かつ **console.error / warning が出ていない**
- [ ] 非同期は `await waitFor` / `await user.xxx` で待っている

---

## 参考になる実例

| 見たいもの | ファイル |
|---|---|
| **純粋関数のテスト（モック不要）** | `src/pages/ssHelpers.test.ts` |
| **zod スキーマ・定数のテスト** | `src/pages/userEditSchema.test.ts` |
| props だけ + 共有モック1行 | `src/components/ss/PathBar.test.tsx` |
| props だけ + ConfirmButton の2段階確認フロー | `src/components/ss/CollaboratorRow.test.tsx` |
| 共有モック複数 + 実体 ConfirmButton + ダイアログ | `src/components/ss/CollaborationPanel.test.tsx` |
| 共有モック + その場 factory（子コンポーネント） | `src/pages/SS.test.tsx` |
| Redux + Router ページ | `src/pages/UserEdit.test.tsx` |
| `__mocks__` の書き方（requireActual 含む） | `src/redux/slices/__mocks__/userSlice.ts`, `src/components/ui/__mocks__/select.tsx` |
| ヘルパー本体 | `test/test-utils/setup.tsx`, `test/test-utils/setupWithStore.tsx` |
