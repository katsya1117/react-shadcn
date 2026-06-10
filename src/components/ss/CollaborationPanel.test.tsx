import { jest } from "@jest/globals";
import { screen, fireEvent } from "@testing-library/react";
import { setup } from "@test-utils";
import { CollaborationPanel } from "./CollaborationPanel";
import type { CollaborationListItem, RoleType } from "@/types/ss";

// 非同期テストの読み方は test/README.md「7. 非同期テスト」を参照（操作は await user.click）。
// 共有モック（src/**/__mocks__）を有効化する。
// ※ ConfirmButton は実体のまま使う（「ボタン→確認ダイアログOK」の2段階フローを検証するため）。
//   その確認ダイアログ（ui/dialog）だけモックして open 時に中身を描画させる。
jest.mock("@/components/ui/select");
jest.mock("@/components/ui/tooltip");
jest.mock("@/components/ui/dialog");
jest.mock("@/components/common/AutoComplete/AutoCompleteSingle");

type Props = React.ComponentProps<typeof CollaborationPanel>;

const baseProps: Props = {
  folderName: "対象フォルダ",
  collaborators: [],
  isBusy: false,
  selectedCollaborator: null,
  selectedRole: "viewer",
  onSelectedCollaboratorChange: jest.fn(),
  onSelectedRoleChange: jest.fn(),
  onAddCollaborator: jest.fn(),
  onUpdateCollaboratorRole: jest.fn(),
  onRemoveCollaborator: jest.fn(),
};

const makeItem = (
  overrides: Partial<CollaborationListItem["collaborator"]> = {},
  itemOverrides: Partial<CollaborationListItem> = {},
): CollaborationListItem => ({
  collaborator: {
    id: "c1",
    type: "user",
    name: "User One",
    role: "viewer" as RoleType,
    canEdit: true,
    sourceFolderId: "f1",
    ...overrides,
  },
  isInherited: false,
  canRemove: true,
  ...itemOverrides,
});

const renderPanel = (overrides: Partial<Props> = {}) =>
  setup(<CollaborationPanel {...baseProps} {...overrides} />);

// Select モックはすべて data-testid="select" で並ぶ。
// 先頭は「コラボレーター追加」フォームのロール選択、その後にコラボレータ行のロール選択が続く。
const getAddRoleSelect = () => screen.getAllByTestId("select")[0];
const getRowRoleSelect = (rowIndex = 0) =>
  screen.getAllByTestId("select")[rowIndex + 1];

describe("CollaborationPanel", () => {
  it("folderName をタイトルに表示する", () => {
    renderPanel({ folderName: "My Folder" });
    expect(screen.getByText("My Folder")).toBeInTheDocument();
  });

  it("isListLoading=true のときスケルトンを表示し行は出さない", () => {
    renderPanel({ isListLoading: true });
    expect(
      screen.queryByText("コラボレーターは設定されていません"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("User One")).not.toBeInTheDocument();
  });

  it("collaborators が空のとき空メッセージを表示する", () => {
    renderPanel({ collaborators: [] });
    expect(
      screen.getByText("コラボレーターは設定されていません"),
    ).toBeInTheDocument();
  });

  it("直接コラボ（user）を行として表示する", () => {
    renderPanel({ collaborators: [makeItem()] });
    expect(screen.getByText("User One")).toBeInTheDocument();
    expect(screen.getByTestId("user")).toBeInTheDocument();
  });

  it("department タイプは Building2 アイコンを表示する", () => {
    renderPanel({
      collaborators: [makeItem({ type: "department", name: "Dept A" })],
    });
    expect(screen.getByTestId("building2")).toBeInTheDocument();
  });

  it("継承コラボ（sourcePath あり）は継承元パスと CornerDownRight を表示する", () => {
    renderPanel({
      collaborators: [
        makeItem({}, { isInherited: true, sourcePath: "\\share\\parent" }),
      ],
    });
    expect(screen.getByTestId("corner-down-right")).toBeInTheDocument();
    expect(screen.getByText("\\share\\parent")).toBeInTheDocument();
  });

  it("canRemove=false のとき EyeOff と Badge を表示し削除ボタンを出さない", () => {
    renderPanel({
      collaborators: [
        makeItem({ role: "editor", canEdit: false }, { canRemove: false }),
      ],
    });
    expect(screen.getByTestId("eye-off")).toBeInTheDocument();
    // 削除（X）アイコンは出ない
    expect(screen.queryByTestId("x")).not.toBeInTheDocument();
    // 行に編集 Select が無く、追加フォームの Select だけが残る
    expect(screen.getAllByTestId("select")).toHaveLength(1);
  });

  it("canRemove=false で未知のロールは getRoleLabel フォールバック（role 文字列）を表示する", () => {
    renderPanel({
      collaborators: [
        makeItem({ role: "owner" as RoleType, canEdit: false }, { canRemove: false }),
      ],
    });
    expect(screen.getByText("owner")).toBeInTheDocument();
  });

  it("追加ボタン→確認ダイアログ OK で onAddCollaborator を呼ぶ", async () => {
    const onAddCollaborator = jest.fn();
    const { user } = renderPanel({
      onAddCollaborator,
      selectedCollaborator: { value: "u9", label: "User Nine" },
    });
    // ConfirmButton は「ボタン押下 → 確認ダイアログ表示 → OK 押下」の2段階フロー。
    // ② 操作1: 追加ボタン → ダイアログが open（dialog モックが中身を描画）
    await user.click(screen.getByText("追加"));
    // ② 操作2: OK → onHandle(= onAddCollaborator) が実行される
    await user.click(screen.getByText("OK"));
    expect(onAddCollaborator).toHaveBeenCalledTimes(1);
  });

  it("AutoCompleteSingle の変更で onSelectedCollaboratorChange を呼ぶ", async () => {
    const onSelectedCollaboratorChange = jest.fn();
    const { user } = renderPanel({ onSelectedCollaboratorChange });
    await user.selectOptions(screen.getByTestId("auto-complete-single"), "c1");
    expect(onSelectedCollaboratorChange).toHaveBeenCalledWith({
      value: "c1",
      label: "c1",
    });
  });

  it("追加フォームの Select 変更で onSelectedRoleChange を呼ぶ", async () => {
    const onSelectedRoleChange = jest.fn();
    const { user } = renderPanel({ onSelectedRoleChange });
    await user.selectOptions(getAddRoleSelect(), "editor");
    expect(onSelectedRoleChange).toHaveBeenCalledWith("editor");
  });

  it("行の削除ボタン→確認ダイアログ OK で onRemoveCollaborator を呼ぶ", async () => {
    const onRemoveCollaborator = jest.fn();
    const item = makeItem();
    const { user } = renderPanel({
      collaborators: [item],
      onRemoveCollaborator,
    });
    const removeButton = screen.getByTestId("x").closest("button")!;
    await user.click(removeButton);
    await user.click(screen.getByText("OK"));
    expect(onRemoveCollaborator).toHaveBeenCalledWith(item.collaborator);
  });

  it("行のロールを別の値に変更すると確認ダイアログが開き OK で onUpdateCollaboratorRole を呼ぶ", async () => {
    const onUpdateCollaboratorRole = jest.fn();
    const { user } = renderPanel({
      collaborators: [makeItem({ role: "viewer" })],
      onUpdateCollaboratorRole,
    });
    await user.selectOptions(getRowRoleSelect(), "editor");

    // ダイアログが開いて本文が表示される
    expect(screen.getByText(/ロールを Editor に変更します/)).toBeInTheDocument();

    await user.click(screen.getByText("OK"));
    expect(onUpdateCollaboratorRole).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1" }),
      "editor",
    );
  });

  it("継承コラボのロール変更ダイアログには継承元パスが表示される", async () => {
    const { user } = renderPanel({
      collaborators: [
        makeItem(
          { role: "viewer" },
          { isInherited: true, sourcePath: "\\share\\parent" },
        ),
      ],
    });
    await user.selectOptions(getRowRoleSelect(), "editor");
    expect(
      screen.getByText(/継承元コラボレーション（\\share\\parent）/),
    ).toBeInTheDocument();
  });

  it("行のロールを同じ値に変更したときは確認ダイアログを開かない", () => {
    renderPanel({ collaborators: [makeItem({ role: "viewer" })] });
    // 現在と同じ "viewer" に変更 → 早期 return で open されない
    fireEvent.change(getRowRoleSelect(), { target: { value: "viewer" } });
    expect(screen.queryByText("OK")).not.toBeInTheDocument();
  });

  it("isBusy=true でも編集可能な行は削除ボタンを描画する（busy スタイル分岐）", () => {
    renderPanel({
      isBusy: true,
      collaborators: [makeItem()],
      selectedCollaborator: { value: "u9", label: "User Nine" },
    });
    expect(screen.getByText("追加")).toBeInTheDocument();
    // 編集可能な行の削除（X）ボタンは isBusy でも存在する
    expect(screen.getByTestId("x")).toBeInTheDocument();
  });

  it("ロール変更ダイアログをキャンセルすると onUpdateCollaboratorRole を呼ばない", async () => {
    const onUpdateCollaboratorRole = jest.fn();
    const { user } = renderPanel({
      collaborators: [makeItem({ role: "viewer" })],
      onUpdateCollaboratorRole,
    });
    await user.selectOptions(getRowRoleSelect(), "editor");
    await user.click(screen.getByText("キャンセル"));
    expect(onUpdateCollaboratorRole).not.toHaveBeenCalled();
  });
});
