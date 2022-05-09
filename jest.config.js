// eslint-disable-next-line no-undef
module.exports = {
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  setupFiles: ["<rootDir>/src/testing/setup.ts"],
};
