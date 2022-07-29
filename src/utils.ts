import fs from "fs";
import { ERROR_CODES, exit_with_error } from "./error";
import { spawnSync } from "child_process";

export type PathType = "file" | "dir" | null;

export function read(path: string): string {
  let error;
  switch (getPathType(path)) {
    case "dir":
      error = `could not read path = ${path}; location refers to a directory.`;
      break;
    case null:
      error = `could not read path = ${path}; no such file or directory.`;
      break;
  }
  if (error) exit_with_error(error, ERROR_CODES.FILE_READ_FAILURE);
  try {
    return fs.readFileSync(path).toString();
  } catch (e) {
    exit_with_error(
      `could not read file; err = ${e}`,
      ERROR_CODES.FILE_READ_FAILURE
    );
  }
}

export function write(path: string, contents: string, force = true): void {
  let error;
  switch (getPathType(path)) {
    case "dir":
      error = `could not write to path ${path}; location refers to a directory.`;
      break;
    case "file":
      if (force) break;
      error = `could not write to path  ${path}; file already exists.`;
      break;
  }
  if (error) exit_with_error(error, ERROR_CODES.FILE_WRITE_FAILURE);
  try {
    fs.writeFileSync(path, contents);
  } catch (e) {
    exit_with_error(
      `could not write to file; err = ${e}`,
      ERROR_CODES.FILE_WRITE_FAILURE
    );
  }
}

export function getPathType(path: string): PathType {
  try {
    const stats = fs.lstatSync(path);
    if (stats.isDirectory()) return "dir";
    if (stats.isFile()) return "file";
  } catch (e) {
    return null;
  }
  return null;
}

export function spawn(
  ...args: Parameters<typeof spawnSync>
): Omit<ReturnType<typeof spawnSync>, "error"> {
  const [command, _args, options] = args;
  // default timeout is 2 minutes
  const timeout = options?.timeout ?? 120_000;
  const { error, ...others } = spawnSync(command, _args, {
    ...options,
    timeout,
  });
  if (error) {
    exit_with_error(
      `could not run command ${command}; err = ${error}`,
      ERROR_CODES.SHELL_EXECUTION_ERROR
    );
  }
  return others;
}
