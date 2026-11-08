import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2, Settings, Share2, Users } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { generatePath, useNavigate } from "react-router";
import { UrlPath } from "@/constants/UrlPath";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import {
  AreaCard,
  AreaFolderIcon,
  AreaIconButton,
  BoxLinkButtons,
} from "@/components/ss/AreaCard";
import { AreaSection } from "@/components/ss/AreaSection";
import { SharedAreaList } from "@/components/ss/SharedAreaList";
import { useAppDispatch } from "@/redux/hooks";
import { useSelector } from "react-redux";
import { userSelector } from "@/redux/slices/userSlice";
import {
  getSharedAreas,
  sharedAreaSelector,
} from "@/redux/slices/sharedAreaSlice";
import { buildWebBoxUrl } from "@/lib/sharedArea";

/** モック用フラグ。将来的にはセッションのロールから取得する */
const IS_ADMIN = true;

const ShareArea = () => {
  const areas = SHARE_AREAS;
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userCd = useSelector(userSelector.loginUserCdSelector());
  const sharedItems = useSelector(sharedAreaSelector.itemsSelector());
  const sharedLoaded = useSelector(sharedAreaSelector.loadedSelector());
  const sharedError = useSelector(sharedAreaSelector.errorSelector());

  // 共有された領域は、画面を開くたびに取り直す（DB のみ。Box は呼ばない）
  useEffect(() => {
    void dispatch(getSharedAreas(userCd ?? ""));
  }, [dispatch, userCd]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-10">
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/60 font-medium">
            Center Area
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">センター専用領域</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            部署やプロジェクト単位で区切られた領域のうち、あなたがアクセスできるものを一覧表示しています。
          </p>
        </div>

        {/* MyCenter: 所属・ゲストのセンター */}
        <AreaSection
          id="my-center-heading"
          eyebrow="My Center"
          title="所属センター"
          description="あなたが所属、またはゲストとして招待されているセンターの領域です。"
          icon={<Building2 className="h-4.5 w-4.5" aria-hidden />}
          tone="primary"
          count={areas.length}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {areas.map((area) => (
              <AreaCard key={area.code}>
                {/* 右上：管理者専用ボタン */}
                {IS_ADMIN && (
                  <div className="absolute top-3 right-3">
                    <AreaIconButton
                      label="センターメンバー一覧"
                      className="h-7 w-7 text-muted-foreground/60 opacity-0 hover:scale-100 group-hover:opacity-100"
                    >
                      <Users className="h-3.5 w-3.5" aria-hidden />
                    </AreaIconButton>
                  </div>
                )}

                {/* メインコンテンツ */}
                <div className="flex items-start gap-3">
                  {/* フォルダアイコン */}
                  <AreaFolderIcon tone="primary" />

                  {/* テキスト情報 */}
                  <div className="min-w-0 flex-1 space-y-1 pr-8">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold tracking-tight text-foreground truncate">
                        {area.folderName}
                      </span>
                      {area.isGuest && (
                        <Badge
                          variant="secondary"
                          className="shrink-0 h-5 px-1.5 text-[10px] font-medium bg-amber-100/80 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          ゲスト
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/80 truncate">
                      {area.label}
                    </p>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="mt-4 flex items-center justify-between">
                  {/* 左：コラボレーション設定 */}
                  <AreaIconButton
                    label="コラボレーション設定"
                    onClick={() =>
                      navigate(
                        generatePath(UrlPath.SS, {
                          rootFolderId: area.boxFolderId,
                        }),
                      )
                    }
                  >
                    <Settings className="h-4 w-4" aria-hidden />
                  </AreaIconButton>

                  {/* 右：Box操作（Box Drive は jclUrl で開く） */}
                  <BoxLinkButtons
                    webBoxUrl={buildWebBoxUrl(area.boxFolderId)}
                    boxDriveUrl={area.jclUrl}
                  />
                </div>
              </AreaCard>
            ))}
          </div>
        </AreaSection>

        {/* MyCollaboration: 他センターから共有された領域。共有されたフォルダごとに 1 枚（2 段組） */}
        <AreaSection
          id="my-collaboration-heading"
          eyebrow="My Collaboration"
          title="共有された領域"
          description="他のセンターから、あなたに共有されているフォルダです。"
          icon={<Share2 className="h-4.5 w-4.5" aria-hidden />}
          tone="sky"
          count={sharedLoaded ? sharedItems.length : undefined}
        >
          {sharedError.isError ? (
            <p className="text-sm text-destructive">{sharedError.messages}</p>
          ) : sharedLoaded && sharedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              共有されている領域はありません。
            </p>
          ) : (
            <SharedAreaList items={sharedItems} />
          )}
        </AreaSection>
      </div>
    </TooltipProvider>
  );
};

export default ShareArea;
export { ShareArea };
