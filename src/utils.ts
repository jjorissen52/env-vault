import fs from "fs";
import { ERROR_CODES, exit_with_error } from "./error";

export type PathType = "file" | "dir" | null;

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

/***
 * Parse a raw string for lines matching the pattern of an environment variable declaration
 * Example:
 *  FOO=bar # match
 *  _FOO=bar # match
 *  _FOO1=bar # match
 *  foo=bar # no match
 * @param raw: raw string
 */
// @ts-ignore
function getDefinedVars(raw: string): { key: string; value: string }[] {
  const declarations = Array.from(raw.match(/([A-Z_][A-Z_0-9]+)=.*/g) ?? []);
  return declarations
    .map((d) => d.split("="))
    .map(([key, value]) => ({ key, value }));
}

/***
 * Return values in second set that are not in the first set
 * @param set1
 * @param set2
 */
// @ts-ignore
function setDifference(set1: Set<string>, set2: Set<string>): string[] {
  return Array.from(set2.values()).filter((v) => !set1.has(v));
}
