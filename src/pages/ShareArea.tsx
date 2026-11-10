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
  const [myCenterOpen, setMyCenterOpen] = useState(true);
  const [collaborationOpen, setCollaborationOpen] = useState(true);

  // My Center は中身の高さだけ取り、両方開いているときは半分まで。
  // My Collaboration は残りをすべて使う。たたんだ側は見出しの高さだけになる
  const myCenterClass = !myCenterOpen
    ? "flex-none"
    : collaborationOpen
      ? "flex-none max-h-1/2"
      : "flex-initial";
  const collaborationClass = collaborationOpen ? "flex-1" : "flex-none";

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
          title="My Center"
          open={myCenterOpen}
          onOpenChange={setMyCenterOpen}
          className={myCenterClass}
        >
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {area.label}
                  </p>
                </AreaCard>
              </li>
            ))}
          </ul>
        </AreaSection>

        <AreaSection
          id="my-collaboration-heading"
          title="My Collaboration"
          open={collaborationOpen}
          onOpenChange={setCollaborationOpen}
          className={collaborationClass}
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
