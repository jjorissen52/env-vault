import path from "path";
import isInvalidPath from "is-invalid-path";

export const OnePasswordResolver: ComparisonResolver<
  OnePasswordDefaults,
  PartialOnePasswordCmp,
  FullOnePasswordCmp
> = {
  resolveComparison: (
    {
      default_env_file_path,
      default_template_path,
    }: Omit<ConfigType, "vault_defaults" | "comparisons">,
    {
      vault: default_vault,
      address: default_address,
      email: default_email,
    }: Omit<OnePasswordDefaults, "name">,
    {
      name,
      template_path,
      env_file_path,
      address,
      email,
      vault,
      record,
    }: PartialOnePasswordCmp
  ): FullOnePasswordCmp => {
    return {
      vault_type: "1password",
      name: name ?? "",
      address: address ?? default_address ?? "",
      email: email ?? default_email ?? "",
      vault: vault ?? default_vault ?? "",
      record: record ?? "",
      template_path: path.resolve(template_path ?? default_template_path),
      env_file_path: path.resolve(env_file_path ?? default_env_file_path),
    };
  },
  validateComparison: ({
    name,
    template_path = "",
    env_file_path = "",
    address,
    email,
    vault,
    record,
  }: Partial<FullOnePasswordCmp>): Record<string, string> | null => {
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
  },
};
