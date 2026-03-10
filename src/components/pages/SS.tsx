import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { boxSelector } from "@/redux/slices/userSlice";
import type { BoxFolder } from "../../@types/BoxUiElements";

type ContentExplorerInstance = {
  show: (folderId: string, token: string, opts: unknown) => void;
  hide?: () => void;
  removeAllListeners?: () => void;
};

export const SS = () => {
  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;

  const devToken = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const paramToken = params.get("devToken")?.trim();
    if (paramToken) return paramToken;
    const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
    return storedToken && storedToken.length > 0 ? storedToken : undefined;
  }, []);

  const rawId =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("folderId");

  const isNumeric = /^\d+$/.test(rawId || "");
  const effectiveFolderId = isNumeric ? rawId! : "0";

  const explorerRef = useRef<ContentExplorerInstance | null>(null);
  const effectiveToken = devToken ?? token;
  const canShowExplorer = Boolean(effectiveToken);

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

    window.location.assign(target);
  }, []);

  const customActions = useMemo(
    () => [
      {
        label: "マウント",
        onAction: (item: BoxFolder) => handleMount(item),
        type: "folder",
      },
    ],
    [handleMount],
  );

  useEffect(() => {
    if (!effectiveToken) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }

    const explorer = explorerRef.current;

    explorer?.removeAllListeners?.();
    explorer?.show(effectiveFolderId, effectiveToken, {
      container: "#box-content-explorer",
      canPreview: false,
      itemActions: customActions,
    });

    return () => {
      explorer?.removeAllListeners?.();
      explorer?.hide?.();
    };
  }, [customActions, effectiveFolderId, effectiveToken]);

  return (
    <Layout hideSideMenu fluid>
      <BoxManager />

      {canShowExplorer ? (
        <section className="rounded-md border bg-background relative">
          <div
            id="box-content-explorer"
            className="min-h-[520px] [&_.be-logo]:hidden [&_.be-logo-container]:hidden [&_.be-header]:pl-3"
          />
        </section>
      ) : (
        <div className="rounded-md border bg-background min-h-[520px] flex items-center justify-center text-sm text-muted-foreground">
          Box に接続中...
        </div>
      )}
    </Layout>
  );
};
