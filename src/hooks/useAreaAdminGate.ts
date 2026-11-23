import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useAppDispatch } from "@/redux/hooks";
import { getMyCenterAreas } from "@/redux/slices/sharedAreaSlice";
import { userSelector } from "@/redux/slices/userSlice";

export type AreaGateStatus = "checking" | "allowed" | "denied";

type Result = { rootFolderId: string; status: "allowed" | "denied" };

/**
 * SS 画面に入れるか（ログインユーザーが、その領域の管理者か）を、画面に入るたびにサーバーへ確認する。
 *
 * - 結果は、このフックの state だけで持つ。Redux に残った前回の値は使わない（権限が変わっている可能性があるため）。
 * - 確認が終わるまでは "checking" を返す。呼び出し側は、"allowed" になるまで SSContent を描画しないこと
 *   （描画してから再判定すると、SSContent が作られてすぐ破棄される）。
 * - 取得に失敗したときは "denied"（確認できないときは入れない）。
 * - rootFolderId が変わったときは、前の結果を使わず、"checking" に戻る。
 */
export const useAreaAdminGate = (
  rootFolderId: string | undefined,
): AreaGateStatus => {
  const dispatch = useAppDispatch();
  const userCd = useSelector(userSelector.loginUserCdSelector());
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!rootFolderId) return;
    let cancelled = false;
    dispatch(getMyCenterAreas(userCd ?? ""))
      .unwrap()
      .then((areas) => {
        const isAdmin = areas.some(
          (area) => area.boxFolderId === rootFolderId && area.isAdmin === true,
        );
        if (!cancelled) {
          setResult({ rootFolderId, status: isAdmin ? "allowed" : "denied" });
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ rootFolderId, status: "denied" });
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, rootFolderId, userCd]);

  if (!rootFolderId || result?.rootFolderId !== rootFolderId) return "checking";
  return result.status;
};
