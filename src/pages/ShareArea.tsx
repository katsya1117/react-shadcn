import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Settings, Users } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { generatePath, useNavigate } from "react-router";
import { UrlPath } from "@/constants/UrlPath";
import { SHARE_AREAS } from "@/config/shareAreaConfig";
import {
  AreaActionDivider,
  AreaCard,
  AreaIconButton,
  BoxLinkButtons,
} from "@/components/ss/AreaCard";
import { AreaSection } from "@/components/ss/AreaSection";
import {
  SHARED_AREA_FILTER_MIN_COUNT,
  SharedAreaFilter,
  SharedAreaList,
  filterSharedAreas,
} from "@/components/ss/SharedAreaList";
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
  const [query, setQuery] = useState("");

  const filteredShared = useMemo(
    () => filterSharedAreas(sharedItems, query),
    [sharedItems, query],
  );

  // 共有された領域は、画面を開くたびに取り直す（DB のみ。Box は呼ばない）
  useEffect(() => {
    void dispatch(getSharedAreas(userCd ?? ""));
  }, [dispatch, userCd]);

  return (
    <TooltipProvider delayDuration={150}>
      {/* ヘッダー（h-14）と main の上下余白（1rem × 2）を除いた高さに収め、各ブロック内でスクロールさせる */}
      <div className="flex h-[calc(100dvh-5.5rem)] min-h-96 flex-col gap-3">
        <AreaSection
          id="my-center-heading"
          title="所属センター"
          description="所属、またはゲストとして招待されているセンターの領域"
          count={areas.length}
          className="max-h-[45%] flex-none"
        >
          <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {areas.map((area) => (
              <li key={area.code}>
                <AreaCard
                  actions={
                    <>
                      {IS_ADMIN && (
                        <AreaIconButton label="センターメンバー一覧">
                          <Users className="h-4 w-4" aria-hidden />
                        </AreaIconButton>
                      )}
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
                      <AreaActionDivider />
                      {/* Box Drive は jclUrl で開く */}
                      <BoxLinkButtons
                        webBoxUrl={buildWebBoxUrl(area.boxFolderId)}
                        boxDriveUrl={area.jclUrl}
                      />
                    </>
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-semibold tracking-tight text-foreground">
                      {area.folderName}
                    </span>
                    {area.isGuest && (
                      <Badge
                        variant="outline"
                        className="h-5 shrink-0 px-1.5 text-[10px] font-normal text-muted-foreground"
                      >
                        ゲスト
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {area.label}
                  </p>
                </AreaCard>
              </li>
            ))}
          </ul>
        </AreaSection>

        <AreaSection
          id="my-collaboration-heading"
          title="共有された領域"
          description="他のセンターから共有されているフォルダ"
          count={sharedLoaded ? sharedItems.length : undefined}
          className="flex-1"
          action={
            sharedItems.length > SHARED_AREA_FILTER_MIN_COUNT && (
              <SharedAreaFilter value={query} onChange={setQuery} />
            )
          }
        >
          {sharedError.isError ? (
            <p className="text-sm text-destructive">{sharedError.messages}</p>
          ) : sharedLoaded && sharedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              共有されている領域はありません。
            </p>
          ) : (
            <SharedAreaList items={filteredShared} />
          )}
        </AreaSection>
      </div>
    </TooltipProvider>
  );
};

export default ShareArea;
export { ShareArea };
