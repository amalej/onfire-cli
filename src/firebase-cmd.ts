import { ChildProcess, SpawnOptions } from "child_process";
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

const COMMAND_TIMEOUT = 10000;

export class FirebaseCommands {
  static async getCommandConfigList(): Promise<Array<CommandConfiguration>> {
    const commandConfigList: Array<CommandConfiguration> = [];
    await new Promise((resolve, reject) => {
      const firebaseHelp = spawn("firebase", ["--help"]);
      const timer = setTimeout(() => {
        firebaseHelp.kill();
        reject(
          new Error(
            `Failed to load commands via \`firebase --help\`. Promise timed out after ${COMMAND_TIMEOUT} ms`
          )
        );
      }, COMMAND_TIMEOUT);

      firebaseHelp.stdout.on("data", (data) => {
        const _outputCommand: string = data
          .toString()
          .replace(/^(.*)commands:/gims, "");
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
    });
    return commandConfigList;
  }

  static async getCommadHelp(cmd: string) {
    const optionConfigList: Array<OptionConfiguration> = [];
    let usage = "";
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new Error(
            `Failed to load commands via \`firebase --help\`. Promise timed out after ${COMMAND_TIMEOUT} ms`
          )
        );
      }, COMMAND_TIMEOUT);

      const firebaseHelp = spawn("firebase", [cmd.trim(), "--help"]);
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
