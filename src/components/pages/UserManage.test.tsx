import type { UserInfo } from "@/api";
import { autoCompleteSliceReducer } from "@/redux/slices/autoCompleteSlice";
import { getUserList, userSliceReducer } from "@/redux/slices/userSlice";
import { screen } from "@testing-library/react";
import { createMockPagination, setupWithStore } from "@test-utils";
import UserManage from "./UserManage";

const mockedGetUserList = getUserList as unknown as jest.MockedFunction<
  typeof getUserList
>;

const reducers = {
  user: userSliceReducer,
  autoComplete: autoCompleteSliceReducer,
};
const baseUserState = userSliceReducer(undefined, { type: "@@INIT" });
const baseAutoCompleteState = autoCompleteSliceReducer(undefined, {
  type: "@@INIT",
});
const basePreloadedState = {
  user: baseUserState,
  autoComplete: baseAutoCompleteState,
};

jest.mock("@/redux/slices/userSlice", () => {
  const actual = jest.requireActual("@/redux/slices/userSlice");
  return {
    ...actual,
    userSelector: {
      ...actual.userSelector,
      searchConditionSelector: actual.userSelector.userSearchConditionSelector,
    },
    getUserList: jest.fn((arg: unknown) => ({
      type: "getUserList",
      payload: arg,
    })),
  };
});

describe("UserManage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("初期表示（未検索）のときは、検索結果やメッセージが表示されない", () => {
    setupWithStore(<UserManage />, {
      reducers,
      preloadedState: {
        ...basePreloadedState,
        user: {
          ...baseUserState,
          list: { ...baseUserState.list, searchCondition: undefined, data: undefined },
          adList: {
            ...baseUserState.adList,
            searchCondition: undefined,
            data: undefined,
          },
        },
      },
    });

    // 「該当するユーザー...」も「検索結果」テーブルも出ていないことを確認
    expect(screen.queryByText("検索結果")).not.toBeInTheDocument();
    expect(
      screen.queryByText("該当するユーザーが見つかりませんでした。"),
    ).not.toBeInTheDocument();
  });

  it("検索ボタンで getUserList を dispatch する", async () => {
    const { user, dispatchSpy } = setupWithStore(<UserManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });
    await user.type(screen.getByLabelText("表示名"), "disp");
    await user.type(screen.getByLabelText("ユーザーID"), "uid");
    await user.type(screen.getByLabelText("メールアドレス"), "mail");

    await user.click(screen.getByText("検索"));

    expect(getUserList).toHaveBeenCalledWith(
      expect.objectContaining({
        user_name: "disp",
        user_account: "uid",
        user_email: "mail",
      }),
    );
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it("検索結果なしのメッセージを表示する", () => {
    setupWithStore(<UserManage />, {
      reducers,
      preloadedState: {
        ...basePreloadedState,
        user: {
          ...baseUserState,
          searchResultDisp: { ...baseUserState.searchResultDisp, settingSearched: true },
          list: { ...baseUserState.list, searchCondition: {}, data: undefined },
          adList: {
            ...baseUserState.adList,
            searchCondition: undefined,
            data: undefined,
          },
        },
      },
    });
    expect(
      screen.getByText("該当するユーザーが見つかりませんでした。"),
    ).toBeInTheDocument();
  });

  it("items が undefined のときは検索結果なしメッセージを表示する", () => {
    setupWithStore(<UserManage />, {
      reducers,
      preloadedState: {
        ...basePreloadedState,
        user: {
          ...baseUserState,
          searchResultDisp: { ...baseUserState.searchResultDisp, settingSearched: true },
          list: {
            ...baseUserState.list,
            searchCondition: {},
            data: { items: undefined as any, pagination: createMockPagination() } as any,
          },
        },
      },
    });
    expect(
      screen.getByText("該当するユーザーが見つかりませんでした。"),
    ).toBeInTheDocument();
  });

  it("検索結果を表示し、一覧にデータが出ることを確認する", () => {
    const mockUser = {
      user_cd: "u001",
      disp_name: "User 1",
      email: "u1@example.com",
    } as unknown as UserInfo;

    setupWithStore(<UserManage />, {
      reducers,
      preloadedState: {
        ...basePreloadedState,
        user: {
          ...baseUserState,
          searchResultDisp: { ...baseUserState.searchResultDisp, settingSearched: true },
          list: {
            ...baseUserState.list,
            searchCondition: {},
            data: {
              items: [mockUser],
              data: [mockUser],
              pagination: createMockPagination(),
            },
          },
          adList: {
            ...baseUserState.adList,
            searchCondition: undefined,
            data: undefined,
          },
        },
      },
    });

    expect(screen.getByText("User 1")).toBeInTheDocument();
    const selectLink = screen.getByRole("link", { name: "選択" });
    expect(selectLink).toBeInTheDocument();
    expect(selectLink).toHaveAttribute(
      "href",
      expect.stringContaining("/manage/User/u001"),
    );
  });

  it("box_user_id があるときはマークを表示する", () => {
    const mockUser = {
      user_cd: "u002",
      disp_name: "User 2",
      email: "u2@example.com",
      box_user_id: "box-1",
    } as unknown as UserInfo;

    setupWithStore(<UserManage />, {
      reducers,
      preloadedState: {
        ...basePreloadedState,
        user: {
          ...baseUserState,
          searchResultDisp: {
            ...baseUserState.searchResultDisp,
            settingSearched: true,
          },
          list: {
            ...baseUserState.list,
            searchCondition: {},
            data: {
              items: [mockUser],
              data: [mockUser],
              pagination: createMockPagination(),
            },
          },
        },
      },
    });

    expect(screen.getByText(/&#x3007;|○/)).toBeInTheDocument();
  });

  it("センター選択の AutoCompleteMulti が payload.auto_complete に反映される", async () => {
    const { user, dispatchSpy } = setupWithStore(<UserManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });

    // center を選択
    const centerSelect = screen.getByTestId(
      "auto-complete-multi",
    ) as HTMLSelectElement;
    await user.selectOptions(centerSelect, "center1");

    await user.click(screen.getByText("検索"));

    const dispatchedPayload = mockedGetUserList.mock.calls[0][0];
    expect(dispatchedPayload.auto_complete).toEqual([
      { value: "center1", label: "center1" },
    ]);
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it("クリアボタンで入力がリセットされる", async () => {
    const { user } = setupWithStore(<UserManage />, {
      reducers,
      preloadedState: basePreloadedState,
    });

    const nameInput = screen.getByLabelText("表示名") as HTMLInputElement;
    const userIdInput = screen.getByLabelText("ユーザーID") as HTMLInputElement;

    await user.type(nameInput, "test user");
    await user.type(userIdInput, "test-id");

    await user.click(screen.getByText("クリア"));

    expect(nameInput.value).toBe("");
    expect(userIdInput.value).toBe("");
  });

  it("ページネーション操作時に getUserList が dispatch される", async () => {
    const { user } = setupWithStore(<UserManage />, {
      reducers,
      preloadedState: {
        ...basePreloadedState,
        user: {
          ...baseUserState,
          searchResultDisp: { ...baseUserState.searchResultDisp, settingSearched: true },
          list: {
            ...baseUserState.list,
            searchCondition: {},
            data: {
              items: [
                {
                  user: { user_cd: "u001" },
                  user_cd: "u001",
                  disp_name: "User 1",
                } as UserInfo,
              ],
              data: [
                {
                  user: { user_cd: "u001" },
                  user_cd: "u001",
                  disp_name: "User 1",
                } as UserInfo,
              ],
              pagination: createMockPagination({
                total: 100,
                last_page: 10,
                current_page: 1,
              }),
            },
          },
          adList: {
            ...baseUserState.adList,
            searchCondition: undefined,
            data: undefined,
          },
        },
      },
    });

    const paginateButton = screen.getByTestId("pagination-mock");
    await user.click(paginateButton);

    expect(mockedGetUserList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });
});
