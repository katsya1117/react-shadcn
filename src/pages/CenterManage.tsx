import type { CenterSearchParams } from "@/api";
import { CustomPagination } from "@/components/common/Pagination/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { UrlPath } from "@/constants/UrlPath";
import { CenterTabsShell } from "@/pages/CenterTabsShell";
import { centerSelector, getCenterList } from "@/redux/slices/centerSlice";
import type { AppDispatch } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router";

type CenterManageLocationState = {
  deletedCenterCd?: string;
};

const CenterManage = () => {
  // 編集 検索条件
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const list = useSelector(centerSelector.centerListSelector());
  const searchCondition = useSelector(
    centerSelector.searchConditionSelector(),
  );
  const isSearched = useSelector(
    centerSelector.searchResultDispSelector(),
  ).settingSearched;

  const [searchCenterName, setSearchCenterName] = useState(
    searchCondition?.center_name ?? "",
  );
  const [searchMembers, setSearchMembers] = useState(
    searchCondition?.user_list?.join(",") ?? "",
  );

  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = location.state as CenterManageLocationState | null;
    if (!state?.deletedCenterCd) return;

    toast.success(`センター${state.deletedCenterCd}を削除しました`);
    navigate(".", {
      replace: true,
      state: null,
    });
  }, [location.state, navigate]);

  // 編集・削除・作成から戻ってきたときに、表示中の一覧を最新化する
  useEffect(() => {
    if (!isSearched || !searchCondition) return;
    const refetch = async () => {
      const result = await dispatch(getCenterList(searchCondition));
      const items = (result.payload as { items?: unknown[] } | undefined)
        ?.items;
      // TODO(実API確認): 範囲外ページ（削除等で最終ページが空になった場合）を実APIが
      // 「空配列で 200」「404」のどちらで返すかを確認し、最終仕様に合わせてここを直すこと。
      // 現状の仮仕様: 取得成功・0件・page > 1 のときは 1 ページ目で取り直す。
      // （404 の場合は rejected になりここに入らないため、rejected 側の扱いも合わせて決める）
      const page = Number(searchCondition.page ?? 1);
      if (
        result.meta?.requestStatus === "fulfilled" &&
        page > 1 &&
        (items?.length ?? 0) === 0
      ) {
        dispatch(getCenterList({ ...searchCondition, page: 1 }));
      }
    };
    refetch();
    // マウント時のみ実行する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    tableContainerRef.current?.scrollTo({ top: 0 });
  }, [list]);

  const onHandleSearch = () => {
    dispatch(
      getCenterList({
        center_name: searchCenterName,
        user_list: searchMembers
          .split(/[,\s、]+/)
          .filter((name) => name !== ""),
        sort: "id",
        order: "asc",
        page: 1,
        per_page: undefined,
      }),
    );
  };

  return (
    <CenterTabsShell active="edit">
      <div className="flex flex-row gap-6 items-end">
        <h2 className="text-left text-base font-semibold">センター検索</h2>
        <span className="text-muted-foreground text-sm">
          設定を確認したいセンターを検索
        </span>
      </div>
      <Card className="shadow-sm">
        <CardContent>
          <div className="border-b space-y-5 pb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onHandleSearch();
              }}
            >
              <FieldGroup>
                <FieldSet>
                  <h3 className="text-left font-semibold">検索条件</h3>
                  <FieldGroup className="flex flex-wrap flex-row gap-4 w-full">
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputCenterName">
                        センター名
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="inputCenterName"
                          placeholder="例: 東京センター"
                          value={searchCenterName}
                          onChange={(e) => setSearchCenterName(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>部分一致</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputMembers">メンバー</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="inputMembers"
                          placeholder="ユーザー名で逆引き"
                          value={searchMembers}
                          onChange={(e) => setSearchMembers(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>部分一致</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setSearchCenterName("");
                    setSearchMembers("");
                  }}
                >
                  クリア
                </Button>
                <Button size="lg" type="submit">
                  検索
                </Button>
              </div>
            </form>
          </div>
          {isSearched && list && (list?.items?.length ?? 0) > 0 ? (
            <div className="space-y-5 pt-6">
              <h3 className="text-base font-semibold">検索結果</h3>
              <div
                ref={tableContainerRef}
                className="w-full [&>div]:max-h-[420px] overflow-auto rounded border"
              >
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-background hover:bg-muted [&>th]:py-3.5 *:whitespace-nowrap after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border after:content-['']">
                      <TableHead className="w-[30%] pl-4">センター名</TableHead>
                      <TableHead className="w-[15%]">メンバー数</TableHead>
                      <TableHead className="w-[20%]">タイプ</TableHead>
                      <TableHead className="w-[25%]">拠点</TableHead>
                      <TableHead className="w-[10%] text-right pr-4">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.items.map((item) => (
                      <TableRow
                        key={item.center_cd}
                        className="*:whitespace-nowrap"
                      >
                        <TableCell className="pl-4 py-3 truncate">
                          {item.center_name}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.members}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.site}
                        </TableCell>
                        <TableCell className="py-3 text-right pr-4">
                          <Button asChild size="sm" variant="secondary">
                            <NavLink
                              to={UrlPath.CenterEdit.replace(
                                ":center_cd",
                                item.center_cd,
                              )}
                            >
                              選択
                            </NavLink>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <CustomPagination<CenterSearchParams>
                pagination={list.pagination}
                onHandle={(t) => {
                  // ページネーションURLは page/per_page のみのため、検索条件を引き継ぐ
                  dispatch(getCenterList({ ...searchCondition, ...t }));
                }}
              />
            </div>
          ) : isSearched ? (
            <div className="py-6 text-center text-muted-foreground">
              該当するセンターが見つかりませんでした。
            </div>
          ) : (
            <></>
          )}
        </CardContent>
      </Card>
    </CenterTabsShell>
  );
};

export default CenterManage;
export { CenterManage };
