import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { boxSelector } from "@/redux/slices/userSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BoxFolder } from "../../@types/BoxUiElements";
import {
  explorerHistoryActions,
  explorerHistorySelector,
} from "@/redux/slices/explorerHistorySlice";
import type { AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import "./SS.css";

export const SS = () => {
  // const isLogin = useSelector(userSelector.isLoginSelector());
  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;
  const dispatch: AppDispatch = useDispatch();
  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const paramToken = params.get("devToken")?.trim();
    if (paramToken) return paramToken;
    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, []);

  const rawId = new URLSearchParams(location.search).get("folderId");
  const isNumeric = /^\d+$/.test(rawId || "");
  const effectiveFolderId = isNumeric ? rawId! : "0";

  const [selectedItem, setSelectedItem] = useState<BoxFolder | null>(null);
  const backStack = useSelector(explorerHistorySelector.back);
  const forwardStack = useSelector(explorerHistorySelector.forward);
  const canBack = useSelector(explorerHistorySelector.canBack);
  const canForward = useSelector(explorerHistorySelector.canForward);
  const historyNavRef = useRef<"back" | "forward" | null>(null);

  type ContentExplorerInstance = {
    show: (folderId: string, token: string, opts: unknown) => void;
    hide?: () => void;
    addListener?: (
      event: string,
      callback: (folder: BoxFolder) => void,
    ) => void;
    removeListener?: (
      event: string,
      callback: (folder: BoxFolder) => void,
    ) => void;
    removeAllListeners?: () => void;
  };
  const explorerRef = useRef<ContentExplorerInstance>(null);

  const handleSelection = useCallback((item: BoxFolder) => {
    setSelectedItem(item);
  }, []);

  const handleMount = useCallback((item: BoxFolder) => {
    if (item.type !== "folder") return;

    const baseSegments = ["isexplorer:C:", "Users", "xxxx.xxxx", "Box"];
    const entrySegments =
      item.path_collection?.entries
        ?.filter((entry) => entry.id !== "0")
        .map((entry) => entry.name) ?? [];

    const target = encodeURI(
      [...baseSegments, ...entrySegments, item.name].join("\\"),
    );

    // Direct navigation is less likely to be blocked than window.open.
    window.location.assign(target);
  }, []);

  const customActions = useMemo(
    () => [
      {
        label: "マウント",
        onAction: (item: BoxFolder) => handleMount(item),
        type: "folder",
      },
      {
        label: "選択",
        onAction: (item: BoxFolder) => handleSelection(item),
      },
    ],
    [handleMount, handleSelection],
  );

  const effectiveToken = devToken ?? token;
  const handleNavigate = useCallback(
    (folder: BoxFolder | { id?: string } | { item?: { id?: string } }) => {
      // Boxのnavigateイベントは形が一定しないことがあるので、安全にIDを取り出す
      const folderId =
        (folder as BoxFolder)?.id ??
        (folder as { item?: { id?: string } })?.item?.id ??
        (folder as { id?: string })?.id;
      if (!folderId) return;

      if (historyNavRef.current) {
        dispatch(explorerHistoryActions.setCurrent(folderId));
        historyNavRef.current = null;
        return;
      }
      console.log(folder);
      dispatch(explorerHistoryActions.navigate(folderId));
    },
    [dispatch],
  );

  const showOptions = useMemo(
    () => ({
      container: "#box-content-explorer",
      canUpload: true,
      canCreateNewFolder: true,
      canPreview: false,
      itemActions: customActions,
      onNavigate: handleNavigate,
    }),
    [customActions, handleNavigate],
  );

  const handleGoBack = useCallback(() => {
    if (!explorerRef.current || !effectiveToken || backStack.length === 0)
      return;
    const target = backStack[backStack.length - 1];
    historyNavRef.current = "back";
    dispatch(explorerHistoryActions.stepBack());
    explorerRef.current.show(target, effectiveToken, showOptions);
    dispatch(explorerHistoryActions.setCurrent(target));
    setTimeout(() => {
      if (historyNavRef.current === "back") historyNavRef.current = null;
    }, 500);
  }, [backStack, dispatch, effectiveToken, showOptions]);

  const handleGoForward = useCallback(() => {
    if (!explorerRef.current || !effectiveToken || forwardStack.length === 0)
      return;
    const target = forwardStack[forwardStack.length - 1];
    historyNavRef.current = "forward";
    dispatch(explorerHistoryActions.stepForward());
    explorerRef.current.show(target, effectiveToken, showOptions);
    dispatch(explorerHistoryActions.setCurrent(target));
    setTimeout(() => {
      if (historyNavRef.current === "forward") historyNavRef.current = null;
    }, 500);
  }, [dispatch, effectiveToken, forwardStack, showOptions]);

  useEffect(() => {
    if (!effectiveToken) return;
    dispatch(explorerHistoryActions.init(effectiveFolderId));
    const box = window.Box as BoxFolder;
    if (!box) return;

    if (!explorerRef.current) {
      explorerRef.current = new window.Box.ContentExplorer();
    }

    const explorer = explorerRef.current;
    explorer?.removeAllListeners?.();
    explorer?.addListener?.("navigate", handleNavigate);
    explorer?.show(effectiveFolderId, effectiveToken, showOptions);

    return () => explorer?.removeListener?.("navigate", handleNavigate);
  }, [
    customActions,
    dispatch,
    effectiveFolderId,
    effectiveToken,
    handleNavigate,
    showOptions,
  ]);

  useEffect(
    () => () => {
      explorerRef.current?.hide?.();
    },
    [],
  );

  const canShowExplorer = Boolean(effectiveToken);

  return (
    <Layout hideSideMenu fluid>
      <BoxManager />
      {canShowExplorer ? (
        <section className="rounded-md border bg-background relative">
          <div className="absolute right-3 top-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              disabled={!canBack}
            >
              ← 戻る
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoForward}
              disabled={!canForward}
            >
              進む →
            </Button>
          </div>
          <div id="box-content-explorer" className="min-h-[520px]" />
        </section>
      ) : (
        <div className="rounded-md border bg-background min-h-[520px] flex items-center justify-center text-sm text-muted-foreground">
          Box に接続中...
        </div>
      )}

      {selectedItem ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{selectedItem.name ?? "(no name)"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            選択されたフォルダです。
          </CardContent>
        </Card>
      ) : null}
    </Layout>
  );
};
