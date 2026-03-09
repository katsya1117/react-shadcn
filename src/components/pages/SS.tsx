// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { useSelector } from "react-redux";
// import { Layout } from "@/components/frame/Layout";
// import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
// import { boxSelector } from "@/redux/slices/userSlice";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import type { BoxFolder } from "../../@types/BoxUiElements";
// import "./SS.css";

// type ContentExplorerInstance = {
//   show: (folderId: string, token: string, opts: unknown) => void;
//   hide?: () => void;
//   addListener?: (event: string, callback: (item: BoxFolder) => void) => void;
//   removeAllListeners?: () => void;
// };

// type NavState = {
//   history: string[];
//   index: number;
// };

// export const SS = () => {
//   const token = useSelector(boxSelector.tokenSelector()) as string | undefined;

//   const devToken = useMemo(() => {
//     if (typeof window === "undefined") return undefined;
//     const params = new URLSearchParams(window.location.search);
//     const paramToken = params.get("devToken")?.trim();
//     if (paramToken) return paramToken;
//     const storedToken = window.localStorage.getItem("box_dev_token")?.trim();
//     return storedToken && storedToken.length > 0 ? storedToken : undefined;
//   }, []);
//   const effectiveToken = devToken ?? token;

//   const rawId = new URLSearchParams(location.search).get("folderId");
//   const isNumeric = /^\d+$/.test(rawId || "");
//   const effectiveFolderId = isNumeric ? rawId! : "0";

//   const [selectedItem, setSelectedItem] = useState<BoxFolder | null>(null);
//   const [nav, setNav] = useState<NavState>({
//     history: [effectiveFolderId],
//     index: 0,
//   });

//   const explorerRef = useRef<ContentExplorerInstance | null>(null);
//   const suppressHistoryRef = useRef(false);

//   // const [history, setHistory] = useState<string[]>([effectiveFolderId]);
//   // const [historyIndex, setHistoryIndex] = useState(0);

//   const currentFolderId = nav.history[nav.index];
//   const canGoBack = nav.index > 0;
//   const canGoForward = nav.index < nav.history.length - 1;
//   const canShowExplorer = Boolean(effectiveToken);

//   const handleSelection = useCallback((item: BoxFolder) => {
//     setSelectedItem(item);
//   }, []);

//   const handleMount = useCallback((item: BoxFolder) => {
//     if (item.type !== "folder") return;

//     const baseSegments = ["isexplorer:C:", "Users", "xxxx.xxxx", "Box"];
//     const entrySegments =
//       item.path_collection?.entries
//         ?.filter((entry) => entry.id !== "0")
//         .map((entry) => entry.name) ?? [];

//     const target = encodeURI(
//       [...baseSegments, ...entrySegments, item.name].join("\\"),
//     );

//     window.location.assign(target);
//   }, []);

//   const customActions = useMemo(
//     () => [
//       {
//         label: "マウント",
//         onAction: (item: BoxFolder) => handleMount(item),
//         type: "folder",
//       },
//       {
//         label: "選択",
//         onAction: (item: BoxFolder) => handleSelection(item),
//       },
//     ],
//     [handleMount, handleSelection],
//   );

//   useEffect(() => {
//     if (!effectiveToken) return;
//     const BoxGlobal = window.Box;
//     if (!BoxGlobal?.ContentExplorer) return;

//     if (!explorerRef.current) {
//       explorerRef.current = new BoxGlobal.ContentExplorer();
//     }

//     const explorer = explorerRef.current;

//     const onNavigate = (folder: BoxFolder) => {
//       console.log("navigate", folder.id, folder.name);
//       if (suppressHistoryRef.current) {
//         suppressHistoryRef.current = false;
//         return;
//       }

//       setNav((prev) => {
//         const trimmed = prev.history.slice(0, prev.index + 1);
//         const last = trimmed[trimmed.length - 1];

//         if (last === folder.id) {
//           return prev;
//         }

//         return {
//           history: [...trimmed, folder.id],
//           index: trimmed.length,
//         };
//       });
//     };

//     explorer.removeAllListeners?.();
//     explorer.addListener?.("navigate", onNavigate);

//     return () => {
//       explorer.removeAllListeners?.();
//       explorer.hide?.();
//     };
//   }, [effectiveToken]);

//   useEffect(() => {
//     const explorer = explorerRef.current;
//     if (!explorer || !effectiveToken) return;

//     explorer.show(currentFolderId, effectiveToken, {
//       container: "#box-content-explorer",
//       canPreview: false,
//       itemActions: customActions,
//     });
//   }, [currentFolderId, effectiveToken, customActions]);

//   useEffect(() => {
//     if (!selectedItem?.name) return;
//     document.title = selectedItem.name;
//   }, [selectedItem]);

//   const goBack = () => {
//     if (!canGoBack) return;
//     suppressHistoryRef.current = true;
//     setNav((prev) => ({
//       ...prev,
//       index: prev.index - 1,
//     }));
//   };

//   const goForward = () => {
//     if (!canGoForward) return;
//     suppressHistoryRef.current = true;
//     setNav((prev) => ({
//       ...prev,
//       index: prev.index + 1,
//     }));
//   };

//   console.log(nav);

//   return (
//     <Layout hideSideMenu fluid>
//       <BoxManager />
//       {canShowExplorer ? (
//         <>
//           <div className="mb-3 flex gap-2">
//             <button onClick={goBack} disabled={!canGoBack}>
//               戻る
//             </button>
//             <button onClick={goForward} disabled={!canGoForward}>
//               進む
//             </button>
//           </div>
//           <section className="rounded-md border bg-background relative">
//             <div id="box-content-explorer" className="min-h-[520px]" />
//           </section>
//         </>
//       ) : (
//         <div className="rounded-md border bg-background min-h-[520px] flex items-center justify-center text-sm text-muted-foreground">
//           Box に接続中...
//         </div>
//       )}

//       {selectedItem ? (
//         <Card className="mt-4">
//           <CardHeader>
//             <CardTitle>{selectedItem.name ?? "(no name)"}</CardTitle>
//           </CardHeader>
//           <CardContent className="text-sm text-muted-foreground">
//             選択されたフォルダです。
//           </CardContent>
//         </Card>
//       ) : null}
//     </Layout>
//   );
// };
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Layout } from "@/components/frame/Layout";
import { BoxManager } from "@/components/parts/BoxManager/BoxManager";
import { boxSelector } from "@/redux/slices/userSlice";
import { Button } from "@/components/ui/button";
import type { BoxFolder } from "../../@types/BoxUiElements";
import "./SS.css";

type ContentExplorerInstance = {
  show: (folderId: string, token: string, opts: unknown) => void;
  hide?: () => void;
  removeAllListeners?: () => void;
};

type NavState = {
  history: string[];
  index: number;
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

  const effectiveToken = devToken ?? token;

  const rawId =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("folderId");

  const isNumeric = /^\d+$/.test(rawId || "");
  const effectiveFolderId = isNumeric ? rawId! : "0";

  const explorerRef = useRef<ContentExplorerInstance | null>(null);

  const [nav, setNav] = useState<NavState>({
    history: [effectiveFolderId],
    index: 0,
  });

  const currentFolderId = nav.history[nav.index];
  const canGoBack = nav.index > 0;
  const canGoForward = nav.index < nav.history.length - 1;
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

  const handleOpenFolder = useCallback((item: BoxFolder) => {
    if (item.type !== "folder") return;

    setNav((prev) => {
      const trimmed = prev.history.slice(0, prev.index + 1);
      const last = trimmed[trimmed.length - 1];

      if (last === item.id) return prev;

      return {
        history: [...trimmed, item.id],
        index: trimmed.length,
      };
    });
  }, []);

  const customActions = useMemo(
    () => [
      {
        label: "開く",
        onAction: (item: BoxFolder) => handleOpenFolder(item),
        type: "folder",
      },
      {
        label: "マウント",
        onAction: (item: BoxFolder) => handleMount(item),
        type: "folder",
      },
    ],
    [handleMount, handleOpenFolder],
  );

  useEffect(() => {
    if (!effectiveToken) return;
    const BoxGlobal = window.Box;
    if (!BoxGlobal?.ContentExplorer) return;

    if (!explorerRef.current) {
      explorerRef.current = new BoxGlobal.ContentExplorer();
    }

    return () => {
      explorerRef.current?.removeAllListeners?.();
      explorerRef.current?.hide?.();
    };
  }, [effectiveToken]);

  useEffect(() => {
    const explorer = explorerRef.current;
    if (!explorer || !effectiveToken) return;

    explorer.show(currentFolderId, effectiveToken, {
      container: "#box-content-explorer",
      canPreview: false,
      itemActions: customActions,
    });
  }, [currentFolderId, effectiveToken, customActions]);

  const goBack = () => {
    if (!canGoBack) return;
    setNav((prev) => ({
      ...prev,
      index: prev.index - 1,
    }));
  };

  const goForward = () => {
    if (!canGoForward) return;
    setNav((prev) => ({
      ...prev,
      index: prev.index + 1,
    }));
  };

  return (
    <Layout hideSideMenu fluid>
      <BoxManager />

      {canShowExplorer ? (
        <>
          <div className="mb-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={!canGoBack}
            >
              戻る
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={goForward}
              disabled={!canGoForward}
            >
              進む
            </Button>
          </div>

          <section className="rounded-md border bg-background relative">
            <div id="box-content-explorer" className="min-h-[520px]" />
          </section>
        </>
      ) : (
        <div className="rounded-md border bg-background min-h-[520px] flex items-center justify-center text-sm text-muted-foreground">
          Box に接続中...
        </div>
      )}
    </Layout>
  );
};
