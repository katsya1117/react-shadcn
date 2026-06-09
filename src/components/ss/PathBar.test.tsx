import { jest } from "@jest/globals";
import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import { setup } from "@test-utils";
import { PathBar } from "./PathBar";
import { DISPLAY_PATH_ROOT } from "@/constants/ssConstants";

// tooltip は共有モック（src/components/ui/__mocks__/tooltip.tsx）を使う。
jest.mock("@/components/ui/tooltip");

const baseProps = {
  relativePath: "",
  canGoBack: true,
  canGoForward: true,
  onGoBack: jest.fn(),
  onGoForward: jest.fn(),
  onCopyPath: jest.fn(),
  onOpenBox: jest.fn(),
  onOpenExplorer: jest.fn(),
};

const renderPathBar = (
  overrides: Partial<ComponentProps<typeof PathBar>> = {},
) => setup(<PathBar {...baseProps} {...overrides} />);

describe("PathBar", () => {
  it("relativePath が空のときルートパスのみを表示する", () => {
    renderPathBar({ relativePath: "" });
    const pathEl = screen.getByTitle(DISPLAY_PATH_ROOT);
    expect(pathEl).toBeInTheDocument();
    expect(pathEl.textContent).toBe(DISPLAY_PATH_ROOT);
  });

  it("セグメントが1つだけのときは分割表示せず displayPath をそのまま出す", () => {
    renderPathBar({ relativePath: "foo" });
    const displayPath = `${DISPLAY_PATH_ROOT}foo`;
    const pathEl = screen.getByTitle(displayPath);
    expect(pathEl).toBeInTheDocument();
    expect(pathEl.textContent).toBe(displayPath);
  });

  it("セグメントが2つのときは分割表示するが中間パスは出さない", () => {
    renderPathBar({ relativePath: "a\\b" });
    const wrapper = screen.getByTitle(`${DISPLAY_PATH_ROOT}a\\b`);
    expect(wrapper).toBeInTheDocument();
    // 先頭セグメントと末尾セグメントが表示される
    expect(wrapper.textContent).toContain("a");
    expect(wrapper.textContent).toContain("b");
  });

  it("セグメントが3つ以上のときは中間パスも表示する", () => {
    renderPathBar({ relativePath: "a\\b\\c" });
    const wrapper = screen.getByTitle(`${DISPLAY_PATH_ROOT}a\\b\\c`);
    expect(wrapper).toBeInTheDocument();
    // 中間 "\b" と末尾 "\c"
    expect(wrapper.textContent).toContain("b");
    expect(wrapper.textContent).toContain("c");
  });

  it("canGoBack=false / canGoForward=false で戻る・進むボタンが disabled になる", () => {
    renderPathBar({ canGoBack: false, canGoForward: false });
    expect(screen.getByLabelText("戻る")).toBeDisabled();
    expect(screen.getByLabelText("進む")).toBeDisabled();
  });

  it("各アクションボタンのクリックでハンドラが呼ばれる", async () => {
    const onGoBack = jest.fn();
    const onGoForward = jest.fn();
    const onCopyPath = jest.fn();
    const onOpenBox = jest.fn();
    const onOpenExplorer = jest.fn();

    const { user } = renderPathBar({
      onGoBack,
      onGoForward,
      onCopyPath,
      onOpenBox,
      onOpenExplorer,
    });

    await user.click(screen.getByLabelText("戻る"));
    await user.click(screen.getByLabelText("進む"));
    await user.click(screen.getByLabelText("パスをコピー"));
    await user.click(screen.getByLabelText("Boxで開く"));
    await user.click(screen.getByLabelText("Box Driveで開く"));

    expect(onGoBack).toHaveBeenCalledTimes(1);
    expect(onGoForward).toHaveBeenCalledTimes(1);
    expect(onCopyPath).toHaveBeenCalledTimes(1);
    expect(onOpenBox).toHaveBeenCalledTimes(1);
    expect(onOpenExplorer).toHaveBeenCalledTimes(1);
  });

  it("className を受け取ってルート要素に適用する", () => {
    const { container } = renderPathBar({ className: "custom-class" });
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
