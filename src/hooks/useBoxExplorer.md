# useBoxExplorer

Box Content Explorer SDK をアプリに組み込むためのカスタムフック。

フォルダのナビゲーション履歴・現在位置の記憶・UNCパスの生成といった、
Box SDK 単体では提供されない機能をまとめて管理する。

---

## 何をするフックか

Box の Content Explorer（ファイルブラウザUI）を React アプリ上で動かすとき、
SDK は「表示する」「移動する」程度の機能しか持たない。
このフックはその上に以下の機能を乗せている。

| 機能 | 説明 |
|------|------|
| フォルダ履歴 | 「戻る / 進む」ボタンのための履歴スタック管理 |
| 位置の記憶 | Redux に現在フォルダを保存し、再訪時に同じ場所から再開 |
| 深いフォルダへの復元 | ルート以外のフォルダで離脱した場合、SDK の制約を回避して元の位置へ戻す |
| UNC パス生成 | Box フォルダID の階層から `\share\センター名\サブフォルダ` 形式のパスを組み立てる |
| クリップボードコピー | 現在フォルダのパスをコピー |
| エクスプローラーで開く | UNC パスを `file://` に変換してローカルで開く |

---

## 使い方

```tsx
const {
  accessToken,
  containerId,
  currentFolderName,
  currentFolderPath,
  canGoBack,
  canGoForward,
  handleGoBack,
  handleGoForward,
  handleCopyPath,
  handleOpenBox,
  handleOpenExplorer,
  isRestoringDeepFolder,
  layoutSubtitle,
} = useBoxExplorer({ rootFolderId });

// Box SDK のコンテナ要素に containerId を渡す
<div id={containerId} />
```

### オプション

| プロパティ | 型 | 説明 |
|---|---|---|
| `rootFolderId` | `string` | このビューのルートとなる Box フォルダ ID |
| `onCurrentFolderChange` | `(folder: FolderInfo) => void` | フォルダ移動時に呼ばれるコールバック（省略可） |

### 戻り値

| プロパティ | 型 | 説明 |
|---|---|---|
| `accessToken` | `string \| undefined` | Box API のアクセストークン |
| `containerId` | `string` | SDK をマウントする DOM 要素の id |
| `currentFolder` | `FolderInfo` | 現在表示中のフォルダ情報 |
| `currentFolderName` | `string` | 現在フォルダの表示名 |
| `currentFolderPath` | `string` | 現在フォルダの UNC フルパス（`\share\...`） |
| `currentFolderRelativePath` | `string` | `\share\` を除いた相対パス |
| `canGoBack` | `boolean` | 「戻る」が可能かどうか |
| `canGoForward` | `boolean` | 「進む」が可能かどうか |
| `handleGoBack` | `() => void` | 履歴を1つ前に戻す |
| `handleGoForward` | `() => void` | 履歴を1つ先に進む |
| `handleCopyPath` | `() => Promise<void>` | UNC パスをクリップボードにコピー |
| `handleOpenBox` | `() => void` | Box Web UI でフォルダを開く |
| `handleOpenExplorer` | `() => void` | ローカルのエクスプローラーで開く |
| `isRestoringDeepFolder` | `boolean` | 深いフォルダへの復元が進行中かどうか（ローディング表示に使う） |
| `layoutSubtitle` | `string \| undefined` | ヘッダーに表示するルートフォルダ名 |
| `sourcePathByFolderId` | `Record<string, string>` | パンくずの各フォルダID → UNC パスの対応表 |

---

## なぜ ref が多いのか

このフックには `useRef` が 7 つある。それぞれに理由がある。

### `explorerRef` — Box SDK インスタンス

Box の ContentExplorer は React が管理するオブジェクトではない。
state に入れると再描画のたびに作り直されてしまうため、ref に保持する。

### `onCurrentFolderChangeRef` — 外から渡されるコールバック

呼び出し元が毎描画で新しい関数を渡してくる場合でも、
Explorer の初期化処理を再実行させないためにrefに入れて最新版を追いかける。

### `folderHistoryRef` / `historyIndexRef` — 履歴・インデックスの二重管理

`handleGoBack` / `handleGoForward` は履歴の特定インデックスを直接読む必要がある。
`setFolderHistory(prev => ...)` では解決できないケースがあるため、
state と並行して ref にも同じ値を入れておく。

### `isNavigatingRef` — 「ボタン操作か、ユーザー操作か」の区別フラグ

戻る/進むボタンを押すと SDK の `navigateTo()` を呼び出す。
SDK はその直後に `navigate` イベントを発火するが、
このイベントをユーザーが自分でクリックしたものと混同すると履歴が二重更新される。
ボタン操作中であることを即座に読み書きできるよう ref を使う。

### `isRestoringDeepFolderRef` / `restoreTargetFolderIdRef` — 復元処理の状態フラグ

深いフォルダへの復元は `navigate` イベントを複数回またいで進む。
state だと次のイベントが届いた時点で更新がまだ反映されていないため ref を使う。

### `handleNavigateRef` — SDK イベントリスナーの最新化

SDK には `addListener` を一度だけ登録したい（再登録は SDK の再起動を意味する）。
しかし `handleNavigate` は依存する値が変わるたびに新しい関数として作り直される。
「ref の中の関数を呼ぶだけ」のラッパーをリスナーとして登録し、
ref には常に最新の `handleNavigate` をセットすることで両立させている。

---

## フォルダ履歴の仕組み

ブラウザの「戻る / 進む」と同じスタック構造で管理する。

```
履歴:  [root, A, B, C]
index:              ^
```

- ユーザーが新しいフォルダ Dへ移動 → index より後ろを切り捨てて D を追加
- 「戻る」 → index を -1 し、SDK で対象フォルダへ移動
- 「進む」 → index を +1 し、SDK で対象フォルダへ移動
- 同じフォルダがすでに履歴にある場合 → 新規追加せずインデックスだけ動かす

パンくずでルートを押すとインデックスが 0 に戻り、それより先に進めなくなる。
ブラウザとは異なる挙動だが、ファイルエクスプローラーのパンくずとして妥当な動作として設計している。

---

## 深いフォルダへの復元

Box SDK の制約上、`show()` に渡せる初期フォルダはルートフォルダのみ。
ルートより深い位置に復元したい場合は以下のフローを経る。

1. SDK 起動時はルートフォルダで初期化する
2. `navigate` イベントでルートへの到達を検知
3. `navigateTo(復元先のフォルダID)` で強制移動
4. 復元先への到達を検知して復元完了とする

`isRestoringDeepFolder` がこの間 `true` になるため、UI 側でローディングを出せる。

---

## アクセストークン

通常はサーバーが発行したトークンを Redux 経由で受け取る。

開発時は URL クエリ `?devToken=xxx` または `localStorage.box_dev_token` に
トークンを仕込むと、サーバーなしで動作確認できる。
