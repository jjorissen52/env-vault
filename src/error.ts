import chalk from "chalk";

export const ERROR_CODES = {
  UNSPECIFIED_ERROR: 1,
  INVALID_CONFIG_PATH: 2,
  INVALID_CONFIG_SETTING: 3,
  INVALID_COMPARISON_SETTING: 4,
  INVALID_VAULT_TYPE: 5,
  NO_SUCH_COMPARISON: 6,
  COMPARISON_ALREADY_EXISTS: 7,
  FILE_READ_FAILURE: 8,
  FILE_WRITE_FAILURE: 9,
  SHELL_EXECUTION_ERROR: 10,
  SYMLINK_CYCLE_DETECTED: 11,
  OP_NOT_INSTALLED: 101,
  OP_LOGIN_FAILURE: 102,
  OP_UNEXPECTED_OUTPUT: 103,
  OP_ACCOUNT_ADD_FAILURE: 104,
  OP_POPULATE_FAILURE: 105,
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
    chalk.red(`[ERR(code=${code}): ${ERROR_NAMES[code]}]\n${message}`)
  );
  process.exit(code);
}
