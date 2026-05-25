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
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test-utils$": "<rootDir>/test/test-utils/index.ts",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/mocks/assetMock.js",
    "\\.(css|scss)$": "<rootDir>/test/mocks/styleMock.js",
  },
};

export default config;
