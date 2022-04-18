import chalk from "chalk";

export const ERROR_CODES = {
  UNSPECIFIED_ERROR: 1,
  INVALID_CONFIG_PATH: 2,
  INVALID_CONFIG_SETTING: 3,
  INVALID_COMPARISON_SETTING: 4,
  NO_SUCH_COMPARISON: 5,
  COMPARISON_ALREADY_EXISTS: 6,
  OP_NOT_INSTALLED: 7,
  OP_LOGIN_FAILURE: 8,
  OP_UNEXPECTED_OUTPUT: 9,
  OP_ACCOUNT_ADD_FAILURE: 10,
  OP_POPULATE_FAILURE: 11,
  ENV_FILE_WRITE_FAILURE: 12,
} as const;
export type ErrorName = keyof typeof ERROR_CODES;
export type ErrorCode = typeof ERROR_CODES[ErrorName];
export const ERROR_NAMES = Object.keys(ERROR_CODES).reduce((accum, name) => {
  accum[ERROR_CODES[name as ErrorName]] = name as ErrorName;
  return accum;
}, <Record<ErrorCode, ErrorName>>{});

export function exit_with_error(
  message: string,
  code: ErrorCode = ERROR_CODES.UNSPECIFIED_ERROR
): never {
  console.error(
    chalk.red(`[ERR(code=${code}): ${ERROR_NAMES[code]}] ${message}`)
  );
  process.exit(code);
}
