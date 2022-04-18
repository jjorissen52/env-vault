declare module "is-invalid-path" {
  const isInvalidPath: (path?: string) => boolean;
  export default isInvalidPath;
}

declare type VaultDefaultsBase = {
  name: string;
};

declare type ComparisonBase = {
  vault_type: VaultDefaults["name"];
  name: string;
  template_path: string;
  env_file_path: string;
};

// fully qualified comparison
declare type Comparison = FullOnePasswordCmp;
// minimally qualified comparison
declare type PartialCmp = PartialOnePasswordCmp;

declare type VaultDefaults = OnePasswordDefaults;

declare type VaultDefaultRecord<T extends VaultDefaults> = Record<T["name"], T>;

declare type ConfigType = {
  default_env_file_path: string;
  default_template_path: string;
  vault_defaults: VaultDefaultRecord;
  comparisons: Record<string, Comparison>;
};

declare interface ComparisonResolver<
  V extends VaultDefaults,
  T extends PartialCmp,
  C extends Comparison
> {
  resolveComparison: (
    shared_defaults: Omit<ConfigType, "vault_defaults" | "comparisons">,
    defaults: VaultDefaults,
    comparison: T
  ) => C;
  validateComparison: (c: Partial<T>) => Record<string, string> | null;
}

declare type FullOnePasswordCmp = ComparisonBase & {
  address: string;
  email: string;
  vault: string;
  record: string;
};

declare type RequiredOnePasswordCmp = Pick<
  FullOnePasswordCmp,
  "name" | "record"
>;

// minimally qualified comparison
declare type PartialOnePasswordCmp = RequiredOnePasswordCmp &
  Partial<FullOnePasswordCmp>;

declare type OnePasswordDefaults = VaultDefaultsBase & {
  name: "1password";
  vault?: string;
  address?: string;
  email?: string;
};
