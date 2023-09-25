import { ChildProcess, SpawnOptions, exec, fork } from "child_process";
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
  protected defaultOptions = {
    "--project": {
      option: "--project",
      flags: "--project <alias_or_project_id>",
      hint: "<alias_or_project_id>",
      required: false,
      optional: true,
      long: "--project",
      description: "the Firebase project to use for this command",
      defaultValue: null,
    },
    "--debug": {
      option: "--debug",
      flags: "--debug",
      hint: null,
      required: false,
      optional: true,
      long: "--debug",
      description: "print verbose debug output and keep a debug log file",
      defaultValue: null,
    },
    "--non-interactive": {
      option: "--non-interactive",
      flags: "--non-interactive",
      hint: null,
      required: false,
      optional: true,
      long: "--non-interactive",
      description: "error out of the command instead of waiting for prompts",
      defaultValue: null,
    },
  };

  protected async loadFirebaseModule() {
    return new Promise((resolve, reject) => {
      const rejectTimout = setTimeout(() => {
        reject(
          new Error(
            `Firebase Tools module could not be loaded. Exceeded ${COMMAND_TIMEOUT} ms timeout.`
          )
        );
      }, COMMAND_TIMEOUT);
      const npmSpawnPath = exec("npm root -g");

      let bufferString = "";
      npmSpawnPath.stdout.on("data", (data) => {
        bufferString += data;
      });

      npmSpawnPath.stdout.on("end", async () => {
        clearTimeout(rejectTimout);
        const rootPath = bufferString.toString().trim();
        try {
          // Send child process some work

          const childResponse = await new Promise((res, rej) => {
            const childRejectTimout = setTimeout(() => {
              reject(
                new Error(
                  `Firebase Tools module could not be loaded. Exceeded ${COMMAND_TIMEOUT} ms timeout.`
                )
              );
            }, COMMAND_TIMEOUT);
            var child = fork(`${__dirname}/module-loader.js`);

            let childBufferString = "";
            child.on("message", function (m: string) {
              // Receive results from child process
              childBufferString += m;
              clearTimeout(childRejectTimout);
              child.kill("SIGINT"); // Kill the child process. Process will continue running if not done
            });

            child.on("exit", () => {
              res(JSON.parse(childBufferString));
            });

            child.send(`${rootPath}/firebase-tools`);
          });

          // await new Promise((res, rej) => setTimeout(res, 5000));
          resolve(childResponse);
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
      });
    });
  }

  protected wrapString(str: string, start: string, end: string) {
    return `${start}${str}${end}`;
  }

  protected async getCommandsUsingModule() {
    this.client = await this.loadFirebaseModule();
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
            ...this.defaultOptions,
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

  async getCommandConfig(): Promise<{ [key: string]: any }> {
    const _out = this.getCommandsUsingModule();
    return _out;
  }

  static runCommand(
    command: string,
    args?: ReadonlyArray<string>,
    options?: SpawnOptions
  ): ChildProcess {
    return spawn(command, args, options);
  }
}
