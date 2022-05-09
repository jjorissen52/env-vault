import program from "../cli";
import type { ErrorCode } from "~/error";
import { Config } from "~/config";
import { noop } from "lodash";

/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */

jest.mock("~/error", () => {
  const { ERROR_CODES, ERROR_NAMES, ErrorCode, ...others } =
    jest.requireActual("~/error");
  return {
    ERROR_CODES,
    ERROR_NAMES,
    ...others,
    exit_with_error: jest.fn(
      (
        message: string,
        code: ErrorCode = ERROR_CODES.UNSPECIFIED_ERROR
      ): never => {
        throw new Error(
          `[ERR(code=${code}): ${ERROR_NAMES[code]}]\n${message}`
        );
      }
    ),
  };
});

const log: string[] = [];
jest.spyOn(console, "log").mockImplementation((arg: string) => log.push(arg));
jest.spyOn(console, "info").mockImplementation(noop); // don't want to see these during tests
jest.spyOn(process, "exit").mockImplementation((code = 0): never => {
  throw new Error(`Exit(${code})`);
}); // don't want to see these during tests

export function run(
  command: string | string[],
  init_config = true
): {
  config: Config["config"] | null;
  output: string | null;
} {
  const input = Array.isArray(command) ? command : command.split(" ");
  program.parse(["", "", ...input]);
  const output = log.join("\n") || null;
  log.length = 0;
  return { config: init_config ? new Config().config : null, output };
}
