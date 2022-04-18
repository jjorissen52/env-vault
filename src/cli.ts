#!/usr/bin/env ts-node
import chalk from "chalk";
import { program } from "commander";
import { textSync } from "figlet";

import _config from "./config";
import { runPopulate as opPopulate } from "./vaults/op";
import { format } from "util";
import { ERROR_CODES, exit_with_error } from "./error";
import compare from "./compare";

program
  .version("0.1.0")
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
      "The config subcommand is responsible for displaying and modifying global defaults," +
        "vault defaults, and comparisons configurations."
    );

  config
    .command("locate")
    .description("shows the path to your config file")
    .action(() => console.log(_config.config_location));

  config
    .command("show")
    .description("show contents of config file")
    .argument("[comparison]", "specific comparison to view")
    .action((comparison) => {
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
    .action((name, newName, { force }) =>
      _config.copyComparison(name, newName, force)
    );

  config
    .command("rm <config-name>")
    .description("remove env comparison")
    .action((name) => _config.removeComparison(name));

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
      .action((name, { template, env, address, email, vault, record }) =>
        _config.upsertComparison(scope, {
          name,
          template_path: template,
          env_file_path: env,
          address,
          email,
          vault,
          record,
        })
      );
  }
}

{
  program
    .command("compare")
    .description(
      "compare variable declarations of an env file and template file for the given comparison"
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
        if (hint) console.info(chalk.greenBright(hint));
        process.stdout.write(
          chalk.blueBright(JSON.stringify(mismatch, null, 2))
        );
        process.exit(Number(!!fail));
      }
      console.log("👍");
    });
}

{
  program
    .command("populate")
    .description("populate an env file based on the given comparison")
    .argument("<name>", "name of comparison to run")
    .option("-f,--force", "overwrite existing file")
    .action((name, { force }) => {
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

program.parse(process.argv);
