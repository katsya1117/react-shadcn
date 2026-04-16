import { useLayoutEffect } from "react";
import { useLocation } from "react-router";

export const ScrollReset = () => {
  const { pathname } = useLocation();
  // useLayoutEffect: DOM 更新後、ブラウザが描画する前に同期的に実行
  // これにより、ページ遷移時のスクロール位置のちらつきを防ぐ
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
};
