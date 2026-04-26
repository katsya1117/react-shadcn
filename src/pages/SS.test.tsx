import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

import { UrlPath } from "@/constant/UrlPath";
import { setup } from "@test-utils";
import { SS } from "./SS";

describe("SS", () => {
  it("ShareArea で許可していない folderId 直打ちは ShareArea へリダイレクトする", () => {
    setup(
      <MemoryRouter initialEntries={["/job/ShareArea/0"]}>
        <Routes>
          <Route path={UrlPath.ShareArea} element={<div>ShareArea</div>} />
          <Route path={UrlPath.SS} element={<SS />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("ShareArea")).toBeInTheDocument();
  });
});
