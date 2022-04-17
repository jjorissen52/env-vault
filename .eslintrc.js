// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "@typescript-eslint/ban-ts-comment": ["off"],
    "@typescript-eslint/no-unused-vars": ["off"],
  },
  overrides: [
    {
      files: ["*.ts"],
      rules: {
        // typescript itself has a no-undef rule https://typescript-eslint.io/docs/linting/troubleshooting/
        "no-undef": "off",
        // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/explicit-module-boundary-types.md#configuring-in-a-mixed-jsts-codebase
        "@typescript-eslint/explicit-module-boundary-types": 2,
      },
    },
  ],
};
