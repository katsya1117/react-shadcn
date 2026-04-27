# useBoxExplorer

Box Content Explorer の **フォルダ移動状態** だけを管理するカスタムフック。

このフックは「現在地・履歴・戻る/進む」を扱う頭脳役で、
**Box SDK 自体の生成・表示・トークン管理はコンポーネント側の責務**。

---

## 設計の前提

`SS.tsx` を例に、責務分担はこうなっている。

```
SS.tsx                           useBoxExplorer
─────────────────────────────────────────────────
Box SDK インスタンス生成     →
SDK の show() 呼び出し（表示） →
navigate イベントの登録      → → handleNavigate を呼ぶ
                                ┌──────────────────────────┐
                                │ ・現在フォルダの記憶      │
                                │ ・履歴の積み上げ          │
                                │ ・戻る/進むの実行         │
                                │ ・ルート以外への復元      │
                                │ ・Redux への永続化         │
                                └──────────────────────────┘
                              ← explorerRef を介して navigateTo を逆呼び出し
```

コンポーネントが SDK を作って `explorerRef` に差し込み、
SDK の `navigate` イベントを `handleNavigate` に流し込めば、
あとは hook 内で履歴の管理・戻る進むの提供をしてくれる。

---

## 使い方

```tsx
const {
  explorerRef,        // SDK インスタンスを差し込む先
  currentFolder,
  isRestoring,
  canGoBack,
  canGoForward,
  handleNavigate,     // SDK の navigate イベントに繋ぐハンドラ
  handleGoBack,       // 戻るボタン
  handleGoForward,    // 進むボタン
} = useBoxExplorer({
  rootFolderId,
  initialFolder,
  savedHistory,
  savedIndex,
  restoreTargetId,    // ルート以外のフォルダから復帰する場合
});

// コンポーネント側で SDK を作って ref に差し込む
useEffect(() => {
  const explorer = new window.Box.ContentExplorer();
  explorerRef.current = explorer;
  setExplorerInstance(explorer);
}, []);

// navigate イベントを hook に流す
useEffect(() => {
  if (!explorerInstance) return;
  explorerInstance.addListener?.('navigate', handleNavigate);
  return () => explorerInstance.removeAllListeners?.();
}, [explorerInstance, handleNavigate]);
```

### 引数

| プロパティ | 型 | 説明 |
|---|---|---|
| `rootFolderId` | `string` | このビューのルートとなる Box フォルダ ID |
| `initialFolder` | `FolderInfo` | 初期表示するフォルダ。Redux から復元 or ルート相当の空オブジェクト |
| `savedHistory` | `string[]` | 復元する履歴配列 |
| `savedIndex` | `number` | 復元する履歴インデックス |
| `restoreTargetId` | `string \| undefined` | ルート以外で離脱していた場合の復元先フォルダID |

### 戻り値

| プロパティ | 型 | 説明 |
|---|---|---|
| `explorerRef` | `MutableRefObject<ContentExplorerInstance>` | コンポーネント側で SDK を差し込む ref |
| `currentFolder` | `FolderInfo` | 現在表示中のフォルダ |
| `folderHistory` | `string[]` | 履歴配列 |
| `historyIndex` | `number` | 履歴の現在位置 |
| `isRestoring` | `boolean` | 深いフォルダへの復元処理中かどうか（スケルトン表示に使う） |
| `canGoBack` | `boolean` | 「戻る」が可能か |
| `canGoForward` | `boolean` | 「進む」が可能か |
| `handleNavigate` | `(item: BoxFolder) => void` | SDK の navigate イベントに繋ぐハンドラ |
| `handleGoBack` | `() => void` | 戻る |
| `handleGoForward` | `() => void` | 進む |

---

## ロジックの全体像

### 1. 履歴の仕組み

ブラウザの戻る/進むと同じスタック構造。

```
履歴:    [root, A, B, C]
index:                ^
```

- 新しいフォルダ `D` へ移動 → index より後ろを切り捨てて `D` を追加
- 「戻る」 → index を `-1` し、SDK で対象フォルダへ navigate
- 「進む」 → index を `+1` し、SDK で対象フォルダへ navigate
- 同じフォルダがすでに履歴にある場合 → 新規追加せずインデックスだけ動かす

パンくずでルートを押すと index が 0 に戻り、それより先に進めなくなる。
ブラウザとは異なる挙動だが、ファイルエクスプローラーのパンくず UX として妥当な動作。

### 2. 深いフォルダへの復元

Box SDK の `show()` に渡せる初期フォルダはルートだけ。
ルートより深い位置に復帰したい場合は以下の流れ：

1. SDK 起動時にルートで初期化
2. `navigate` イベントでルート到達を検知
3. `navigateTo(復元先のID)` を呼んでジャンプ
4. 復元先到達を検知して復元完了

`isRestoring` がこの間 `true` になるため、UI 側でスケルトンを出せる。

### 3. handleNavigate の3パターン

`navigate` イベントがどの経路で発火したかを判別して、それぞれ違う処理をする。

| パターン | フラグ | 処理 |
|---------|-------|------|
| 復元処理中 | `isRestoringRef` | 履歴は触らず、navigateTo で誘導するだけ |
| 戻る/進むボタン経由 | `isNavigatingRef` | 履歴は handleGoBack/Forward で更新済みなのでスキップ |
| ユーザー操作（クリック等） | （フラグなし） | 履歴に積む or インデックスを動かす |

---

## なぜ ref がたくさんあるのか

このフックには `useRef` が5つある。それぞれ理由がある。

「常に最新の値を読みたいが、変化しても再描画は不要」という性質のものは ref で持つ。
state にすると、setState の直後（イベントハンドラ内など）から最新値が読めない。

| ref | 用途 |
|----|------|
| `isNavigatingRef` | 戻る/進むボタン経由かを判定するフラグ。SDK の navigate イベントとの競合を防ぐため即座読みが必要 |
| `isRestoringRef` | 深いフォルダへの復元中かを判定。navigate イベントを複数回経るので state では遅い |
| `restoreTargetIdRef` | 復元先のフォルダID。初期化以後は変わらない値だが、handleNavigate の中で参照する |
| `historyIndexRef` | 履歴の現在位置。`handleGoBack/Forward` で「いまの位置 ±1」を即座に読むのに使う |
| `folderHistoryRef` | 履歴配列の最新値。state の更新がイベント間で遅延するのを ref で補う |

特に `historyIndexRef` と `folderHistoryRef` は **state とペアで持っている**。
これは `canGoBack` の計算など UI 反映に state が必要だが、
イベントハンドラ内では同期的に最新値を読みたいため。

→ この「state と ref を同時に持つ」二重管理を安全に行うのが `syncHistory` ヘルパー。

### syncHistory の役割

```ts
const syncHistory = (nextIndex, nextHistory) => {
  historyIndexRef.current = nextIndex;
  folderHistoryRef.current = nextHistory;
  setHistoryIndex(nextIndex);
  setFolderHistory(nextHistory);
  dispatch(ssActions.setFolderHistory({...}));
};
```

履歴を更新するときは **必ず** `syncHistory` を経由する。
こうすることで「ref と state がずれる」事故を一箇所で防げる。

---

## なぜ「戻る/進む」が ref ベースなのか

`handleGoBack` の中身は単純に見える：

```ts
const handleGoBack = () => {
  if (!canGoBack) return;
  const nextIndex = historyIndexRef.current - 1;
  const folderId = folderHistoryRef.current[nextIndex];
  isNavigatingRef.current = true;
  syncHistory(nextIndex, folderHistoryRef.current);
  explorerRef.current?.navigateTo?.(folderId);
};
```

ここで `historyIndex - 1`（state）ではなく `historyIndexRef.current - 1`（ref）を使うのが大事。

理由：連続でボタンが押されたとき、state の更新は次の描画まで反映されない。
ボタン2回押しのうち2回目の `handleGoBack` が実行された時点で、
`historyIndex` はまだ古い値のまま。ref なら `syncHistory` の中で同期更新済み。

---

## SDK との連携で気をつけること

### イベントリスナーは付け替えに注意

`handleNavigate` は依存値が変わるたびに新しい関数として作り直される。
そのため SDK のリスナー登録/解除は `handleNavigate` の変化に追従させる必要がある。

```tsx
useEffect(() => {
  if (!explorerInstance) return;
  const listener = (item) => handleNavigate(item);
  explorerInstance.removeAllListeners?.();   // 古いリスナーを掃除
  explorerInstance.addListener?.('navigate', listener);
  return () => explorerInstance.removeAllListeners?.();
}, [explorerInstance, handleNavigate]);
```

### navigateTo の直後に navigate イベントが来る

戻る/進むボタンや復元処理で `explorer.navigateTo(id)` を呼ぶと、
SDK はその直後に `navigate` イベントを発火する。

これをユーザー操作と区別するために `isNavigatingRef` / `isRestoringRef` フラグがある。
**フラグを立ててから navigateTo を呼ぶ**順序を必ず守ること。

---

## ありがちな落とし穴

### Q. 戻る/進むボタンを押したら履歴が二重に積まれる

→ `isNavigatingRef` のセット忘れ。`navigateTo` の前に必ず `true` を立てる。

### Q. 連続でボタンを押すと変な位置に飛ぶ

→ `historyIndex`（state）を読んでいる可能性。`historyIndexRef.current` を使う。

### Q. 復元中なのにフォルダが切り替わる

→ `isRestoringRef.current` のチェックが先頭にないか、`return` 漏れ。

### Q. SDK のリスナーが多重登録される

→ `removeAllListeners` を呼ばずに `addListener` だけ呼んでいる。
useEffect で必ず古いものを掃除してから追加する。
