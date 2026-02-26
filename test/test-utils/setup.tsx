import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export const setup = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => {
  const user = userEvent.setup();
  return { user, ...render(ui, options) };
};
