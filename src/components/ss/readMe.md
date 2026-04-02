# Box UI Elements - ブラウザ戻る/進む実装まとめ

## 背景と制約

### なぜ CDN 版を使うのか

- NPM 版 (`box-ui-elements`) の公式サポートは React 18 まで
- プロジェクトは React 19 を使用しているため NPM 版は使えない
- CDN 版 `explorer.js`（React 同梱）はアプリ側の React バージョンに依存しないため問題なし
- CDN バージョンは `23.0.0` に固定しているため、バージョンアップによる破壊的変更のリスクもない

```html
<script src="https://cdn01.boxcdn.net/platform/elements/23.0.0/en-US/explorer.js"></script>
```

---

## 問題の整理

### 当初の課題

Box Content Explorer を埋め込んだページで、ユーザーがフォルダ階層を移動しても URL は変わらないため、**ブラウザの戻る/進むボタンが機能しない**。

押すと Explorer 内の階層移動ではなく、**このページを開く前まで離脱**してしまう。

### 要件

- 戻る/進むボタンを PathBar の左側にアイコンで設置する
- ボタン押下で Explorer 内のフォルダ履歴を移動する
- パンくずは常に `rootFolderId`（このコンポーネントを開いた時のフォルダ）を起点として維持する
- ルートフォルダにいる時は戻るボタンを非活性にする

---

## 技術的な核心：`navigateTo` の発見

### CDN 版の API 調査

公式ドキュメントには記載がないが、ブラウザコンソールで以下を実行して実際のメソッドを確認した。

```js
Object.getOwnPropertyNames(Box.ContentExplorer.prototype);
// 結果: ['constructor', 'navigateTo', 'render']
```

**`navigateTo(folderId)` が存在することが判明。**

このメソッドは `show()` を呼び直さずに内部でフォルダ移動するため、**パンくずを壊さずに特定フォルダへ移動できる**。

### なぜ `show()` を呼び直してはいけないのか

`show(folderId, token, options)` を呼ぶと、渡した `folderId` が**新しいルート**として Explorer が再マウントされる。その結果パンくずがリセットされ、渡したフォルダ単体からのパンくずになってしまう。

よって：

- `show()` → 初回1回だけ、常に `rootFolderId` を渡す
- フォルダ移動 → `navigateTo(folderId)` を使う

---

## 型定義の追加

`navigateTo` は非公式 API のため型定義に存在しない。`ContentExplorerInstance` に手動で追加する。

**`@/components/ss/types.ts`**

```ts
export type ContentExplorerInstance = {
  show: (folderId: string, token: string, opts: unknown) => void;
  hide?: () => void;
  removeAllListeners?: () => void;
  addListener?: (
    event: "navigate",
    callback: (item: BoxFolder) => void,
  ) => void;
  navigateTo?: (folderId: string) => void; // 追加
};
```

---

## useEffect の分離

### 変更前（問題あり）

```tsx
useEffect(() => {
  ...
  explorer.removeAllListeners?.();
  explorer.addListener?.("navigate", handleNavigate);
  explorer.show(rootFolderId, accessToken, { ... });
  ...
}, [accessToken, handleNavigate, rootFolderId]);
```

`handleNavigate` が依存配列に含まれているため、フォルダ移動のたびに `handleNavigate` が再生成され、`show()` が再実行されてしまう。

### 変更後（2つに分離）

```tsx
// show() は初回1回だけ（accessToken と rootFolderId が変わった時のみ再実行）
useEffect(() => {
  if (!accessToken) return;

  const BoxGlobal = window.Box;
  if (!BoxGlobal?.ContentExplorer) return;

  if (!explorerRef.current) {
    explorerRef.current = new BoxGlobal.ContentExplorer();
  }

  const explorer = explorerRef.current;
  if (!explorer) return;

  explorer.show(rootFolderId, accessToken, {
    container: "#box-content-explorer",
    canPreview: false,
    size: "large",
  });

  return () => {
    explorer.removeAllListeners?.();
    explorer.hide?.();
  };
}, [accessToken, rootFolderId]);

// リスナーだけ都度付け替える（show() は呼ばない）
useEffect(() => {
  const explorer = explorerRef.current;
  if (!explorer) return;

  explorer.removeAllListeners?.();
  explorer.addListener?.("navigate", handleNavigate);

  return () => {
    explorer.removeAllListeners?.();
  };
}, [handleNavigate]);
```

---

## フォルダ履歴スタックの設計

### データ構造

```
folderHistory: string[]  // フォルダIDの配列
historyIndex: number     // 現在位置のインデックス
```

例：A → B → C と移動した場合

```
folderHistory = ["A", "B", "C"]
historyIndex  = 2
```

C から戻ると：

```
folderHistory = ["A", "B", "C"]  // 配列は変えない
historyIndex  = 1                 // インデックスだけ戻す
```

B から D に進むと（分岐）：

```
folderHistory = ["A", "B", "D"]  // B 以降を切り捨てて D を追加
historyIndex  = 2
```

### `historyIndexRef` を使う理由

`handleNavigate` の依存配列に `historyIndex`（state）を入れると、インデックスが変わるたびに `handleNavigate` が再生成され、リスナーの付け替えが毎回走る無駄が生じる。

`historyIndex` の値を `ref` にも同期することで、`handleNavigate` 内で最新値を参照しつつ依存配列から外せる。

```tsx
const historyIndexRef = useRef(0);

const updateHistoryIndex = useCallback((next: number) => {
  historyIndexRef.current = next; // ref を同期
  setHistoryIndex(next); // state も更新（再レンダリングのため）
}, []);
```

---

## isNavigatingRef による戻る/進む判定

`navigateTo()` を呼ぶと Explorer 内部で移動が起き、`navigate` イベントが発火する。このイベントは `handleNavigate` で受け取るが、**戻る/進むボタン経由の移動ではスタックを積んではいけない**。

そのため `isNavigatingRef` フラグで区別する。

```tsx
const isNavigatingRef = useRef(false);
```

**戻る/進むボタン押下時：**

```tsx
isNavigatingRef.current = true; // フラグを立てる
explorerRef.current?.navigateTo?.(folderId);
```

**`handleNavigate` 内：**

```tsx
if (isNavigatingRef.current) {
  isNavigatingRef.current = false; // フラグをリセット
  return; // スタックは変えない
}
// 通常のフォルダ移動 → スタックに積む
```

---

## 完成した実装全体

### `handleGoBack` / `handleGoForward`

```tsx
const handleGoBack = useCallback(() => {
  if (!canGoBack) return;
  const nextIndex = historyIndexRef.current - 1;
  const folderId = folderHistory[nextIndex];
  if (!folderId) return;
  isNavigatingRef.current = true;
  updateHistoryIndex(nextIndex);
  explorerRef.current?.navigateTo?.(folderId);
}, [canGoBack, folderHistory, updateHistoryIndex]);

const handleGoForward = useCallback(() => {
  if (!canGoForward) return;
  const nextIndex = historyIndexRef.current + 1;
  const folderId = folderHistory[nextIndex];
  if (!folderId) return;
  isNavigatingRef.current = true;
  updateHistoryIndex(nextIndex);
  explorerRef.current?.navigateTo?.(folderId);
}, [canGoForward, folderHistory, updateHistoryIndex]);
```

### `handleNavigate`

```tsx
const handleNavigate = useCallback(
  (payload: BoxFolder) => {
    const nextFolder = toFolderInfo(payload);
    setCurrentFolder(nextFolder);
    dispatch(ssActions.setCurrentFolder({ rootFolderId, folder: nextFolder }));
    dispatch(
      uiActions.setLastVisited({
        key: UrlPath.ShareArea,
        path: rootFolderPath,
      }),
    );
    resetForm();

    if (isNavigatingRef.current) {
      // 戻る/進む経由 → スタックは変えない
      isNavigatingRef.current = false;
      return;
    }

    // 通常移動 → 現在位置以降を切り捨てて新しいフォルダを追加
    setFolderHistory((prev) => {
      const trimmed = prev.slice(0, historyIndexRef.current + 1);
      return [...trimmed, nextFolder.id];
    });
    updateHistoryIndex(historyIndexRef.current + 1);
  },
  [dispatch, resetForm, rootFolderId, rootFolderPath, updateHistoryIndex],
);
```

---

## 動作フロー

### 通常のフォルダ移動

```
ユーザーがフォルダをクリック
  → Explorer が navigate イベントを発火
  → handleNavigate 呼ばれる
  → isNavigatingRef.current === false なのでスタックに積む
  → folderHistory に nextFolder.id を追加
  → historyIndex を +1
```

### 戻るボタン押下

```
戻るボタンをクリック
  → isNavigatingRef.current = true をセット
  → historyIndex を -1
  → navigateTo(folderId) を呼ぶ
  → Explorer が navigate イベントを発火
  → handleNavigate 呼ばれる
  → isNavigatingRef.current === true なのでスタックは変えない
  → isNavigatingRef.current = false にリセット
```

### 進むボタン押下

戻るボタンと同様、`historyIndex` を +1 して `navigateTo` を呼ぶ。

### ルートフォルダにいる時

```
historyIndex === 0
  → canGoBack === false
  → 戻るボタンが disabled（非活性）
```

---

## PathBar への変更

```tsx
// 追加した props
type PathBarProps = {
  // ...既存
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
};
```

パスバー左側に `ChevronLeft` / `ChevronRight` アイコンのボタンを配置。`disabled` 時は `opacity-30` で非活性を表現。

---

## 注意事項

- `navigateTo` は公式ドキュメント未記載の非公式 API
- CDN バージョンを `23.0.0` に固定している限りリスクはない
- バージョンアップ時は `Object.getOwnPropertyNames(Box.ContentExplorer.prototype)` で存在確認を行うこと
