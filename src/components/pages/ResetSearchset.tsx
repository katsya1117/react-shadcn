import { useDispatch } from "react-redux";
import axios from "axios";
import { fetchMySearchsetIds } from "./searchsetSlice"; // 先ほど作ったスライスからインポート

const AdminUserSettingPage = ({ targetUserCd }: { targetUserCd: string }) => {
  const dispatch: AppDispatch = useDispatch();

  const handleResetToDefault = async () => {
    // 1. ユーザーへの確認（任意）
    if (
      !window.confirm("このユーザーのマイページ設定をデフォルトに戻しますか？")
    ) {
      return;
    }

    try {
      // 2. クリアAPIを直接叩く (Reduxを通さない例外処理)
      //    URLやメソッドは実際の仕様に合わせてください
      await axios.post(`/api/clearMypageSearchset/${targetUserCd}`);

      // 3. 成功したら、Reduxの「マイページIDリスト」を最新状態に更新する
      //    これにより、他の画面（検索画面や設定画面）の表示も自動で「デフォルト」に切り替わります
      dispatch(getMySearchsetIds(targetUserCd));

      alert("デフォルトに戻しました");
    } catch (error) {
      console.error("リセットに失敗しました", error);
      alert("エラーが発生しました");
    }
  };

  return (
    <div className="admin-controls">
      <h3>設定のリセット</h3>
      <button onClick={handleResetToDefault} className="reset-button">
        マイページ設定をデフォルトに戻す
      </button>
    </div>
  );
};
