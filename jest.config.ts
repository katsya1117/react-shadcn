import type { Config } from "jest";

const config: Config = {
  rootDir: "./",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  collectCoverageFrom: [
    "src/redux/slices/userSlice.ts",
    "src/components/pages/UserCreate.tsx",
    "src/components/pages/UserManage.tsx",
    "src/components/pages/UserTabsShell.tsx",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/api/",
    "<rootDir>/src/components/ui/",
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test-utils$": "<rootDir>/test/test-utils/index.ts",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/mocks/fileMocks.js",
    "\\.(css|scss)$": "<rootDir>/test/mocks/fileMock.js",
  },
};

export default config;
