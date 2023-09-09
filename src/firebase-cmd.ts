import { ChildProcess, SpawnOptions, exec } from "child_process";
import spawn from "cross-spawn";

interface CommandConfiguration {
  command: string;
  description: string;
}

interface OptionConfiguration {
  option: string;
  hint: string;
  description: string;
}

interface SpawnError extends Error {
  code?: string;
}

const COMMAND_TIMEOUT = 10000;

interface FirebaseCommandArgs {
  required: boolean;
  name: string;
  variadic: boolean;
}

interface FirebaseCommandOptions {
  flags: string;
  required: boolean;
  optional: boolean;
  mandatory: boolean;
  negate: boolean;
  long: string;
  description: string;
  defaultValue: string | boolean | number | null;
}

export class FirebaseCommands {
  client = null;
  private async loadFirebaseModule() {
    return new Promise((resolve, reject) => {
      const rejectTimout = setTimeout(() => {
        reject("Error");
      }, COMMAND_TIMEOUT);
      const npmSpawnPath = exec("npm root -g");

      let bufferString = "";
      npmSpawnPath.stdout.on("data", (data) => {
        bufferString += data;
      });

      npmSpawnPath.stdout.on("end", () => {
        clearTimeout(rejectTimout);
        const rootPath = bufferString.toString().trim();
        try {
          this.client = require(`${rootPath}/firebase-tools`);
        } catch (error) {
          if (error.code === "MODULE_NOT_FOUND") {
            reject(
              new Error(
                `Firebase Tools module not found. Install using 'npm install -g firebase-tools'`
              )
            );
          } else {
            new Error(`Unexpected error was raised. ${error.message}`);
          }
        }
        resolve(this.client);
      });
    });
  }

  private wrapString(str: string, start: string, end: string) {
    return `${start}${str}${end}`;
  }

  private getCommandsUsingModule() {
    const commandConfig = this.client.cli.commands.reduce(
      (comMap: any, com: any) => {
        comMap[com._name] = {
          command: com._name,
          description: (com._description || "No description").replace(
            /\n.*/g,
            ""
          ),
          usage: `firebase ${com._name} [options] ${com._args
            .map((arg: FirebaseCommandArgs) => {
              let usage = arg.name;
              if (arg.variadic === true) {
                usage = `...${usage}`;
              }

              if (arg.required === true) {
                usage = this.wrapString(usage, "<", ">");
              } else {
                usage = this.wrapString(usage, "[", "]");
              }

              return usage;
            })
            .join(" ")}`,
          options: {
            ...com.options.reduce(function (
              optMap: any,
              opt: FirebaseCommandOptions
            ) {
              const [_option, _optionValue] = opt.flags
                .replace(/.*(?=--)/, "")
                .split(" ");
              optMap[opt.long] = {
                option: opt.long,
                flags: opt.flags.replace(/.*(?=--)/, ""),
                hint: _optionValue || null,
                required: opt.required,
                optional: opt.optional,
                long: opt.long,
                description: opt.description,
                defaultValue: opt.defaultValue || null,
              };
              return optMap;
            },
            {}),
            "--project": {
              option: "--project",
              flags: "--project <alias_or_project_id>",
              hint: "<alias_or_project_id>",
              description: "the Firebase project to use for this command",
              required: false,
              optional: true,
              long: "--project",
              defaultValue: null,
            },
            "--debug": {
              option: "--debug",
              flags: "--debug",
              hint: null,
              required: false,
              optional: true,
              long: "--debug",
              description:
                "print verbose debug output and keep a debug log file",
              defaultValue: null,
            },
          },
          args: com._args.reduce(function (
            argMap: any,
            arg: FirebaseCommandArgs
          ) {
            argMap[arg.name] = arg;
            return argMap;
          },
          {}),
        };
        return comMap;
      },
      {}
    );

    return commandConfig;
  }

  private async getCommandsUsingHelp() {
    const commandConfigList: Array<CommandConfiguration> = [];
    await new Promise((resolve, reject) => {
      let buf = ""; // child process stdout data buffer
      const firebaseHelp = exec("firebase help");
      const timer = setTimeout(() => {
        firebaseHelp.kill();
        reject(
          new Error(
            `Failed to load commands via \`firebase --help\`. Promise timed out after ${COMMAND_TIMEOUT} ms, re-run the command.`
          )
        );
      }, COMMAND_TIMEOUT);

      firebaseHelp.stdout.setEncoding("utf8");
      firebaseHelp.stdout.on("data", (data) => {
        buf += data;
      });

      firebaseHelp.stdout.on("end", () => {
        const _outputCommand: string = buf.replace(/^(.*)commands:/gims, "");
        const commandsListString = _outputCommand.split("\n") as Array<string>;
        for (let commandString of commandsListString) {
          const commandRegex: RegExp = /^[a-z:]+$/g;
          const [_cmd, _description] = commandString
            .trim()
            .split(/[ ]{2,}/)
            .filter((str: string) => str !== "");
          if (
            _cmd !== undefined &&
            _cmd[0] !== undefined &&
            commandRegex.test(_cmd[0])
          ) {
            const command = _cmd.split(" ")[0];
            commandConfigList.push({
              command: command,
              description: _description,
            });
          }
        }
        clearTimeout(timer);
        resolve("OK");
      });

      firebaseHelp.on("error", (error: SpawnError) => {
        if (error.code === "ENOENT") {
          reject(new Error(`Firebase CLI not found.`));
        } else {
          new Error(`Unexpected error was raised. ${error.message}`);
        }
      });
    });
  }

  async getCommandConfig(): Promise<{ [key: string]: any }> {
    await this.loadFirebaseModule();
    const _out = this.getCommandsUsingModule();
    return _out;
  }

  static async getCommadHelp(cmd: string) {
    const optionConfigList: Array<OptionConfiguration> = [];
    let usage = "";
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Failed to load commands via \`firebase --help\`. Promise timed out after ${COMMAND_TIMEOUT} ms, re-run the command.`
          )
        );
      }, COMMAND_TIMEOUT);

      const firebaseHelp = spawn("firebase", [cmd.trim(), "--help"]); // TODO: Consider changing to exec. Not really buggy right now though.
      firebaseHelp.stdout.on("data", (data) => {
        try {
          usage = data
            .toString()
            .match(/(?<=usage:)(.*)/i)[0]
            .trim();
        } catch (_) {}
        const _outputCommand: string = data
          .toString()
          .replace(/^(.*)Options:/gims, "");
        const optionsListString = _outputCommand
          .split("\n")
          .filter((str) => str) as Array<string>;

        for (let optionString of optionsListString) {
          const commandRegex: RegExp = /^([-]{1,}[a-z]+)/g;
          const [_optionConfig, _description] = optionString
            .trim()
            .split(/[ ]{2,}/);
          if (commandRegex.test(_optionConfig)) {
            const cleanOptionConfig = _optionConfig.replace(/(.*)(?=--)/g, "");
            const [_option, _optionValue] = cleanOptionConfig.split(" ");
            optionConfigList.push({
              option: _option,
              hint: _optionValue || null,
              description: _description,
            });
          } else {
            optionConfigList.at(-1).description += ` ${_optionConfig}`;
          }
        }
        clearTimeout(timer);
        resolve("OK");
      });
    });

    // console.log(optionConfigList);
    return {
      usage: usage,
      options: optionConfigList,
    };
  }

  static runCommand(
    command: string,
    args?: ReadonlyArray<string>,
    options?: SpawnOptions
  ): ChildProcess {
    return spawn(command, args, options);
  }
}
