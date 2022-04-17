#!/usr/bin/env ts-node
import chalk from "chalk";
import { program } from "commander";
import { textSync } from "figlet";

import _config, { ConfigType } from "./config";
import { runPopulate } from "./op";

program
  .version("0.1.0")
  .addHelpText(
    "before",
    `${chalk.blueBright(
      textSync("synv\n   Sync \n   Env", {
        horizontalLayout: "full",
      })
    )}\n\n`
  )
  .description(
    "CLI for managing env files using 1password as a credentials manager."
  );
{
  const config = program.command("config").description("manage config file");

  config
    .command("locate")
    .description("shows the path to your config file")
    .action(() => console.log(_config.config_location));

  config
    .command("defaults")
    .description("show or set config defaults; use without flags to show")
    .option("--env <default-env-file-path>")
    .option("--template <default-env-template-path>")
    .option("--vault <default-vault-identifier>")
    .option("--address <default-1password-address>")
    .option("--email <default-1password-login>")
    .action(({ env, template, vault, address, email }) => {
      if (![env, template, vault, address, email].some((v) => !!v)) {
        _config.show({ comparisons: false });
        return;
      }
      const updates = <Partial<ConfigType>>{};
      if (env) updates.default_env_file_path = env;
      if (template) updates.default_template_path = template;
      if (vault) updates.default_vault = vault;
      if (address) updates.default_address = address;
      if (email) updates.default_email = email;
      _config.set(updates);
      _config.save();
    });

  config
    .command("show")
    .description("show contents of config file")
    .argument("[comparison]", "specific comparison to view")
    .action((comparison) => {
      if (comparison) {
        console.log(JSON.stringify(_config.getComparison(comparison), null, 2));
        return;
      }
      _config.show();
    });

  config
    .command("upsert <config-name>")
    .description("add env comparison")
    .option("--record <record>")
    .option(
      "--template <env-template-path>",
      "Override default env template path"
    )
    .option("--env <env-file-path>", "Override default env file path")
    .option(
      "--address <1password-address>",
      "Override default 1password address"
    )
    .option("--email <1password-email>", "Override default 1password email")
    .option("--vault <vault>", "Override default 1password vault")
    .action((name, { template, env, address, email, vault, record }) =>
      _config.upsertComparison({
        name,
        template_path: template,
        env_file_path: env,
        address,
        email,
        vault,
        record,
      })
    );

  config
    .command("copy <config-name> <duplicate-config-name>")
    .description("duplicate an existing comparison config")
    .option("-f,--force", "override existing comparison with the same name")
    .action((name, newName, { force }) =>
      _config.copyComparison(name, newName, force)
    );

  config
    .command("remove <config-name>")
    .description("remove env comparison")
    .action((name) => _config.removeComparison(name));
}

{
  program
    .command("compare")
    .description(
      "Compare variable definitions between two files (only supports variable names consisting of capitals and underscores)"
    )
    .argument("<name>", "name of comparison to run")
    .option("--no-fail", "if present, failure results in an exit code of 0")
    .action((name, { noFail }) => console.log({ name, noFail }));
}

{
  program
    .command("populate")
    .argument("<name>", "name of comparison to run")
    .option("-f,--force", "overwrite existing file")
    .action((name, { force }) => {
      runPopulate(name, _config, force);
    });
}

program.parse(process.argv);
