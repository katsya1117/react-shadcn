import type { Config } from "jest";

const config: Config = {
  rootDir: "./",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  collectCoverageFrom: [
    "src/redux/slices/userSlice.ts",
    "src/redux/slices/uiSlice.ts",
    "src/pages/UserCreate.tsx",
    "src/pages/UserManage.tsx",
    "src/pages/UserTabsShell.tsx",
    "src/pages/CenterManage.tsx",
    "src/pages/CenterCreate.tsx",
    "src/pages/CenterEdit.tsx",
    "src/pages/CenterTabsShell.tsx",
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
    "\\.\/TabsBar\\.css\\.ts$": "<rootDir>/src/components/layout/__mocks__/TabsBar.css.ts",
    "^@/components/common/AutoComplete/AutoCompleteMulti$": "<rootDir>/src/components/common/AutoComplete/__mocks__/AutoCompleteMulti.tsx",
    "^@/components/common/Pagination/Pagination$": "<rootDir>/src/components/common/Pagination/__mocks__/Pagination.tsx",
    "^@/components/common/Confirm/ConfirmButton$": "<rootDir>/src/components/common/Confirm/__mocks__/ConfirmButton.tsx",
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
