import { jest } from "@jest/globals";
import { screen, fireEvent } from "@testing-library/react";
import { setup } from "@test-utils";
import { CollaboratorRow } from "./CollaboratorRow";
import type { CollaborationListItem, RoleType } from "@/types/ss";

jest.mock("@/components/ui/select");
jest.mock("@/components/ui/tooltip");
jest.mock("@/components/ui/dialog");

const makeItem = (
  overrides: Partial<CollaborationListItem["collaborator"]> = {},
  itemOverrides: Partial<CollaborationListItem> = {},
): CollaborationListItem => ({
  collaborator: {
    id: "c1",
    type: "user",
    name: "Alice",
    role: "viewer" as RoleType,
    canEdit: true,
    sourceFolderId: "f1",
    ...overrides,
  },
  isInherited: false,
  canRemove: true,
  ...itemOverrides,
});

const renderRow = (item: CollaborationListItem, isBusy = false) => {
  const onUpdateRole = jest.fn();
  const onRemove = jest.fn();
  const result = setup(
    <CollaboratorRow
      item={item}
      isBusy={isBusy}
      onUpdateRole={onUpdateRole}
      onRemove={onRemove}
    />,
  );
  return { ...result, onUpdateRole, onRemove };
};

// --------------------------------------------------------
// 表示
// --------------------------------------------------------
describe("CollaboratorRow 表示", () => {
  test("コラボレーター名が表示される", () => {
    renderRow(makeItem());
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  test("canRemove=false のとき削除ボタンが表示されない", () => {
    renderRow(makeItem({}, { canRemove: false, isInherited: false }));
    expect(screen.queryByLabelText("権限を削除")).not.toBeInTheDocument();
  });

  test("canRemove=true のとき削除ボタンが表示される", () => {
    renderRow(makeItem());
    expect(screen.getByLabelText("権限を削除")).toBeInTheDocument();
  });

  test("isInherited=true かつ sourcePath がある場合、sourcePath が表示される", () => {
    const item = makeItem(
      { sourceFolderId: "f0" },
      { isInherited: true, sourcePath: "\\share\\qms" },
    );
    renderRow(item);
    expect(screen.getAllByText("\\share\\qms").length).toBeGreaterThan(0);
  });

  test("canRemove=false のときロールは Select ではなく Badge 表示", () => {
    const item = makeItem({}, { canRemove: false });
    renderRow(item);
    // select モックがないので Badge の text で確認
    expect(screen.getByText("Viewer")).toBeInTheDocument();
  });
});

// --------------------------------------------------------
// 削除操作
// --------------------------------------------------------
describe("CollaboratorRow 削除", () => {
  test("削除ボタン → 確認ダイアログ OK で onRemove が呼ばれる", async () => {
    const { onRemove } = renderRow(makeItem());
    fireEvent.click(screen.getByLabelText("権限を削除"));
    // dialog モックは open 時に children を描画するため、OK ボタンが現れる
    const okBtn = await screen.findByRole("button", { name: "OK" });
    fireEvent.click(okBtn);
    expect(onRemove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1", name: "Alice" }),
    );
  });

  test("isBusy=true のとき削除ボタンが disabled", () => {
    renderRow(makeItem(), true);
    expect(screen.getByLabelText("権限を削除")).toBeDisabled();
  });
});

// --------------------------------------------------------
// ロール変更
// --------------------------------------------------------
describe("CollaboratorRow ロール変更", () => {
  test("Select でロールを変更すると確認ダイアログが開く", async () => {
    renderRow(makeItem({ role: "viewer" }));
    const select = screen.getByTestId("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "editor" } });
    expect(await screen.findByText(/ロールを editor に変更/i)).toBeInTheDocument();
  });

  test("既存ロールと同じ値を選んだ場合はダイアログが開かない", () => {
    renderRow(makeItem({ role: "viewer" }));
    const select = screen.getByTestId("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "viewer" } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
