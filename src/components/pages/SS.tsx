import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/frame/Layout";
import { BoxManage } from "@/components/parts/BoxManage/BoxManage";
import type {
  BoxElementEvent,
  BoxElementInstance,
  BoxElementItem,
  BoxGlobal,
} from "@/types/box-ui-elements";

type BoxOverlayState = "loading" | "token" | "select" | "ready";

type BoxExplorerViewProps = {
  explorerTargetId?: string;
  token?: string;
};

const resolveOverlayMessage = (state: BoxOverlayState) => {
  switch (state) {
    case "loading":
      return "Box UI Elements を読み込み中...";
    case "token":
      return "Box に接続中...";
    case "select":
      return "ファイルを選択してください";
    default:
      return "";
  }
};

const BoxExplorerView = ({ explorerTargetId, token }: BoxExplorerViewProps) => {
  const explorerRootId = useMemo(() => {
    const trimmed = explorerTargetId?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : "0";
  }, [explorerTargetId]);

  const [selectedFileId, setSelectedFileId] = useState(() => {
    const trimmed = explorerTargetId?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : "";
  });
  const [boxReady, setBoxReady] = useState(false);

  const explorerRef = useRef<BoxElementInstance | null>(null);
  const pickerRef = useRef<BoxElementInstance | null>(null);
  const previewRef = useRef<BoxElementInstance | null>(null);
  const sidebarRef = useRef<BoxElementInstance | null>(null);
  const previewShownRef = useRef(false);
  const sidebarShownRef = useRef(false);
  const explorerContainerRef = useRef<HTMLDivElement | null>(null);
  const pickerContainerRef = useRef<HTMLDivElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const sidebarContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.Box) {
      setBoxReady(true);
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (window.Box) {
        setBoxReady(true);
        window.clearInterval(timer);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, []);

  const handleBoxSelect = useCallback(
    (event: BoxElementEvent | BoxElementItem[]) => {
      const items = Array.isArray(event) ? event : event.items ?? [];
      const firstFile = items.find(
        (item) => item && item.type === "file" && item.id !== undefined,
      );
      if (!firstFile?.id) return;
      setSelectedFileId(String(firstFile.id));
    },
    [],
  );

  useEffect(() => {
    if (!boxReady || !token) return;
    const box = window.Box as BoxGlobal | undefined;
    if (!box) return;
    if (!explorerContainerRef.current) return;

    if (!explorerRef.current) {
      explorerRef.current = new box.ContentExplorer();
      explorerRef.current.addListener("select", handleBoxSelect);
    }

    explorerRef.current.show(explorerRootId, token, {
      container: explorerContainerRef.current,
      canUpload: false,
    });
  }, [boxReady, explorerRootId, handleBoxSelect, token]);

  useEffect(() => {
    if (!boxReady || !token) return;
    const box = window.Box as BoxGlobal | undefined;
    if (!box) return;
    if (!pickerContainerRef.current) return;

    if (!pickerRef.current) {
      pickerRef.current = new box.FilePicker();
      pickerRef.current.addListener("choose", handleBoxSelect);
    }

    pickerRef.current.show(explorerRootId, token, {
      container: pickerContainerRef.current,
      canUpload: false,
      maxSelectable: 1,
    });
  }, [boxReady, explorerRootId, handleBoxSelect, token]);

  useEffect(() => {
    if (!boxReady) return;
    const box = window.Box as BoxGlobal | undefined;
    if (!box) return;
    if (!previewContainerRef.current) return;

    if (!previewRef.current) {
      previewRef.current = new box.Preview();
    }

    if (token && selectedFileId) {
      previewRef.current.show(selectedFileId, token, {
        container: previewContainerRef.current,
      });
      previewShownRef.current = true;
    } else {
      if (previewShownRef.current) {
        previewRef.current.hide();
        previewShownRef.current = false;
      }
    }
  }, [boxReady, selectedFileId, token]);

  useEffect(() => {
    if (!boxReady) return;
    const box = window.Box as BoxGlobal | undefined;
    if (!box) return;
    if (!sidebarContainerRef.current) return;

    if (!sidebarRef.current) {
      sidebarRef.current = new box.ContentSidebar();
    }

    if (token && selectedFileId) {
      sidebarRef.current.show(selectedFileId, token, {
        container: sidebarContainerRef.current,
        hasMetadata: true,
        hasActivityFeed: true,
        hasVersions: true,
        detailsSidebarProps: {
          hasProperties: true,
          hasAccessStats: true,
          hasClassification: true,
          hasRetentionPolicy: true,
        },
      });
      sidebarShownRef.current = true;
    } else {
      if (sidebarShownRef.current) {
        sidebarRef.current.hide();
        sidebarShownRef.current = false;
      }
    }
  }, [boxReady, selectedFileId, token]);

  useEffect(() => () => {
    if (explorerRef.current?.removeAllListeners) {
      explorerRef.current.removeAllListeners();
    } else {
      explorerRef.current?.removeListener?.("select", handleBoxSelect);
    }

    if (pickerRef.current?.removeAllListeners) {
      pickerRef.current.removeAllListeners();
    } else {
      pickerRef.current?.removeListener?.("choose", handleBoxSelect);
    }

    explorerRef.current?.hide();
    pickerRef.current?.hide();
    previewRef.current?.hide();
    sidebarRef.current?.hide();
  }, [handleBoxSelect]);

  const explorerOverlay: BoxOverlayState = useMemo(() => {
    if (!boxReady) return "loading";
    if (!token) return "token";
    return "ready";
  }, [boxReady, token]);

  const pickerOverlay: BoxOverlayState = useMemo(() => {
    if (!boxReady) return "loading";
    if (!token) return "token";
    return "ready";
  }, [boxReady, token]);

  const previewOverlay: BoxOverlayState = useMemo(() => {
    if (!boxReady) return "loading";
    if (!token) return "token";
    if (!selectedFileId) return "select";
    return "ready";
  }, [boxReady, selectedFileId, token]);

  const sidebarOverlay: BoxOverlayState = useMemo(() => {
    if (!boxReady) return "loading";
    if (!token) return "token";
    if (!selectedFileId) return "select";
    return "ready";
  }, [boxReady, selectedFileId, token]);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          <section className="rounded-md border bg-background">
            <div className="relative min-h-[520px]">
              <div
                id="box-content-explorer"
                ref={explorerContainerRef}
                className="min-h-[520px]"
              />
              {explorerOverlay !== "ready" ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  {resolveOverlayMessage(explorerOverlay)}
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-md border bg-background">
              <div className="relative min-h-[240px]">
                <div
                  id="box-content-preview"
                  ref={previewContainerRef}
                  className="min-h-[240px]"
                />
                {previewOverlay !== "ready" ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    {resolveOverlayMessage(previewOverlay)}
                  </div>
                ) : null}
              </div>
            </section>
            <section className="rounded-md border bg-background">
              <div className="relative min-h-[260px]">
                <div
                  id="box-content-sidebar"
                  ref={sidebarContainerRef}
                  className="min-h-[260px]"
                />
                {sidebarOverlay !== "ready" ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    {resolveOverlayMessage(sidebarOverlay)}
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-md border bg-background">
          <div className="relative min-h-[420px]">
            <div
              id="box-content-picker"
              ref={pickerContainerRef}
              className="min-h-[420px]"
            />
            {pickerOverlay !== "ready" ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                {resolveOverlayMessage(pickerOverlay)}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </Layout>
  );
};

const SS = () => {
  const explorerTargetId = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const fileId = params.get("fileId")?.trim();
    return fileId && fileId.length > 0 ? fileId : undefined;
  }, []);

  return (
    <BoxManage>
      {({ token }) => (
        <BoxExplorerView explorerTargetId={explorerTargetId} token={token} />
      )}
    </BoxManage>
  );
};

export default SS;
export { SS };
