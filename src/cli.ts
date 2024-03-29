#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
import { textSync } from "figlet";

import { runPopulate as opPopulate } from "./vaults/op";
import { format } from "util";
import { ERROR_CODES, exit_with_error } from "./error";
import compare from "./compare";
import { version } from "../package.json";
import { getPathType } from "./utils";
import { Config, CONFIG_NAME, INDICATED_CONFIG_DIR } from "./config";
import path from "path";

export default program
  .version(version)
  .addHelpText(
    "before",
    `${chalk.blueBright(
      textSync("ev\n   Env \n   Vault", {
        horizontalLayout: "full",
      })
    )}\n\n`
  )
  .description(
    "CLI for managing env files using 1password as a credentials manager."
  );
{
  const config = program
    .command("config")
    .description(
      "The config subcommand is responsible for displaying and modifying global defaults, " +
        "vault defaults, and comparisons configurations."
    );

  config
    .command("locate")
    .description("shows the path to your config file")
    .action(() => {
      const location = path.resolve(INDICATED_CONFIG_DIR, CONFIG_NAME);
      if (getPathType(location) === "dir")
        console.warn(
          chalk.red(
            "Your current config location is a directory.\n" +
              "env-vault will be unable to read or write config to this location."
          )
        );
      console.log(location);
    });

  config
    .command("show")
    .description("show contents of config file")
    .argument("[comparison]", "specific comparison to view")
    .action((comparison) => {
      const _config = new Config();
      if (comparison) {
        console.log(JSON.stringify(_config.getComparison(comparison), null, 2));
        return;
      }
      _config.show({}, true);
    });

  config
    .command("cp <config-name> <duplicate-config-name>")
    .description("duplicate an existing comparison config")
    .option("-f,--force", "override existing comparison with the same name")
    .action((name, newName, { force }) => {
      const _config = new Config();
      _config.copyComparison(name, newName, force);
    });

  config
    .command("rm <config-name>")
    .description("remove env comparison")
    .action((name) => {
      const _config = new Config();
      _config.removeComparison(name);
    });

  const defaults_blurb = (scope: string): string =>
    format("show or set %s defaults; use without flags to show", scope);
  const vault_blurb = (scope: string): string =>
    format("manage ev vault config for %s", scope);

  config
    .command("defaults")
    .description(defaults_blurb("global"))
    .option("--env <default-env-file-path>")
    .option("-t,--template <default-env-template-path>")
    .action(({ env, template }) => {
      const _config = new Config();
      if (![env, template].some((v) => !!v)) {
        _config.show({ defaults: true });
        return;
      }
      const updates = <Partial<ConfigType>>{};
      if (env) updates.default_env_file_path = env;
      if (template) updates.default_template_path = template;
      _config.patch(updates);
      _config.save();
    });

  {
    const scope = "1password";
    const _1password = config.command(scope).description(vault_blurb(scope));

    _1password
      .command("defaults")
      .description(defaults_blurb(scope))
      .option("-v,--vault <default-1password-vault-identifier>")
      .option("-a,--address <default-1password-address>")
      .option("-e,--email <default-1password-email-login>")
      .action(({ vault, address, email }) => {
        const _config = new Config();
        if (![vault, address, email].some((v) => !!v)) {
          _config.show({ "1password": true });
          return;
        }
        _config.patch({
          vault_defaults: { "1password": { vault, address, email } },
        });
        _config.save();
      });

    _1password
      .command("set")
      .description("add or update env comparison")
      .argument("<name>", "name of comparison to set")
      .option("-r,--record <record>")
      .option(
        "-t,--template <env-template-path>",
        "override default env template path"
      )
      .option("--env <env-file-path>", "Override default env file path")
      .option(
        "-a,--address <1password-address>",
        "Override default 1password address"
      )
      .option(
        "-e,--email <1password-email>",
        "Override default 1password email"
      )
      .option("-v,--vault <vault>", "Override default 1password vault")
      .action((name, { template, env, address, email, vault, record }) => {
        const _config = new Config();
        _config.upsertComparison(scope, {
          name,
          template_path: template,
          env_file_path: env,
          address,
          email,
          vault,
          record,
        });
      });
  }
}

{
  program
    .command("compare")
    .description(
      "compare variable declarations of an env file and template file for the given configuration"
    )
    .argument("<name>", "name of comparison to run")
    .option(
      "-r,--regex <regex>",
      "regex pattern that matches a variable declaration line"
    )
    .option(
      "-i,--ignore <regex>",
      "regex pattern for variable declaration lines to ignore"
    )
    .option(
      "-n,--no-fail",
      "emit a zero exit code even when the comparison fails"
    )
    .option(
      "-h,--hint <hint>",
      "tell the user what to do in case of failure, useful in automation"
    )
    .action((name, { fail, hint, regex, ignore }) => {
      const _config = new Config();
      const comparison = _config.getComparison(name);
      const { template_path, env_file_path } = comparison;
      const mismatch = compare(template_path, env_file_path, {
        match: regex,
        ignore,
      });
      if (mismatch) {
        console.error(
          chalk.red(
            "The environment variables defined locally differed from the indicated template."
          )
        );
        if (hint) process.stderr.write(chalk.greenBright(hint));
        console.log(chalk.blueBright(JSON.stringify(mismatch, null, 2)));
        process.exit(Number(!!fail));
      }
      process.stderr.write("👍");
    });
}

{
  program
    .command("populate")
    .description("populate an env file based on the given configuration")
    .argument("<name>", "name of comparison to run")
    .option("-f,--force", "overwrite existing file")
    .action((name, { force }) => {
      const _config = new Config();
      const comparison = _config.getComparison(name);
      const { vault_type } = comparison;
      switch (vault_type) {
        case "1password":
          opPopulate(comparison, force);
          break;
        default:
          exit_with_error(
            `named config was invalid; invalid vault_type ${vault_type}`,
            ERROR_CODES.INVALID_VAULT_TYPE
          );
      }
    });
}

// If this file is being run as a "main" module,
// we go ahead and execute the cli program.
if (require.main === module) {
  program.parse(process.argv);
}
