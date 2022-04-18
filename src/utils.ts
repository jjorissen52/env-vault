import fs from "fs";
import { ERROR_CODES, exit_with_error } from "./error";

export type PathType = "file" | "dir" | null;

export function read(path: string): string {
  try {
    return fs.readFileSync(path).toString();
  } catch (e) {
    exit_with_error(
      `could not read file; err = ${e}`,
      ERROR_CODES.ENV_FILE_READ_FAILURE
    );
  }
}

export function write(path: string, contents: string): void {
  try {
    fs.writeFileSync(path, contents);
  } catch (e) {
    exit_with_error(
      `could not write to file; err = ${e}`,
      ERROR_CODES.ENV_FILE_WRITE_FAILURE
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
