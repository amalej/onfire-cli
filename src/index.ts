#!/usr/bin/env node

import readline from "readline";
import { FirebaseCommands } from "./firebase-cmd";
import { CommandLineInterface } from "./cli";

interface CommandConfig {
  label: string;
  usage: string;
  options: {
    [key: string]: CommandOptionsConfig;
  } | null;
}

interface CommandOptionsConfig {
  option: string;
  hint: string;
  description: string;
}
class OnFireCLI extends CommandLineInterface {
  input = "";
  private cancelPendingRenders = false;
  private isHelpProcessRunning = false;
  private listItemIndex: number = 0;
  private itemList: Array<string> = [];
  private firebaseCommands: {
    [key: string]: CommandConfig;
  };

  constructor({
    prefix = "",
    maxItemShown = 4,
  }: { prefix?: string; maxItemShown?: number } = {}) {
    super({
      prefix,
      maxItemShown,
    });
  }

  private renderCommandList() {
    const list = Object.keys(this.firebaseCommands);
    const baseCommand = this.input.split(" ")[0];
    this.clearTerminalDownward();

    console.log("");
    const filteredList = list.filter((command) =>
      command.startsWith(baseCommand)
    );
    this.itemList = filteredList;

    const slicedList = filteredList.slice(this.listItemIndex);

    for (let i = 0; i < this.maxItemShown; i++) {
      const command = slicedList[i];
      if (command !== undefined) {
        const _out = `${command} -> ${this.firebaseCommands[command].label}`;
        const msg = i === 0 ? `${this.textGreen(_out)}` : _out;
        console.log(`${msg}\x1b[K`);
      } else {
        console.log(`-\x1b[K`);
      }
    }

    this.moveCursorToSavedCurrentPos();
  }

  private async loadCommandHelp(cmd: string) {
    if (!this.isHelpProcessRunning) {
      this.isHelpProcessRunning = true;
      process.stdout.write("Loading");
      try {
        const help = await FirebaseCommands.getCommadHelp(cmd);
        this.firebaseCommands[cmd].usage = help.usage;
        this.firebaseCommands[cmd].options = help.options.reduce(
          (acc, curr) => (
            (acc[curr.option] = {
              option: curr.option,
              hint: curr.hint,
              description: curr.description,
            }),
            acc
          ),
          {}
        );
        this.isHelpProcessRunning = false;
        this.renderCommandHelp();
      } catch (error) {
        process.stdout.write(`\r\x1b[K`);
        console.log(
          `${this.textBold(this.textRed("Error:"))} ${error.message}`
        );
        process.exit(1);
      }
    }
  }

  private getTypedWord(): string {
    const posX = this.currentCursorPos.x - this.prefix.length;
    const words = this.input.split(" ");
    for (let i = 0; i < words.length; i++) {
      const currentLen = words.slice(0, i + 1).join("").length + i;
      if (posX <= currentLen) {
        return words[i];
      }
    }
    return "";
  }

  private renderCommandHelp() {
    if (this.isHelpProcessRunning || this.cancelPendingRenders) return;
    const { base, args, options } = this.formatArguments(this.input);
    this.clearTerminalDownward();
    console.log("");
    const cmdConfig = this.firebaseCommands[base];
    if (cmdConfig !== undefined && cmdConfig.usage === null) {
      this.loadCommandHelp(base);
    } else if (cmdConfig !== undefined) {
      const typedWord = this.getTypedWord();
      const _options = this.firebaseCommands[base].options;
      if (_options) {
        const list = Object.keys(_options);
        const argList = Object.keys(args);
        const filteredList = list.filter(
          (_option) =>
            _option.startsWith(typedWord) &&
            ((!argList.includes(_option) && !options.includes(_option)) ||
              _option === typedWord)
        );
        this.itemList = filteredList;

        const slicedList = filteredList.slice(this.listItemIndex);

        const missingArgs: Array<CommandOptionsConfig> = [];
        for (let option of list) {
          if (_options[option].hint !== null && options.includes(option)) {
            missingArgs.push(_options[option]);
          }
        }

        if (missingArgs.length > 0) {
          const msg = [];
          for (let missingArg of missingArgs) {
            msg.push(
              `${missingArg.option} ${this.textBold(
                this.textYellow(missingArg.hint)
              )}`
            );
          }
          console.log(
            `${this.textBold(this.textRed("Missing:"))} ${msg.join(", ")}`
          );
        } else {
          console.log(
            `${this.textBold(this.textYellow("Usage:"))} ${cmdConfig.usage}`
          );
        }

        for (let i = 0; i < this.maxItemShown; i++) {
          const _option = slicedList[i];
          if (_option !== undefined) {
            const _out = `${_option} ${_options[_option].hint || ""} -> ${
              _options[_option].description
            }`;
            const msg = i === 0 ? `${this.textGreen(_out)}` : _out;
            console.log(`${msg}\x1b[K`);
          } else {
            console.log(`-\x1b[K`);
          }
        }
      } else {
        this.loadCommandHelp(base);
      }
    } else {
      console.log(`${this.textBold(this.textRed("Error:"))} Command not found`);
    }
    this.moveCursorToSavedCurrentPos();
  }

  private handleTabCompletion() {
    const { base, args, options } = this.formatArguments(this.input);
    if (base.length + this.prefix.length >= this.currentCursorPos.x) {
      const filteredList = Object.keys(this.firebaseCommands).filter(
        (command) => command.startsWith(base)
      );
      const slicedList = filteredList.slice(this.listItemIndex);

      if (slicedList[0] !== undefined) {
        this.moveCursorToInputStart();
        this.input = `${slicedList[0]}${this.input.replace(base, "")}`;
        process.stdout.write(this.input);
        this.shiftCursorPosition(slicedList[0].length);
        this.listItemIndex = 0;
      }
    } else {
      const typedWord = this.getTypedWord();
      const list = Object.keys(this.firebaseCommands[base].options);
      const argList = Object.keys(args);
      const filteredList = list.filter(
        (_option) =>
          _option.startsWith(typedWord) &&
          ((!argList.includes(_option) && !options.includes(_option)) ||
            _option === typedWord)
      );

      this.itemList = filteredList;
      const slicedList = filteredList.slice(this.listItemIndex);
      if (slicedList[0] !== undefined) {
        const xPos = this.currentCursorPos.x - this.prefix.length;
        this.shiftCursorPosition(-typedWord.length);
        process.stdout.write(`${slicedList[0]}${this.input.slice(xPos)}`);
        this.input = `${this.input.slice(0, xPos - typedWord.length)}${
          slicedList[0]
        }${this.input.slice(xPos)}`;
        this.shiftCursorPosition(slicedList[0].length);
        this.listItemIndex = 0;
      }
    }
  }

  private renderIO(newChar: string = "", tabCompletion: boolean = false) {
    if (tabCompletion) {
      this.handleTabCompletion();
    } else {
      process.stdout.cursorTo(this.currentCursorPos.x - newChar.length);
      process.stdout.write(
        `${this.input.slice(
          this.currentCursorPos.x - this.prefix.length - newChar.length
        )}\x1b[K`
      );
    }
    this.moveCursorToSavedCurrentPos();
    const { base } = this.formatArguments(this.input);
    if (base.length + this.prefix.length >= this.currentCursorPos.x) {
      this.renderCommandList();
    } else {
      this.renderCommandHelp();
    }
  }

  private onExit() {
    this.clearTerminalDownward();
    console.log("");
    console.log(`${this.textGreen("OnFire:")} exit`);
  }

  private async runCommand() {
    const { base } = this.formatArguments(this.input);
    if (base === "exit" || base === "stopdropandroll") {
      process.exit();
    }
    this.clearTerminalDownward();
    console.log(`\x1b[K`);
    process.stdin.removeListener("keypress", (str, key) => {
      this.keyPressListener(str, key);
    });

    process.stdin.pause();

    const spawnCommands = this.input.trim().split(" ");
    const firebaseSpawn = FirebaseCommands.runCommand(
      "firebase",
      [...spawnCommands],
      {
        stdio: "inherit",
      }
    );

    firebaseSpawn.on("spawn", () => {
      this.cancelPendingRenders = true;
      process.stdout.cursorTo(0);
    });

    firebaseSpawn.on("exit", async (code) => {
      this.cancelPendingRenders = false;
      process.stdout.cursorTo(0);
      const exitMessage =
        code === 0
          ? `${this.textGreen(
              "OnFire:"
            )} Command finished with exit code ${this.textGreen(
              code.toString()
            )}\n`
          : `${this.textRed(
              "OnFire:"
            )} Command finished with exit code ${this.textRed(
              code.toString()
            )}\n`;
      console.log(exitMessage);
      process.on("SIGINT", function () {
        process.exit(1);
      });

      this.createTerminalBuffer();
      this.originalCursorPos = await this.getCursorPosition();
      // Shift the cursor position
      this.originalCursorPos = {
        x: this.originalCursorPos.x - 1,
        y: this.originalCursorPos.y - 1,
      };
      this.currentCursorPos = { ...this.originalCursorPos };
      process.stdin.setRawMode(true);
      process.stdout.write(`${this.textBold(this.textGreen(this.prefix))}`);
      this.shiftCursorPosition(this.prefix.length);

      if (code === 0) {
        this.input = "";
        this.moveCursorToInputStart();
        this.renderCommandList();
      } else {
        process.stdout.write(this.input);
        this.shiftCursorPosition(this.input.length);
        if (base.length + this.prefix.length >= this.currentCursorPos.x) {
          this.renderCommandList();
        } else {
          this.renderCommandHelp();
        }
      }
    });
  }

  private keyPressListener(str: string, key: any) {
    const prefixLen = this.prefix.length;
    let render = false;
    let tabCompletion = false;
    let newChar = "";
    const xPos = this.currentCursorPos.x - prefixLen;

    if (key.ctrl == true && key.name == "c") {
      process.exit();
    } else if (key.name === "backspace") {
      if (xPos > 0) {
        render = true;
        this.listItemIndex = 0;
        const endString = this.input.trim().slice(xPos);
        this.input = this.input.slice(0, xPos - 1) + endString;
        this.currentCursorPos.x -= 1;
      }
    } else if (key.name === "return") {
      this.listItemIndex = 0;
      this.createTerminalBuffer();
      this.clearTerminalDownward();
      this.runCommand();
    } else if (key.name === "up") {
      if (this.listItemIndex > 0) {
        this.listItemIndex -= 1;
        render = true;
      }
    } else if (key.name === "down") {
      if (this.listItemIndex < this.itemList.length - 1) {
        this.listItemIndex += 1;
        render = true;
      }
    } else if (key.name === "left") {
      if (xPos > 0) {
        this.shiftCursorPosition(-1);
        render = true;
      }
    } else if (key.name === "right") {
      if (xPos < this.input.length) {
        this.shiftCursorPosition(1);
        render = true;
      }
    } else if (key.name === "tab") {
      render = true;
      tabCompletion = true;
    } else if (str !== undefined && str.length === 1) {
      render = true;
      newChar = str;
      this.listItemIndex = 0;
      this.currentCursorPos.x += 1;
      this.input =
        this.input.slice(0, this.currentCursorPos.x - prefixLen - 1) +
        newChar +
        this.input.slice(this.currentCursorPos.x - prefixLen - 1);
    }

    if (render) {
      this.renderIO(newChar, tabCompletion);
    }
  }

  async init() {
    const prefixLen = this.prefix.length;

    process.stdout.write("Loading");
    const loading = setInterval(() => {
      process.stdout.write(".");
    }, 200);
    try {
      this.firebaseCommands = (
        await FirebaseCommands.getCommandConfigList()
      ).reduce(
        (acc, curr) => (
          (acc[curr.command] = {
            label: curr.description,
            usage: null,
            options: null,
          }),
          acc
        ),
        {}
      );
    } catch (error) {
      process.stdout.write(`\r\x1b[K`);
      console.log(`${this.textBold(this.textRed("Error:"))} ${error.message}`);
      process.exit(1);
    }
    this.firebaseCommands["exit"] = {
      label: "Exit the OnFire CLI",
      usage: null,
      options: null,
    };
    this.firebaseCommands["stopdropandroll"] = {
      label: "Exit the OnFire CLI same as 'exit'",
      usage: null,
      options: null,
    };
    process.stdout.write(`\r\x1b[K`);
    clearInterval(loading);

    readline.emitKeypressEvents(process.stdin);
    this.createTerminalBuffer();
    this.originalCursorPos = await this.getCursorPosition();
    // Shift the cursor position
    this.originalCursorPos = {
      x: this.originalCursorPos.x - 1,
      y: this.originalCursorPos.y - 1,
    };
    this.currentCursorPos = { ...this.originalCursorPos };

    process.stdin.setRawMode(true);
    process.stdout.write(`${this.textBold(this.textGreen(this.prefix))}`);
    this.shiftCursorPosition(prefixLen);
    this.renderCommandList();
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (str, key) => {
      this.keyPressListener(str, key);
    });

    process.on("exit", () => {
      this.onExit();
    });
  }
}

const cli = new OnFireCLI({ prefix: "> " });
cli.init();