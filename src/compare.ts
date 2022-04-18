import { read } from "./utils";

/***
 * Parse a raw string for lines matching the pattern of an environment variable declaration

 * @param raw: raw string
 * @param match: regex that matches a variable declaration
 * @param ignore: regex that matches an ignored variable declaration
 */
function getDefinedVars(
  raw: string,
  match: RegExp,
  ignore?: RegExp
): { key: string; value: string }[] {
  return (
    raw
      .split("\n")
      .filter((line) => !ignore || !ignore.test(line))
      .map((line) => line.match(match))
      .filter((v) => !!v)
      // @ts-ignore
      .map(([_, key, value]) => ({ key, value }))
  );
}

function setDifference(set1: Set<string>, set2: Set<string>): string[] {
  return Array.from(set2.values()).filter((v) => !set1.has(v));
}

export default function compare(
  template_file: string,
  env_file: string,
  {
    match: customMatch,
    ignore: customIgnore,
  }: { match?: string; ignore?: string } = {}
): Record<string, string | string[]> | null {
  const match = new RegExp(customMatch ?? "^([A-Z_][A-Z_0-9]+)=([^#]*)");
  const ignore = customIgnore ? new RegExp(customIgnore) : undefined;
  const [env_declarations, template_declarations] = [env_file, template_file]
    .map(read)
    .map(
      (raw) => new Set(getDefinedVars(raw, match, ignore).map(({ key }) => key))
    );
  const extra_env_declarations = setDifference(
    template_declarations,
    env_declarations
  );
  const extra_template_declarations = setDifference(
    env_declarations,
    template_declarations
  );
  const results = <Record<string, string | string[]>>{};
  if (extra_env_declarations.length || extra_template_declarations.length) {
    results.env = env_file;
    results.template = template_file;
    if (extra_env_declarations.length)
      results.extra_env_declarations = [
        `// These are variables that you've defined in your env file`,
        `// but could not be found in the template file`,
        ...extra_env_declarations,
      ];
    if (extra_template_declarations.length)
      results.extra_template_declarations = [
        `// These are variables that are found in the template file but`,
        `// could not be found your env file`,
        ...extra_template_declarations,
      ];
    return results;
  }
  return null;
}
