import { run } from "./testing/util";
import mock from "mock-fs";
import { noop } from "lodash";

describe("locate", () => {
  // set with process.env in testing/setup.ts
  it("uses /config/ev.json", () => {
    const { output } = run("config locate");
    expect(output).toEqual("/config/ev.json");
  });

  it("locates even if the config path doesn't exist", () => {
    mock({});
    const { output } = run("config locate", false);
    expect(output).toEqual("/config/ev.json");
  });

  it("locates even if the config path is a directory", () => {
    mock({
      "/config/ev.json": {},
    });
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const { output } = run("config locate", false);
    expect(output).toEqual("/config/ev.json");
  });
});

describe("config", () => {
  const dotenv = ".my_env";
  const template = "my_template";

  describe("show", () => {
    it("shows config", () => {
      const { output } = run("config show");
      expect(Object.keys(JSON.parse(output)).length).not.toEqual(0);
    });
  });

  describe("defaults", () => {
    it("saves to config file", () => {
      run(`config defaults --env ${dotenv}`);
      const { config } = run("config show");
      expect(config.default_env_file_path).toEqual(dotenv);
    });
    describe("sets defaults", () => {
      it("one at a time", () => {
        run(`config defaults --env ${dotenv}`);
        const { config } = run(`config defaults --template ${template} `);
        expect(config.default_env_file_path).toEqual(dotenv);
        expect(config.default_template_path).toEqual(template);
      });
      it("all at once", () => {
        const { config } = run(
          `config defaults --env ${dotenv} --template ${template}`
        );
        expect(config.default_env_file_path).toEqual(dotenv);
        expect(config.default_template_path).toEqual(template);
      });
    });
  });

  describe("1password", () => {
    const check = (
      config,
      { name, env, template, address, email, vault, record }
    ) => {
      expect(config.comparisons[name]?.env_file_path).toEqual(env);
      expect(config.comparisons[name]?.template_path).toEqual(template);
      expect(config.comparisons[name]?.address).toEqual(address);
      expect(config.comparisons[name]?.email).toEqual(email);
      expect(config.comparisons[name]?.vault).toEqual(vault);
      expect(config.comparisons[name]?.record).toEqual(record);
    };
    const set_defaults = ({ env, template }) =>
      run(`config defaults --env ${env} --template ${template}`);

    const [name, env, template, address, email, vault, record] = [
      "test",
      "/config/1password.env",
      "/config/1password.template",
      "myaddress",
      "myemail",
      "Software Engineering",
      "test.db.env",
    ];

    describe("set", () => {
      describe("adds comparisons", () => {
        it("overrides defaults", () => {
          const { config } = run([
            ..."config 1password set".split(" "),
            name,
            "--env",
            env,
            "--template",
            template,
            "--address",
            address,
            "--email",
            email,
            "--vault",
            vault,
            "--record",
            record,
          ]);
          check(config, { name, env, template, address, email, vault, record });
        });
        it("uses global defaults", () => {
          set_defaults({ env, template });
          const { config } = run([
            ..."config 1password set".split(" "),
            name,
            "--address",
            address,
            "--email",
            email,
            "--vault",
            vault,
            "--record",
            record,
          ]);
          check(config, { name, env, template, address, email, vault, record });
        });
        it("uses 1password defaults", () => {
          set_defaults({ env, template });
          run(
            `config 1password defaults --vault ${vault} --address ${address} --email ${email}`
          );
          const { config } = run([
            ..."config 1password set".split(" "),
            name,
            "--record",
            record,
          ]);
          check(config, { name, env, template, address, email, vault, record });
        });
      });
    });
    describe("compare", () => {
      const set_config = ({
        name,
        env,
        template,
        address,
        email,
        vault,
        record,
      }) =>
        run([
          ..."config 1password set".split(" "),
          name,
          "--env",
          env,
          "--template",
          template,
          "--address",
          address,
          "--email",
          email,
          "--vault",
          vault,
          "--record",
          record,
        ]);
      it("passes good comparisons", () => {
        mock({
          "/config": {
            "1password.env": "THING=1\nOTHER_THING=2\n",
            "1password.template": "THING=1\nOTHER_THING=2\n",
          },
        });
        set_config({
          name,
          env,
          template,
          address,
          email,
          vault,
          record,
        });
        run(["compare", name]);
      });
      it("fails bad comparisons", () => {
        mock({
          "/config": {
            "1password.env": "THING=1\nOTHER_THING=2\nTHING3=ok\n",
            "1password.template": "THING=1\nOTHER_THING=2\n",
          },
        });
        jest.spyOn(console, "error").mockImplementation(noop);
        set_config({
          name,
          env,
          template,
          address,
          email,
          vault,
          record,
        });
        expect(() => run(["compare", name])).toThrow("Exit(1)");
      });
    });
  });
});
