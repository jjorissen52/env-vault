import { exec, spawnSync } from "child_process";
import { blueBright, greenBright } from "chalk";
import { ERROR_CODES, exit_with_error } from "./error";
import { Config } from "./config";
import { getPathType, write } from "./utils";

function checkInstalled(): void {
  const { error } = spawnSync("command", ["-v", "op"]);
  if (error)
    exit_with_error(
      "1password cli not installed. Install from https://developer.1password.com/docs/cli/get-started#install",
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
  const opAccountAdd = spawnSync(
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
  const res = spawnSync("op", ["account", "list", "--format", "json"]);
  if (res.status) {
    let message = "could not get account list; exiting";
    if (String(res.stderr)) message = `${message}; \n${res.stderr}`;
    exit_with_error(message, ERROR_CODES.OP_LOGIN_FAILURE);
  }
  const accounts = JSON.parse(res.stdout) as unknown;
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
  const res = spawnSync("op", ["signin", "--account", shorthand, "--raw"], {
    stdio: ["inherit", "pipe", "pipe"],
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
      const type = getPathType(env_file_path);
      if (type === "file") {
        !force &&
          exit_with_error(
            `failed to populate; file already exists at ${env_file_path}`,
            ERROR_CODES.OP_POPULATE_FAILURE
          );
        write(env_file_path, stdout);
      } else if (!type) {
        write(env_file_path, stdout);
      } else {
        exit_with_error(
          `failed to populate; ${env_file_path} is a directory`,
          ERROR_CODES.OP_POPULATE_FAILURE
        );
      }
      console.info(greenBright(`🎉 ${env_file_path} populated!!! 🎉`));
    }
  );
}

export function runPopulate(name: string, config: Config, force = false): void {
  const comparison = config.getComparison(name);
  const { address, email } = comparison;
  checkInstalled();
  const [session_var, session_token] = login(checkAccount(address, email));
  populate(session_var, session_token, comparison, force);
}
