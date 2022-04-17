import { readFileSync, writeFileSync, existsSync } from "fs";
import chalk from "chalk";
import path from "path";
import { ERROR_CODES, exit_with_error } from "./error";
import { getPathType } from "./utils";
import { clone, merge } from "lodash";
// @ts-ignore
import isInvalidPath from "is-invalid-path";

const CONFIG_NAME = "synv.json";
const DEFAULT_CONFIG_DIR = path.resolve(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"] ?? "HOME",
  ".config/"
);
const INDICATED_CONFIG_DIR = process.env.SYNV_CONFIG_DIR ?? DEFAULT_CONFIG_DIR;

// fully qualified comparison
export type Comparison = {
  name: string;
  template_path: string;
  env_file_path: string;
  address: string;
  email: string;
  vault: string;
  record: string;
};
type RequiredCompParts = Pick<Comparison, "name" | "record">;

// minimally qualified comparison
export type PartialComparison = RequiredCompParts & Partial<Comparison>;

export type ConfigType = {
  default_env_file_path: string;
  default_template_path: string;
  default_vault?: string;
  default_address?: string;
  default_email?: string;
  comparisons: Record<string, Comparison>;
};

function resolveComparison(
  _config: Omit<ConfigType, "comparisons">,
  comparison: PartialComparison
): Comparison {
  const {
    default_env_file_path,
    default_template_path,
    default_vault,
    default_address,
    default_email,
  } = clone(_config);
  const { name, template_path, env_file_path, address, email, vault, record } =
    clone(comparison);

  return {
    name: name ?? "",
    address: address ?? default_address ?? "",
    email: email ?? default_email ?? "",
    vault: vault ?? default_vault ?? "",
    record: record ?? "",
    template_path: path.resolve(template_path ?? default_template_path),
    env_file_path: path.resolve(env_file_path ?? default_env_file_path),
  };
}

function validateComparison({
  name,
  template_path = "",
  env_file_path = "",
  address,
  email,
  vault,
  record,
}: Comparison): Record<string, string> | null {
  const errors = <Record<string, string>>{};
  if (!name) errors.name = "name is required";
  if (!address) errors.address = "address is required (no default set)";
  if (!email) errors.email = "address is required (no default set)";
  if (!vault) errors.vault = "vault is required (no default set)";
  if (!record) errors.record = "record is required";
  if (isInvalidPath(template_path))
    errors.template_path = `template_path must be a valid path (got: ${template_path})`;
  if (isInvalidPath(env_file_path))
    errors.env_file_path = `env_file_path must be a valid path (got: ${env_file_path})`;
  if (Object.keys(errors).length) return errors;
  return null;
}

class BaseConfig {
  get config_location(): string {
    switch (getPathType(INDICATED_CONFIG_DIR)) {
      case "dir":
        return path.resolve(INDICATED_CONFIG_DIR, CONFIG_NAME);
      case "file":
        exit_with_error(
          `${INDICATED_CONFIG_DIR} is a file; please indicate a directory to save config by setting SYNV_CONFIG_DIR in your environment`,
          ERROR_CODES.INVALID_CONFIG_PATH
        );
        throw new Error("unreachable");
      case null:
      default:
        exit_with_error(
          `${INDICATED_CONFIG_DIR} is not a valid config directory`,
          ERROR_CODES.INVALID_CONFIG_PATH
        );
    }
    throw new Error("unreachable");
  }
}

type PartialConfigSelector = Partial<{
  defaults: boolean;
  comparisons: boolean;
}>;

export class Config extends BaseConfig {
  private path;
  private config: ConfigType;
  constructor() {
    super();
    this.path = this.config_location;
    this.config = {
      default_env_file_path: "./.env",
      default_template_path: "./envs/dev.env",
      comparisons: {},
    };
    if (existsSync(this.path)) {
      this.config = {
        ...this.config,
        ...JSON.parse(readFileSync(this.path, "utf-8")),
      };
    }
  }

  validate({
    default_env_file_path,
    default_template_path,
    comparisons,
  }: ConfigType): void {
    if (isInvalidPath(default_env_file_path))
      exit_with_error(
        `${default_env_file_path} is not a valid file path`,
        ERROR_CODES.INVALID_CONFIG_SETTING
      );
    if (isInvalidPath(default_template_path))
      exit_with_error(
        `${default_template_path} is not a valid file path`,
        ERROR_CODES.INVALID_CONFIG_SETTING
      );
    const comparisonErrors = <Record<string, string>[]>Object.keys(comparisons)
      .map((key) => validateComparison(comparisons[key]))
      .filter((e) => !!e);
    if (comparisonErrors.length)
      exit_with_error(
        `comparison(s) could not be validated:\n${JSON.stringify(
          comparisonErrors,
          null,
          2
        )}`,
        ERROR_CODES.INVALID_COMPARISON_SETTING
      );
  }

  save(): void {
    const { comparisons, ...defaults } = this.config;
    this.config.comparisons = Object.keys(comparisons).reduce((accum, key) => {
      accum[key] = resolveComparison(defaults, comparisons[key]);
      return accum;
    }, <Record<string, Comparison>>{});
    this.validate(this.config);
    writeFileSync(this.path, JSON.stringify(this.config, null, 2));
    console.info(chalk.greenBright("Config saved successfully."));
  }

  get({ defaults = true, comparisons = true }: PartialConfigSelector = {}):
    | Omit<ConfigType, "comparisons">
    | Pick<ConfigType, "comparisons">
    | ConfigType
    | { [n: string]: never } {
    let retrieved = {};
    const { comparisons: _comparisons, ..._defaults } = clone(this.config);
    if (defaults) retrieved = { ...retrieved, ..._defaults };
    if (comparisons)
      retrieved = { ...retrieved, comparisons: _comparisons ?? {} };
    return retrieved;
  }

  set({ ...config }: Partial<ConfigType>): void {
    Object.keys(config).forEach((key) => {
      // @ts-ignore
      this.config[key as keyof ConfigType] =
        key !== "comparisons"
          ? String(config[key as keyof ConfigType] ?? "")
          : config[key];
    });
  }

  show({
    defaults = true,
    comparisons = true,
  }: PartialConfigSelector = {}): void {
    console.log(JSON.stringify(this.get({ defaults, comparisons }), null, 2));
  }

  upsertComparison(comparison: PartialComparison): void {
    const { comparisons, ...defaults } = this.config;
    const merged = merge(comparisons[comparison.name], comparison);
    this.config.comparisons[comparison.name] = resolveComparison(
      defaults,
      merged
    );
    this.save();
  }

  getComparison(name: string): Comparison {
    if (name in this.config.comparisons) {
      return clone(this.config.comparisons[name]);
    }
    exit_with_error(
      `Comparison named ${name} does not exist`,
      ERROR_CODES.NO_SUCH_COMPARISON
    );
    throw new Error("unreachable");
  }

  removeComparison(name: string): void {
    if (name in this.config.comparisons) {
      delete this.config.comparisons[name];
      this.save();
      return;
    }
    exit_with_error(
      `Comparison named ${name} does not exist`,
      ERROR_CODES.NO_SUCH_COMPARISON
    );
  }

  copyComparison(name: string, newName: string, force = false): void {
    if (name in this.config.comparisons) {
      if (!force && newName in this.config.comparisons) {
        exit_with_error(
          `Comparison named ${newName} already exists`,
          ERROR_CODES.COMPARISON_ALREADY_EXISTS
        );
      }
      this.config.comparisons[newName] = clone(this.config.comparisons[name]);
      this.save();
      return;
    }
    exit_with_error(
      `Comparison named ${name} does not exist`,
      ERROR_CODES.NO_SUCH_COMPARISON
    );
  }
}

const config = new Config();

export default config;
