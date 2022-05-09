import path from "path";
import isInvalidPath from "is-invalid-path";
import { exec } from "child_process";
import { ERROR_CODES, exit_with_error } from "~/error";
import { blueBright, greenBright } from "chalk";
import { write, spawn } from "~/utils";

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

function checkInstalled(): void {
  const { status } = spawn("command", ["-v", "op"]);
  if (status)
    exit_with_error(
      "1password cli not available in PATH. Please make sure it's installed and added to your PATH.\n" +
        "Installation instructions can be found here: https://developer.1password.com/docs/cli/get-started#install",
      ERROR_CODES.OP_NOT_INSTALLED
    );
}

type AccountData = {
  url: string;
  email: string;
  user_uuid: string;
  shorthand: string;
};

function addAccount(address: string, email: string): void {
  console.info(
    blueBright(
      "You must authenticate the 1password CLI to access the secrets vault. \n" +
        "You will be prompted for sign-in information that can be retrieved \n" +
        `from your 1password profile: https://${address}.1password.com/profile\n`
    )
  );
  const opAccountAdd = spawn(
    "op",
    [
      "account",
      "add",
      "--address",
      address,
      "--email",
      email,
      "--shorthand",
      address,
    ],
    {
      stdio: "inherit",
    }
  );
  if (opAccountAdd.status) {
    let message = "account add failure; exiting";
    if (opAccountAdd.status) message = `${message}; \n${opAccountAdd.stdout}`;
    exit_with_error(message, ERROR_CODES.OP_LOGIN_FAILURE);
  }
}

function checkAccount(
  address: string,
  email: string,
  failfast = false
): AccountData {
  const res = spawn("op", ["account", "list", "--format", "json"]);
  if (res.status) {
    let message = "could not get account list; exiting";
    if (String(res.stderr)) message = `${message}; \n${res.stderr}`;
    exit_with_error(message, ERROR_CODES.OP_LOGIN_FAILURE);
  }
  const accounts = JSON.parse(res.stdout.toString()) as unknown;
  if (!Array.isArray(accounts))
    exit_with_error(
      `op exited with unexpected output: \n${res.stdout ?? res.stderr}`,
      ERROR_CODES.OP_UNEXPECTED_OUTPUT
    );
  const account = (accounts as AccountData[]).find(
    (a) => a.shorthand === address
  );
  if (!account) {
    if (failfast) {
      exit_with_error(
        `unable to detect account list from op`,
        ERROR_CODES.OP_ACCOUNT_ADD_FAILURE
      );
    }
    addAccount(address, email);
    return checkAccount(address, email, true);
  }
  return account;
}

function login(account: AccountData): [string, string] {
  const { user_uuid, shorthand } = account;
  const res = spawn("op", ["signin", "--account", shorthand, "--raw"], {
    stdio: ["inherit", "pipe", "pipe"],
    timeout: 120_000, // 120s
  });
  if (res.status) {
    let message = "login failure; exiting";
    if (res.stderr && String(res.stderr))
      message = `${message}; \n${res.stderr}`;
    exit_with_error(message, ERROR_CODES.OP_LOGIN_FAILURE);
    throw new Error("unreachable");
  }
  const token = String(res.stdout);
  if (!token) {
    exit_with_error("received empty login token", ERROR_CODES.OP_LOGIN_FAILURE);
    throw new Error("unreachable");
  }
  return [`OP_SESSION_${user_uuid}`, token];
}

function populate(
  session_var: string,
  session_token: string,
  { vault, record, template_path, env_file_path }: FullOnePasswordCmp,
  force = false
) {
  exec(
    `${session_var}=${session_token} VAULT="${vault}" RECORD="${record}" op inject --in-file "${template_path}"`,
    (err, stdout, stderr) => {
      if (err) {
        exit_with_error(
          `failed to populate:\n${stderr}`,
          ERROR_CODES.OP_POPULATE_FAILURE
        );
      }
      write(env_file_path, stdout, force);
      console.info(greenBright(`🎉 ${env_file_path} populated!!! 🎉`));
    }
  );
}

export function runPopulate(
  comparison: FullOnePasswordCmp,
  force = false
): void {
  const { address, email } = comparison;
  checkInstalled();
  const [session_var, session_token] = login(checkAccount(address, email));
  populate(session_var, session_token, comparison, force);
}
