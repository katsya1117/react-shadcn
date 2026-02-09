import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { CustomPagination } from "@/components/parts/Pagination/Pagination";
import { usePagination } from "@/utility/usePagination";
import { UserTabsShell } from "@/components/pages/UserTabsShell";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getUserList, userSelector } from "@/redux/slices/userSlice";
import { UrlPath } from "@/constant/UrlPath";
import { useNavigate } from "react-router";
import type { Pagination, UserInfo, UserSearchParams } from "@/api";

const UserManage = () => {
  // 編集 検索条件
  const [displayKeyword, setDisplayKeyword] = useState("");
  const [userIdKeyword, setUserIdKeyword] = useState("");
  const [userEmailKeyword, setUserEmailKeyword] = useState("");
  const [centerKeyword, setCenterKeyword] = useState("");

  const [editSearched, setEditSearched] = useState(false);
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ key: "id" | "display" | "email" | "box" | "center"; order: "asc" | "desc" } | null>(null);

  const dispatch = useAppDispatch();
  const savedCondition = useAppSelector(userSelector.searchConditionSelector());
  const userList = useAppSelector(userSelector.userListSelector());

  // フォーム初期値を savedCondition で復元
  useEffect(() => {
    if (savedCondition) {
      setDisplayKeyword(savedCondition.user_name ?? "");
      setUserIdKeyword(savedCondition.user_account ?? "");
      setUserEmailKeyword(savedCondition.user_email ?? "");
      setCenterKeyword(savedCondition.center_cd_list?.[0] ?? "");
      setEditSearched(true);
    }
  }, [savedCondition]);

  const jclRecords = useMemo<UserInfo[]>(() => userList?.data ?? [], [userList]);

  const sortedRecords = useMemo(() => {
    if (!sort) return jclRecords;
    const arr = [...jclRecords];
    const { key, order } = sort;
    const dir = order === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const av = (a.user?.user_cd ?? "") + "";
      const bv = (b.user?.user_cd ?? "") + "";
      const map: Record<typeof key, [string, string]> = {
        id: [av, bv],
        display: [a.user?.user_name ?? "", b.user?.user_name ?? ""],
        email: [a.user?.email ?? "", b.user?.email ?? ""],
        box: [a.user?.box_account ?? "", b.user?.box_account ?? ""],
        center: [a.user?.center ?? "", b.user?.center ?? ""],
      };
      const [va, vb] = map[key];
      return va.localeCompare(vb, "ja") * dir;
    });
    return arr;
  }, [jclRecords, sort]);

  const jclPagination = usePagination(sortedRecords, userList?.pagination?.per_page ?? 10);

  const handleUserSearch = (page = 1, per = jclPagination.perPage) => {
    const params: UserSearchParams = {
      user_name: displayKeyword || undefined,
      user_account: userIdKeyword || undefined,
      user_email: userEmailKeyword || undefined,
      center_cd_list: centerKeyword ? [centerKeyword] : undefined,
      page,
      per_page: per,
    };
    dispatch(getUserList(params));
    setEditSearched(true);
    setSort(null);
  };

  const pagination = useMemo<Pagination>(() => {
    const current = userList?.pagination?.page ?? jclPagination.page;
    const per = userList?.pagination?.per_page ?? jclPagination.perPage;
    const total = userList?.pagination?.total ?? jclPagination.total;
    const last = Math.max(1, Math.ceil(total / (per || 1)));
    const from = total === 0 ? 0 : (current - 1) * per + 1;
    const to = Math.min(total, current * per);
    const url = (p: number | null) => (p ? `/api/users?page=${p}&per_page=${per}` : null);
    return {
      current_page: current,
      last_page: last,
      per_page: per,
      from,
      to,
      total,
      first_page_url: url(1)!,
      prev_page_url: url(current > 1 ? current - 1 : null),
      next_page_url: url(current < last ? current + 1 : null),
      last_page_url: url(last)!,
    };
  }, [userList, jclPagination.page, jclPagination.perPage, jclPagination.total]);

  const handlePagination = (params: Record<string, string>) => {
    const nextPage = Number(params.page ?? pagination.current_page) || 1;
    const nextPer = Number(params.per_page ?? pagination.per_page) || pagination.per_page;
    handleUserSearch(nextPage, nextPer);
  };

  return (
    <UserTabsShell active="edit">
      <div className="space-y-4">
              <Card className="shadow-sm border border-border/80">
                <CardHeader>
                  <CardTitle>ユーザー検索</CardTitle>
                  <CardDescription>表示名 / ユーザーID / メール / センターで絞り込み。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Accordion type="single" collapsible defaultValue="cond-edit">
                    <AccordionItem value="cond-edit">
                      <AccordionTrigger>検索条件</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-4">
                          <div className="space-y-2 min-w-[220px] flex-1">
                            <Label>表示名</Label>
                            <Input
                              placeholder="例: 鈴木"
                              value={displayKeyword}
                              onChange={(e) => setDisplayKeyword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2 min-w-[180px] flex-[0.8]">
                            <Label>ユーザーID</Label>
                            <Input
                              placeholder="例: u001"
                              value={userIdKeyword}
                              onChange={(e) => setUserIdKeyword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2 min-w-[240px] flex-1">
                            <Label>メールアドレス</Label>
                            <Input
                              placeholder="例: user@example.com"
                              value={userEmailKeyword}
                              onChange={(e) => setUserEmailKeyword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2 min-w-[220px] flex-1">
                            <Label>センター（Autocomplete想定）</Label>
                            <Input
                              placeholder="例: 東京"
                              value={centerKeyword}
                              onChange={(e) => setCenterKeyword(e.target.value)}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                    <div className="rounded-lg border bg-card/60 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        検索結果 {userList?.pagination?.total ?? jclRecords.length} 件
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setDisplayKeyword("");
                          setUserIdKeyword("");
                          setUserEmailKeyword("");
                          setCenterKeyword("");
                          setEditSearched(false);
                        }}>
                          クリア
                        </Button>
                        <Button size="sm" onClick={() => handleUserSearch(jclPagination.page, jclPagination.perPage)}>再検索</Button>
                      </div>
                    </div>
                    {editSearched && (
                      <div className="space-y-2">
                        <div className="max-h-[420px] overflow-auto rounded-lg border bg-background/60">
                          <Table>
                        <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "id" && prev.order === "asc" ? { key: "id", order: "desc" } : { key: "id", order: "asc" })}>
                                  ユーザーID
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "display" && prev.order === "asc" ? { key: "display", order: "desc" } : { key: "display", order: "asc" })}>
                                  表示名
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "email" && prev.order === "asc" ? { key: "email", order: "desc" } : { key: "email", order: "asc" })}>
                                  メール
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "box" && prev.order === "asc" ? { key: "box", order: "desc" } : { key: "box", order: "asc" })}>
                                  BOX
                                </TableHead>
                                <TableHead className="cursor-pointer" onClick={() => setSort((prev) => prev?.key === "center" && prev.order === "asc" ? { key: "center", order: "desc" } : { key: "center", order: "asc" })}>
                                  センター
                                </TableHead>
                                <TableHead className="text-right">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                        {jclPagination.items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                              該当するユーザーが見つかりませんでした。
                            </TableCell>
                          </TableRow>
                        )}
                        {jclPagination.items.map((u: UserInfo, i) => (
                            <TableRow key={u.user?.user_cd ?? `row-${i}`} className="last:border-0">
                              <TableCell>{u.user?.user_cd ?? "-"}</TableCell>
                              <TableCell>{u.user?.user_name ?? "-"}</TableCell>
                              <TableCell>{u.user?.email ?? "-"}</TableCell>
                              <TableCell>{u.user?.box_account ?? "-"}</TableCell>
                              <TableCell>{u.user?.center ?? "-"}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    const userId = u.user?.user_cd;
                                    if (userId) {
                                      navigate(UrlPath.UserEdit.replace(":user_cd", userId));
                                    }
                                  }}
                                >
                                  選択
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="px-2 pb-2">
                          <CustomPagination
                            pagination={pagination}
                            onHandle={handlePagination}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

      </div>
    </UserTabsShell>
  );
};

export default UserManage;
export { UserManage };
