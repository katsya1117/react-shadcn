import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { JobSearchParams, SearchSetConditionItem } from "../../api";
import { getJobList, jobSelector } from "../../redux/slices/jobSlice";
import { userSelector } from "../../redux/slices/userSlice";
import type { AppDispatch } from "../../redux/store";
import { toConditionString } from "../../utility/JobCondition";
import { Layout } from "@/components/frame/Layout";
import { Conditions } from "../parts/JobSearch/Conditions";
import { SearchSet, SearchSetMode } from "../parts/JobSearch/SearchSet";
// import { FolderLock, ShieldCheck } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  // TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomPagination } from "../parts/Pagination/Pagination";

const JobSearch = () => {
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector(userSelector.loginUserSelector());
  const list = useSelector(jobSelector.jobListSelector());
  const [isOpen, setIsOpen] = useState(true);
  const [conditions, setConditions] = useState<SearchSetConditionItem[]>([]);
  const [defaultConditions, setDefaultConditions] = useState<
    SearchSetConditionItem[]
  >([]);
  const [mode, setMode] = useState<SearchSetMode>(SearchSetMode.Search);

  const user_cd = user?.user_cd ?? "";
  const handleOpenClose = () => setIsOpen((prev) => !prev);

  const onHandleSearch = () => {
    if (conditions.length > 0) {
      dispatch(
        getJobList({
          language: "0",
          user_cd: user_cd,
          center_name: "",
          search_condition_list: toConditionString(conditions),
          operation: "search",
          status_definition: "",
          sort: "id",
          order: "asc",
          page: "1",
          per_page: undefined,
        }),
      );
      // Implement search logic here
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">ジョブ検索</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenClose}>
              {isOpen ? "条件を閉じる" : "条件を開く"}
            </Button>
            <Button onClick={onHandleSearch}>検索を実行</Button>
          </div>
        </div>

        <Card className="p-0">
          <SearchSet
            user_cd={user_cd}
            mode={mode}
            condition={conditions}
            onHandleSearch={onHandleSearch}
            onHandleModuleChange={() => setMode(mode)}
            onSetDefaultConditions={(items) => setDefaultConditions(items)}
            onConditionsChange={(items) => setConditions(items)}
            defaultConditions={defaultConditions}
          />
        </Card>
        <Card>
          <CardHeader onClick={handleOpenClose}>
            <div style={{ textAlign: "left" }}>
              検索条件 {isOpen ? "▲" : "▼"}
            </div>
          </CardHeader>
          {isOpen && (
            <CardContent>
              <Conditions
                key={toConditionString(defaultConditions)}
                defaultConditions={defaultConditions}
                onChangeCondition={setConditions}
              />
            </CardContent>
          )}
        </Card>

        {/* <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]"> */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>検索結果</CardTitle>
                {/* <CardDescription>条件に合致したジョブ一覧</CardDescription> */}
                {list && (
                  <span className="text-xs text-muted-foreground">
                    {list.pagination?.total ?? 0}件ヒットしました。
                  </span>
                )}
              </div>
              {/* <div className="text-xs text-muted-foreground">
                  件数: {list?.pagination?.total ?? 0}
                </div> */}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {list && (
              <>
                <CustomPagination<JobSearchParams>
                  pagination={list.pagination}
                  onHandle={(t) => {
                    dispatch(getJobList(t));
                  }}
                />
                <div className="overflow-hidden rounded-lg border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {list.headers.map((e, i) => (
                          <TableHead key={i} className="px-3 py-3">
                            {e.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.items.map((e, i) => (
                        <TableRow key={i}>
                          {e.items.map((f, j) => (
                            <TableCell key={j} className="px-3 py-3 text-left">
                              {f.data}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>フォルダ権限</CardTitle>
                  <CardDescription>閲覧 / 編集 / ブロックを素早く切り替え</CardDescription>
                </div>
                <ShieldCheck size={18} className="text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">フォルダ情報は未取得です。</p>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-border/80 px-3 py-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>権限変更は監査ログに記録されます</span>
                </div>
                <Button variant="ghost" size="sm">
                  ログを見る
                </Button>
              </div>
            </CardContent>
          </Card> */}
        {/* </div> */}
      </div>
      {/* <div className="hidden">
        <FolderLock size={0} />
        <Badge>dummy</Badge>
        <CustomPagination
          page={list?.pagination?.page ?? 1}
          perPage={list?.pagination?.per_page ?? 10}
          total={list?.pagination?.total ?? 0}
          onPageChange={() => {}}
          onPerPageChange={() => {}}
        />
        {void 0}
        {void (0 as unknown as JobSearchParams)}
      </div> */}
    </Layout>
  );
};

export default JobSearch;
export { JobSearch };
