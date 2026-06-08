import type { Config } from "jest";

const config: Config = {
  rootDir: "./",
  testEnvironment: "jsdom",
  coverageProvider: "babel",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  collectCoverageFrom: [
    "src/redux/slices/userSlice.ts",
    "src/redux/slices/uiSlice.ts",
    "src/redux/slices/ssSlice.ts",
    "src/pages/UserCreate.tsx",
    "src/pages/UserEdit.tsx",
    "src/pages/UserManage.tsx",
    "src/pages/UserTabsShell.tsx",
    "src/pages/CenterManage.tsx",
    "src/pages/CenterCreate.tsx",
    "src/pages/CenterEdit.tsx",
    "src/pages/CenterTabsShell.tsx",
    "src/pages/SS.tsx",
    "src/pages/ShareArea.tsx",
    "src/components/ss/PathBar.tsx",
    "src/components/ss/CollaborationPanel.tsx",
    "src/components/layout/Header.tsx",
    "src/components/layout/Layout.tsx",
    "src/components/layout/TabsBar.tsx",
    "src/components/layout/SideMenu.tsx",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/api/",
    "<rootDir>/src/components/ui/",
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "./tsconfig.test.json",
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    // react-router is pure ESM in node_modules; jest.mock() cannot intercept it in --experimental-vm-modules mode
    "^react-router$": "<rootDir>/__mocks__/react-router.ts",
    "^lucide-react$": "<rootDir>/test/mocks/lucideReactMock.tsx",
    // Local ESM modules: jest.mock() factory/manual mocks don't work in Node 22 + --experimental-vm-modules.
    // These must come before the generic ^@/ alias so they take precedence.
    "^@/components/ui/tabs$": "<rootDir>/src/components/ui/__mocks__/tabs.tsx",
    "^@/components/ui/sonner$": "<rootDir>/src/components/ui/__mocks__/sonner.ts",
    "^@/components/ui/dropdown-menu$": "<rootDir>/src/components/ui/__mocks__/dropdown-menu.tsx",
    "^@/components/ui/select$": "<rootDir>/src/components/ui/__mocks__/select.tsx",
    "^@/components/ui/radio-group$": "<rootDir>/src/components/ui/__mocks__/radio-group.tsx",
    "^@/components/ui/dialog$": "<rootDir>/src/components/ui/__mocks__/dialog.tsx",
    "\\.\/TabsBar\\.css\\.ts$": "<rootDir>/src/components/layout/__mocks__/TabsBar.css.ts",
    // Layout は多くのページが import するため、full-suite 実行時に他テストが実体を先に
    // ロードして ESM がキャッシュされ、SS.test の inline jest.mock が効かなくなる。
    // moduleNameMapper で常にモックへ寄せて解決を安定させる（Layout.test は ./Layout 相対 import なので実体を使う）。
    "^@/components/layout/Layout$": "<rootDir>/src/components/layout/__mocks__/Layout.tsx",
    "^@/components/common/AutoComplete/AutoCompleteMulti$": "<rootDir>/src/components/common/AutoComplete/__mocks__/AutoCompleteMulti.tsx",
    "^@/components/common/AutoComplete/AutoCompleteSingle$": "<rootDir>/src/components/common/AutoComplete/__mocks__/AutoCompleteSingle.tsx",
    "^@/components/common/Pagination/Pagination$": "<rootDir>/src/components/common/Pagination/__mocks__/Pagination.tsx",
    "^@/components/common/Confirm/ConfirmButton$": "<rootDir>/src/components/common/Confirm/__mocks__/ConfirmButton.tsx",
    "^@/components/ui/tooltip$": "<rootDir>/src/components/ui/__mocks__/tooltip.tsx",
    "^@/components/ss/PathBar$": "<rootDir>/src/components/ss/__mocks__/PathBar.tsx",
    "^@/components/ss/CollaborationPanel$": "<rootDir>/src/components/ss/__mocks__/CollaborationPanel.tsx",
    "^@/components/common/BoxManager/BoxManager$": "<rootDir>/src/components/common/BoxManager/__mocks__/BoxManager.tsx",
    "^@/components/common/LoadingOverlay$": "<rootDir>/src/components/common/__mocks__/LoadingOverlay.tsx",
    "^@/hooks/useBoxExplorer$": "<rootDir>/src/hooks/__mocks__/useBoxExplorer.ts",
    "^@/redux/slices/userSlice$": "<rootDir>/src/redux/slices/__mocks__/userSlice.ts",
    "^@/redux/slices/permissionSlice$": "<rootDir>/src/redux/slices/__mocks__/permissionSlice.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test-utils$": "<rootDir>/test/test-utils/index.ts",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/mocks/assetMock.js",
    // Vanilla Extract (.css.ts) は ts-jest で処理させるため mapper 不要（@vanilla-extract/css は setup で mock）
    "\\.(css|scss)$": "<rootDir>/test/mocks/styleMock.js",
  },
};

export default config;
