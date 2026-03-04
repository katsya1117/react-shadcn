import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Layout } from "@/components/frame/Layout";
import type { AppDispatch } from "@/redux/store";
import {
  boxSelector,
  getBoxAccessToken,
  getBoxAccountId,
  userSelector,
} from "@/redux/slices/userSlice";

import {
  ContentExplorer,
  ContentPicker,
  ContentPreview,
  ContentSidebar,
} from "box-ui-elements";
import messages from "box-ui-elements/i18n/ja-JP";

type BoxItemLite = {
  id?: string | number;
  type?: string;
};

const BoxElements = () => {
  const dispatch = useDispatch<AppDispatch>();
  const loginUserCd = useSelector(userSelector.loginUserCdSelector());
  const token = useSelector(boxSelector.tokenSelector()) as string | undefined;

  const [selectedFileId, setSelectedFileId] = useState("");

  const effectiveUserCd = useMemo(
    () => (loginUserCd && loginUserCd.trim() ? loginUserCd : "demo-user"),
    [loginUserCd],
  );

  const rootFolderId = "0";

  const ensureToken = useCallback(async () => {
    const accountId = await dispatch(
      getBoxAccountId(effectiveUserCd),
    ).unwrap();
    await dispatch(getBoxAccessToken(accountId)).unwrap();
  }, [dispatch, effectiveUserCd]);

  useEffect(() => {
    if (!token) {
      ensureToken().catch(() => {
        /* handled by slice */
      });
    }
  }, [ensureToken, token]);

  const handlePickItems = useCallback((items: unknown) => {
    const list = Array.isArray(items) ? items : [items];
    const firstFile = list.find(
      (item) => item && (item as BoxItemLite).type === "file",
    ) as BoxItemLite | undefined;
    if (!firstFile?.id) return;
    setSelectedFileId(String(firstFile.id));
  }, []);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          <section className="rounded-md border bg-background">
            {token ? (
              <ContentExplorer
                rootFolderId={rootFolderId}
                token={token}
                language="ja-JP"
                messages={messages}
                canUpload={false}
                onSelect={handlePickItems}
              />
            ) : (
              <div className="min-h-[520px] flex items-center justify-center text-sm text-muted-foreground">
                Box に接続中...
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-md border bg-background min-h-[240px]">
              {token && selectedFileId ? (
                <ContentPreview
                  fileId={selectedFileId}
                  token={token}
                  language="ja-JP"
                  messages={messages}
                />
              ) : (
                <div className="min-h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                  ファイルを選択してください
                </div>
              )}
            </section>
            <section className="rounded-md border bg-background min-h-[260px]">
              {token && selectedFileId ? (
                <ContentSidebar
                  fileId={selectedFileId}
                  token={token}
                  language="ja-JP"
                  messages={messages}
                  hasMetadata
                  hasActivityFeed
                  hasVersions
                  detailsSidebarProps={{
                    hasProperties: true,
                    hasAccessStats: true,
                    hasClassification: true,
                    hasRetentionPolicy: true,
                  }}
                />
              ) : (
                <div className="min-h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                  ファイルを選択してください
                </div>
              )}
            </section>
          </aside>
        </div>

        <section className="rounded-md border bg-background">
          {token ? (
            <ContentPicker
              rootFolderId={rootFolderId}
              token={token}
              language="ja-JP"
              messages={messages}
              maxSelectable={1}
              onChoose={handlePickItems}
              canUpload={false}
              isHeaderLogoVisible={false}
              showSelectedButton={false}
            />
          ) : (
            <div className="min-h-[420px] flex items-center justify-center text-sm text-muted-foreground">
              Box に接続中...
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default BoxElements;
export { BoxElements };
