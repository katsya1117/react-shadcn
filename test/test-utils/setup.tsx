import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * render() に userEvent をひとまとめにした基本ヘルパー。
 * クリックや入力を伴うテストはこの user を使う。
 * Redux ストアが必要なら setupWithStore を使う。
 *
 * @example
 * const { user } = setup(<PathBar {...props} />);
 * await user.click(screen.getByLabelText("戻る"));
 */
export const setup = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => {
  const user = userEvent.setup();
  return { user, ...render(ui, options) };
};
