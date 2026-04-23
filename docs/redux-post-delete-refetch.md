# POST/DELETE後の再fetch問題：本番環境でデータが古いまま残る原因と対処

## 症状

- localhost では DELETE 後の再 fetch が正常に動作する
- デプロイ後は削除したユーザーが一覧に残り続けることがある

## 原因

**「DELETE の API レスポンスが返った時点」と「DB への書き込みが全サーバーに反映された時点」にズレがある。**

### localhost の場合
- フロントとAPIが同一マシン、DBも1台
- DELETE 完了と同時に反映済み → 再 fetch しても新しいデータが返る

### 本番の場合

| 原因 | 説明 |
|------|------|
| **DB レプリケーション遅延** | 書き込みは Primary DB へ、読み取りは Read Replica へ向いている場合、レプリケーションが追いつく前に再 GET が走る |
| **CDN / リバースプロキシのキャッシュ** | GET レスポンスがキャッシュされており、DELETE 直後でもキャッシュ済みのデータが返る |
| **ロードバランサー配下の複数 API サーバー** | DELETE が当たったサーバーと再 GET が当たったサーバーが別で、インメモリキャッシュがずれている |

### 現在の実装フロー

```
removeUser fulfilled → navigate → useEffect → dispatch(getUserList)
```

`fulfilled = API がレスポンスを返した` であって `DB に確実に反映された` の保証ではない。

---

## 対処法

### 推奨：楽観的更新（Optimistic Update）に切り替える

削除の場合、「サーバーが成功と言ったなら消えているはず」と信頼して Redux state を即更新すれば、再 fetch が不要になり根本解決できる。

**`removeUser.fulfilled` を修正（userSlice.ts）：**

```ts
.addCase(removeUser.fulfilled, (state, action) => {
  state.isLoading = false;
  state.error = initialSliceError;
  if (state.list.data?.items) {
    state.list.data.items = state.list.data.items.filter(
      (item) => item.user_cd !== action.meta.arg  // meta.arg に userCd が入っている
    );
  }
})
```

`action.meta.arg` はthunkに渡した引数（= `userCd`）なので追加の変更なしに参照できる。

**UserManage.tsx の再 fetch も不要になる：**

```ts
// 削除してOK
if (searchCondition) {
  dispatch(getUserList(searchCondition));
}
```

---

### 補足：再 fetch も残したい場合

キャッシュ系が原因なら、GET リクエストに `Cache-Control: no-cache` を付けることで回避できる場合がある。ただしバックエンド・CDN 側の設定次第なので確実ではない。

---

## まとめ

- **削除のように「正解が自明な変更」には楽観的更新が最も堅牢**
- POST による新規作成はサーバーが採番する ID などに依存するため再 fetch の方が適している
- DELETE は「消す」だけなのでローカル更新で完結できる
