import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.test.json", diagnostics: false },
    ],
  },
  moduleNameMapper: {
    // パスエイリアス
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test-utils$": "<rootDir>/test/test-utils/index.ts",
    // 外部パッケージのスタブ（実体は test/mocks/）
    "^react-router$": "<rootDir>/test/mocks/react-router.ts",
    "^lucide-react$": "<rootDir>/test/mocks/lucideReactMock.tsx",
    "^@vanilla-extract/css$": "<rootDir>/test/mocks/vanillaExtractMock.js",
    // CSS / アセットのスタブ
    "\\./TabsBar\\.css\\.ts$": "<rootDir>/src/components/layout/__mocks__/TabsBar.css.ts",
    "\\.(css|scss)$": "<rootDir>/test/mocks/styleMock.js",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/mocks/assetMock.js",
  },
  // カバレッジ対象は明示的に列挙（テスト済みのファイルだけを計測する）
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
    "src/pages/ssHelpers.ts",
    "src/pages/ShareArea.tsx",
    "src/pages/userEditSchema.ts",
    "src/components/ss/PathBar.tsx",
    "src/components/ss/CollaborationPanel.tsx",
    "src/components/ss/CollaboratorRow.tsx",
    "src/components/layout/Header.tsx",
    "src/components/layout/Layout.tsx",
    "src/components/layout/TabsBar.tsx",
    "src/components/layout/SideMenu.tsx",
  ],
};

export default config;
