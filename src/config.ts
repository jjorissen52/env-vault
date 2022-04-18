import { readFileSync, writeFileSync, existsSync } from "fs";
import chalk from "chalk";
import path from "path";
import { ERROR_CODES, exit_with_error } from "./error";
import { getPathType } from "./utils";
import { clone, merge } from "lodash";
// @ts-ignore
import isInvalidPath from "is-invalid-path";
import { OnePasswordResolver } from "./vaults/op/resolver";
import * as console from "console";

const CONFIG_NAME = "synv.json";
const DEFAULT_CONFIG_DIR = path.resolve(
  process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"] ?? "HOME",
  ".config/"
);
const INDICATED_CONFIG_DIR = process.env.SYNV_CONFIG_DIR ?? DEFAULT_CONFIG_DIR;

const ConfigResolvers = {
  "1password": OnePasswordResolver,
} as const;

type PartialConfigSelector = Partial<
  Record<"defaults" | "comparisons" | keyof typeof ConfigResolvers, boolean>
>;

export class Config {
  private path;
  private config: ConfigType;
  constructor() {
    this.path = this.config_location;
    this.config = {
      default_env_file_path: "./.env",
      default_template_path: "./envs/dev.env",
      vault_defaults: {
        "1password": {},
      },
      comparisons: {},
    };
    if (existsSync(this.path)) {
      this.config = merge(
        this.config,
        JSON.parse(readFileSync(this.path, "utf-8"))
      );
    }
  }

  get config_location(): string {
    switch (getPathType(INDICATED_CONFIG_DIR)) {
      case "dir":
        return path.resolve(INDICATED_CONFIG_DIR, CONFIG_NAME);
      case "file":
        exit_with_error(
          `${INDICATED_CONFIG_DIR} is a file; please indicate a directory to save config by setting SYNV_CONFIG_DIR in your environment`,
          ERROR_CODES.INVALID_CONFIG_PATH
        );
        break;
      case null:
      default:
        exit_with_error(
          `${INDICATED_CONFIG_DIR} is not a valid config directory`,
          ERROR_CODES.INVALID_CONFIG_PATH
        );
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
      .map((comparisonName) => {
        const { vault_type } = comparisons[comparisonName];
        const { validateComparison } = ConfigResolvers[vault_type];
        return validateComparison(comparisons[comparisonName]);
      })
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
    const { comparisons, vault_defaults, ...defaults } = this.config;
    this.config.comparisons = Object.keys(comparisons).reduce((accum, name) => {
      const { vault_type } = comparisons[name];
      const { resolveComparison } = ConfigResolvers[vault_type];
      accum[name] = resolveComparison(
        defaults,
        vault_defaults[vault_type],
        comparisons[name]
      );
      return accum;
    }, <Record<string, Comparison>>{});
    this.validate(this.config);
    writeFileSync(this.path, JSON.stringify(this.config, null, 2));
    console.info(chalk.greenBright("Config saved successfully."));
  }

  get(
    {
      defaults: getGlobalDefaults,
      comparisons: getComparisons,
      ...getVaultDefaults
    }: PartialConfigSelector = {},
    all = false
  ): Partial<ConfigType> {
    if (all) return this.config;
    let retrieved = {};
    const { comparisons, vault_defaults, ...defaults } = this.config;
    if (getGlobalDefaults) retrieved = { ...retrieved, ...defaults };
    if (getComparisons) retrieved = { ...retrieved, comparisons };
    Object.keys(getVaultDefaults).forEach((vault_type) => {
      retrieved = merge(retrieved, {
        vault_defaults: { [vault_type]: vault_defaults[vault_type] },
      });
    });
    return retrieved;
  }

  patch({ ...config }: Partial<ConfigType>): void {
    Object.keys(config).forEach((_key) => {
      const key = _key as keyof ConfigType;
      switch (key) {
        case "comparisons":
          this.config.comparisons = merge(
            this.config.comparisons,
            config[key] as ConfigType["comparisons"]
          );
          break;
        case "vault_defaults":
          this.config.vault_defaults = merge(
            this.config.vault_defaults,
            config[key]
          );
          break;
        default:
          this.config[key] = String(config[key] ?? "");
      }
    });
  }

  show(
    { defaults, comparisons, ...vault_defaults }: PartialConfigSelector = {},
    all = false
  ): void {
    console.log(
      JSON.stringify(
        this.get({ defaults, comparisons, ...vault_defaults }, all),
        null,
        2
      )
    );
  }

  upsertComparison(
    vault_type: VaultDefaults["name"],
    comparison: PartialCmp
  ): void {
    const { comparisons, vault_defaults, ...defaults } = this.config;
    const merged = merge(comparisons[comparison.name], comparison);
    const { resolveComparison } = ConfigResolvers[vault_type];
    this.config.comparisons[comparison.name] = resolveComparison(
      defaults,
      vault_defaults[vault_type],
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
      this.config.comparisons[newName] = {
        ...this.config.comparisons[name],
        name: newName,
      };
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
