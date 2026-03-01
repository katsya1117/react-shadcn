import type { AdUserList, UserCreationParams, UserSearchParams } from "@/api";
import { UserTabsShell } from "@/components/pages/UserTabsShell";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getAdUserList,
  userCreation,
  userSelector,
} from "@/redux/slices/userSlice";
import type { AppDispatch } from "@/store";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ConfirmButton from "../ui/confirm-button";

// type ADUser = {
//   account: string;
//   email: string;
//   name: string;
//   registered: boolean;
// };

const MAX_USERID_LEN = 31;
const MAX_DISP_LEN = 100;
const MAX_ACCOUNT_LEN = 100;
const MAX_EMAIL_LEN = 200;

const REG_STATUS = {
  UNREGISTERED: "0",
  REGISTERED: "1",
  ALL: "",
} as const;

// const adUsersMock: ADUser[] = Array.from({ length: 24 }).map((_, i) => {
//   const id = i + 1;
//   const registered = id % 4 === 0;
//   return {
//     // id 2 は意図的に文字数超過のダミー
//     account:
//       id === 2
//         ? "u".repeat(MAX_ACCOUNT_LEN + 5)
//         : `user${id.toString().padStart(3, "0")}`,
//     email:
//       id === 2
//         ? `${"verylong".repeat(40)}@example.com`
//         : `user${id.toString().padStart(3, "0")}@example.com`,
//     name: `利用者 ${id.toString().padStart(3, "0")}`,
//     registered,
//   };
// });

export const UserCreate = () => {
  const dispatch: AppDispatch = useDispatch();
  const list = useSelector(userSelector.adUserListSelector());
  const searchCondition = useSelector(
    userSelector.adUserSearchConditionSelector(),
  );
  const isSearched = useSelector(
    userSelector.searchResultDispSelector(),
  ).addSearched;

  const [searchDispName, setSearchDispName] = useState(
    searchCondition?.disp_name ?? "",
  );

  const [searchAccountName, setSearchAccountName] = useState(
    searchCondition?.account_name ?? "",
  );

  const [searchMailAddress, setSearchMailAddress] = useState(
    searchCondition?.mail_addr ?? "",
  );

  type regStatus = (typeof REG_STATUS)[keyof typeof REG_STATUS];

  const [statusFilter, setStatusFilter] = useState(
    searchCondition?.status ?? REG_STATUS.ALL,
  );

  const [adLastUpdatedAt, setAdLastUpdatedAt] = useState<Date | undefined>(
    undefined,
  );

  const onHandleSearch = () => {
    dispatch(
      getAdUserList({
        account_name: searchAccountName,
        mail_addr: searchMailAddress,
        distinguished_name: "",
        disp_name: searchDispName,
        organization_unit: "",
        status: statusFilter,
        sort: "disp_name",
        order: "asc",
        page: 1,
        per_page: undefined,
      }),
    );
  };

  const onHandleRegist = async (user: AdUserList) => {
    const errors: string[] = [];
    if (user.mail_addr.split("@")[0].length > MAX_USERID_LEN) {
      errors.push("ユーザーIDの文字数制限を超えています");
    }
    if (user.disp_name.length > MAX_DISP_LEN) {
      errors.push("表示名の文字数制限を超えています");
    }
    if (user.account_name.length > MAX_ACCOUNT_LEN) {
      errors.push("アカウント名の文字数制限を超えています");
    }
    if (user.mail_addr.length > MAX_EMAIL_LEN) {
      errors.push("メールアドレスの文字数制限を超えています");
    }

    if (errors.length) {
      toast.error("入力値が長すぎます", {
        description: errors.join(" / "),
      });
      return;
    }
    const params: UserCreationParams = {
      user_cd: user.mail_addr.split("@")[0],
      disp_name: user.disp_name,
      account: user.account_name,
      email: user.mail_addr,
      language_code: 0,
    };
    console.log("実際に送信するデータ:", params);
    const result = await dispatch(userCreation(params));
    if (userCreation.fulfilled.match(result)) {
      toast.success("ユーザーを登録しました", {
        description: `${user.disp_name} (${user.account_name}) を登録しました。`,
      });
      dispatch(
        getAdUserList({
          account_name: searchAccountName,
          mail_addr: searchMailAddress,
          distinguished_name: "",
          disp_name: searchDispName,
          organization_unit: "",
          status: statusFilter,
          sort: "disp_name",
          order: "asc",
          page: 1,
          per_page: undefined,
        }),
      );
    }
    console.log(
      "[" + user.mail_addr.split("@")[0] + "]の登録処理が完了しました。結果:",
      result,
    );
  };

  const handleRefreshAD = () => {
    setAdLastUpdatedAt(new Date());
    toast.success("ADユーザーを更新しました");
  };

  return (
    <UserTabsShell active="add">
      <div className="flex items-start justify-between">
        <div className="flex flex-row gap-6 items-end">
          <h2 className="text-left text-base font-semibold">
            JCLユーザー新規登録
          </h2>
          <span className="text-muted-foreground text-sm">
            登録したいADユーザーを検索
          </span>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1">
          <Button size="sm" variant="secondary" onClick={handleRefreshAD}>
            ADユーザー更新
          </Button>
          <p className="text-xs text-muted-foreground">
            {adLastUpdatedAt
              ? `最終更新: ${adLastUpdatedAt?.toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "最終更新: 未実行"}
          </p>
        </div>
      </div>
      <Card className="shadow-sm">
        <CardContent>
          <div className="border-b space-y-5 pb-6">
            <form>
              <FieldGroup>
                <FieldSet>
                  <h3 className="text-left font-semibold">検索条件</h3>
                  <div className="flex flex-wrap flex-row gap-4 w-full">
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputDisplayName">表示名</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="inputDisplayName"
                          value={searchDispName}
                          onChange={(e) => setSearchDispName(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          部分一致
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel htmlFor="inputAccountName">
                        アカウント名
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="inputAccountName"
                          value={searchAccountName}
                          onChange={(e) => setSearchDispName(e.target.value)}
                        />
                        <InputGroupAddon align="inline-end">
                          部分一致
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
                          <InputGroupText>部分一致</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                    <Field className="w-full lg:w-[calc(50%-0.5rem)]">
                      <FieldLabel>登録状況</FieldLabel>
                      <RadioGroup
                        className="flex gap-3"
                        value={statusFilter}
                        onValueChange={(v: regStatus) => setStatusFilter(v)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={REG_STATUS.UNREGISTERED}
                            id="unregistered"
                          />
                          <Label htmlFor="unregistered" className="font-normal">
                            未登録のみ
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={REG_STATUS.REGISTERED}
                            id="registered"
                          />
                          <Label htmlFor="registered" className="font-normal">
                            登録済みのみ
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={REG_STATUS.ALL} id="all" />
                          <Label htmlFor="all" className="font-normal">
                            すべて
                          </Label>
                        </div>
                      </RadioGroup>
                    </Field>
                  </div>
                </FieldSet>
              </FieldGroup>
            </form>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setSearchDispName("");
                  setSearchAccountName("");
                  setSearchMailAddress("");
                  setStatusFilter("");
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
                      <TableHead className="w-[20%] pl-4">表示名</TableHead>
                      <TableHead className="w-[25%]">アカウント名</TableHead>
                      <TableHead className="w-[25%]">メール</TableHead>
                      <TableHead className="w-[20%]">所属</TableHead>
                      <TableHead className="w-[10%] text-right pr-4">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.items.map((item) => (
                      <TableRow
                        key={item.mail_addr}
                        className="*:whitespace-nowrap"
                      >
                        <TableCell className="pl-4 py-3 truncate">
                          {item.disp_name}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.account_name}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.mail_addr}
                        </TableCell>
                        <TableCell className="py-3 truncate">
                          {item.organization_unit}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right pr-4",
                            item.status1 === "1" ? "text-muted-foreground" : "",
                          )}
                        >
                          {item.status1 === "1" ? (
                            "登録済み"
                          ) : (
                            <ConfirmButton
                              size="sm"
                              buttonLabel={"登録"}
                              dialogTitle="確認"
                              dialogBody={
                                <>ユーザー{item.disp_name}を登録しますか？</>
                              }
                              onClick={() => onHandleRegist(item)}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <CustomPagination<UserSearchParams>
                pagination={list.pagination}
                onHandle={(t) => {
                  dispatch(getAdUserList(t));
                }}
              />
            </div>
          ) : isSearched ? (
            <div className="py-6 text-muted-foreground text-center">
              条件に合うユーザーが見つかりませんでした
            </div>
          ) : (
            <></>
          )}
        </CardContent>
      </Card>
    </UserTabsShell>
  );
};
