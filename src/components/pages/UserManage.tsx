import type { AutoCompleteData, UserSearchParams } from "@/api";
import { UserTabsShell } from "@/components/pages/UserTabsShell";
import { AutoCompleteMulti } from "@/components/parts/AutoComplete/AutoCompleteMulti";
import { CustomPagination } from "@/components/parts/Pagination/Pagination";
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
import { UrlPath } from "@/constant/UrlPath";
import { getUserList, userSelector } from "@/redux/slices/userSlice";
import { useAppDispatch } from "@/store/hooks";
import { useState } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router";
import type { MultiValue } from "react-select";

const UserManage = () => {
  // 編集 検索条件
  const dispatch = useAppDispatch();
  const list = useSelector(userSelector.userListSelector());
  const searchCondition = useSelector(userSelector.searchConditionSelector());
  const isSearched = useSelector(
    userSelector.searchResultDispSelector(),
  ).settingSearched;

  const [searchDispName, setSearchDispName] = useState(
    searchCondition?.user_name ?? "",
  );
  const [searchUserId, setSearchUserId] = useState(
    searchCondition?.user_account ?? "",
  );
  const [searchMailAddress, setSearchMailAddress] = useState(
    searchCondition?.user_email ?? "",
  );
  const [searchCenterCds, setSearchCenterCds] = useState(
    searchCondition?.center_cd_list ?? "",
  );
  const [selectCenterList, setSelectCenterList] = useState<
    MultiValue<AutoCompleteData>
  >(searchCondition?.auto_complete ?? []);

  const onHandleSearch = () => {
    dispatch(
      getUserList({
        user_name: searchDispName,
        user_account: searchUserId,
        user_email: searchMailAddress,
        center_cd_list: searchCenterCds,
        sort: "id",
        order: "asc",
        page: 1,
        per_page: undefined,
        auto_complete: selectCenterList,
      }),
    );
  };

  return (
    <UserTabsShell active="setting">
      <div className="flex flex-row gap-6 items-end">
        <h2 className="text-left text-base font-semibold">JCLユーザー検索</h2>
        <span className="text-muted-foreground text-sm">
          設定を確認したいユーザーを検索
        </span>
      </div>
      <Card className="shadow-sm">
        <CardContent>
          <div className="border-b space-y-5 pb-6">
            <form>
              <FieldGroup>
                <FieldSet>
                  <h3 className="text-left font-semibold">検索条件</h3>
                  <FieldGroup className="flex flex-wrap flex-row gap-4 w-full">
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputDisplayName">表示名</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="inputDisplayName"
                          value={searchDispName}
                          onChange={(e) => setSearchDispName(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>部分一致</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputUserId">ユーザーID</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="inputUserId"
                          value={searchUserId}
                          onChange={(e) => setSearchUserId(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>部分一致</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputMail">
                        メールアドレス
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="inputMail"
                          value={searchMailAddress}
                          onChange={(e) => setSearchMailAddress(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>xxxxx.jp</InputGroupText>
                          <InputGroupText>|</InputGroupText>
                          <InputGroupText>前方一致</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputCenter">センター</FieldLabel>
                      <AutoCompleteMulti
                        type="center"
                        value={selectCenterList}
                        onChange={(e) => {
                          setSelectCenterList(e);
                          setSearchCenterCds(e.map((v) => v.value).join(","));
                        }}
                        placeholder="センターを選択"
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </form>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setSearchDispName("");
                  setSearchUserId("");
                  setSearchMailAddress("");
                  setSelectCenterList([]);
                  setSearchCenterCds("");
                }}
              >
                クリア
              </Button>
              <Button size="lg" onClick={onHandleSearch}>
                検索
              </Button>
            </div>
          </div>
          {isSearched && list && (list?.items?.length ?? 0) > 0 ? (
            <div className="space-y-5 pt-6">
              <h3 className="text-base font-semibold">検索結果</h3>
              <div className="w-full [&>div]:max-h-[420px] overflow-auto rounded border">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-background hover:bg-muted [&>th]:py-3.5 *:whitespace-nowrap after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border after:content-['']">
                      <TableHead className="w-[20%] pl-4">ユーザーID</TableHead>
                      <TableHead className="w-[25%]">表示名</TableHead>
                      <TableHead className="w-[25%]">メール</TableHead>
                      <TableHead className="w-[25%]">BOXアカウント</TableHead>
                      <TableHead className="w-[10%] text-right pr-4">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.items.map((item) => (
                      <TableRow
                        key={item.user_cd}
                        className="*:whitespace-nowrap"
                      >
                        <TableCell className="pl-4 py-3 truncate">
                          {item.user_cd}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.disp_name}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.email}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.box_user_id ? "&#x3007;" : ""}
                        </TableCell>
                        <TableCell className="py-3 text-right pr-4">
                          <Button size="sm" variant="secondary">
                            <NavLink
                              to={UrlPath.UserEdit.replace(
                                ":user_cd",
                                item.user_cd,
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
              <CustomPagination<UserSearchParams>
                pagination={list.pagination}
                onHandle={(t) => {
                  dispatch(getUserList(t));
                }}
              />
            </div>
          ) : isSearched ? (
            <div className="py-6 text-center text-muted-foreground">
              該当するユーザーが見つかりませんでした。
            </div>
          ) : (
            <></>
          )}
        </CardContent>
      </Card>
    </UserTabsShell>
  );
};

export default UserManage;
export { UserManage };
