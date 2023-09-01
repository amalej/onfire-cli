#!/usr/bin/env node

import readline from "readline";
import { FirebaseCommands } from "./firebase-cmd";

interface CursorPosition {
  x: number;
  y: number;
}

interface CommandConfig {
  value: string;
  label: string;
}

interface CommandOptionsConfig {
  option: string;
  hint: string;
  description: string;
}

interface CommandHelpConfig {
  usage: string;
  options: Array<CommandOptionsConfig>;
}

class TerminalBase {
  prefix = "";
  maxItemShown: number;
  protected displayDownBuffer: number;
  protected originalCursorPos: CursorPosition = {
    x: 0,
    y: 0,
  };
  protected currentCursorPos: CursorPosition = {
    x: 0,
    y: 0,
  };

  constructor({
    prefix = "",
    maxItemShown = 4,
  }: { prefix?: string; maxItemShown?: number } = {}) {
    this.prefix = prefix;
    this.displayDownBuffer = Math.ceil(maxItemShown * 2);
    this.maxItemShown = maxItemShown;
  }

  protected getCursorPosition(): Promise<CursorPosition> {
    return new Promise((resolve) => {
      const termcodes = { cursorGetPosition: "\u001b[6n" };

      process.stdin.setEncoding("utf8");
      process.stdin.setRawMode(true);

      const readfx = function () {
        const buf = process.stdin.read();
        const str = JSON.stringify(buf); // "\u001b[9;1R"
        const regex = /\[(.*)/g;
        const xy = regex.exec(str)[0].replace(/\[|R"/g, "").split(";");
        const pos = { x: parseInt(xy[1]), y: parseInt(xy[0]) };
        process.stdin.setRawMode(false);
        resolve(pos);
      };

      process.stdin.once("readable", readfx);
      process.stdout.write(termcodes.cursorGetPosition);
    });
  }

  protected shiftCursorPosition(dx: number, dy?: number) {
    this.currentCursorPos.x += dx;
    this.currentCursorPos.y += dy || 0;
    process.stdout.cursorTo(this.currentCursorPos.x, this.currentCursorPos.y);
  }

  protected createTerminalBuffer() {
    for (let i = 0; i < this.displayDownBuffer; i++) {
      console.log("");
    }
    process.stdout.moveCursor(0, -this.displayDownBuffer);
  }

  protected clearTerminalDownward() {
    process.stdout.moveCursor(0, 1);
    for (
      let i = this.currentCursorPos.y + 1;
      i < process.stdout.rows - 1;
      i++
    ) {
      console.log(`\r\x1b[K`);
    }
    this.moveCursorToSavedCurrentPos();
  }

  protected moveCursorToSavedCurrentPos() {
    process.stdout.cursorTo(this.currentCursorPos.x, this.currentCursorPos.y);
  }

  protected formatArguments(command: string): {
    base: string;
    args: {
      [key: string]: string;
    };
    options: Array<string>;
  } {
    const args = command.split(" ");
    let _base = args[0];
    let _arguments = {};
    let _options = [];
    if (args === null) return null;
    for (let i = 0; i < args.length; i++) {
      if (args[i].includes("=")) {
        const splitArg = args[i].split("=");
        if (_arguments === null) {
          _arguments = {
            [splitArg[0]]: splitArg[1],
          };
        } else {
          _arguments[splitArg[0]] = splitArg[1];
        }
      } else if (args[i].includes("--")) {
        if (args.length - 1 === i || args[i + 1].includes("--")) {
          if (_options === null) {
            _options = [args[i]];
          } else {
            _options.push(args[i]);
          }
        } else {
          if (_arguments === null) {
            _arguments = {
              [args[i]]: args[i + 1],
            };
          } else {
            _arguments[args[i]] = args[i + 1];
          }
        }
      }
    }

    return {
      base: _base,
      args: _arguments,
      options: _options,
    };
  }

  protected moveCursorToInputStart() {
    this.currentCursorPos = {
      x: this.originalCursorPos.x + this.prefix.length,
      y: this.originalCursorPos.y,
    };
    this.moveCursorToSavedCurrentPos();
  }

  protected foregroundRed(str: string) {
    return `\x1b[31m${str}\x1b[0m`;
  }
  protected foregroundGreen(str: string) {
    return `\x1b[32m${str}\x1b[0m`;
  }
}

class CommandLineInterface extends TerminalBase {
  input = "";
  private listItemIndex: number = 0;
  private itemList: Array<string> = [];
  private firebaseCommands: {
    [key: string]: {
      label: string;
      usage: string | null;
      options: Array<{
        option: string;
        hint: string | null;
        description: string;
      }>;
    };
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
        const msg = i === 0 ? `${this.foregroundGreen(_out)}` : _out;
        console.log(`${msg}\x1b[K`);
      } else {
        console.log(`-\x1b[K`);
      }
    }

    this.moveCursorToSavedCurrentPos();
  }

  isHelpProcessRunning = false;
  private async loadCommandHelp(cmd: string) {
    if (!this.isHelpProcessRunning) {
      this.isHelpProcessRunning = true;
      process.stdout.write("Loading");
      try {
        const help = await FirebaseCommands.getCommadHelp(cmd);
        this.firebaseCommands[cmd].usage = help.usage;
        this.firebaseCommands[cmd].options = help.options;
        this.isHelpProcessRunning = false;
        this.renderCommandHelp();
      } catch (error) {
        process.stdout.write(`\r\x1b[K`);
        console.log(`${this.foregroundRed("Error:")} ${error.message}`);
        process.exit(1);
      }
    }
  }

  private renderCommandHelp() {
    if (this.isHelpProcessRunning) return;
    const { base, args, options } = this.formatArguments(this.input);
    this.clearTerminalDownward();
    console.log("");
    const cmdConfig = this.firebaseCommands[base];
    if (cmdConfig !== undefined && cmdConfig.usage === null) {
      this.loadCommandHelp(base);
    } else if (cmdConfig !== undefined) {
      const _options = this.firebaseCommands[base].options;
      if (_options) {
        const list = _options;
        const filteredList = list
          .map((val) => val.option)
          .filter((_option) => _option.startsWith("--")); // TODO: implement fitler logic. Would need to detect the current word being hovered over.
        this.itemList = filteredList;

        const slicedList = filteredList.slice(this.listItemIndex);

        console.log(`Usage: ${cmdConfig.usage}`);
        for (let i = 0; i < this.maxItemShown; i++) {
          const _option = slicedList[i];
          if (_option !== undefined) {
            const _out = `${_option} -> ${_options[i].description}`;
            const msg = i === 0 ? `${this.foregroundGreen(_out)}` : _out;
            console.log(`${msg}\x1b[K`);
          } else {
            console.log(`-\x1b[K`);
          }
        }
      } else {
        this.loadCommandHelp(base);
      }
    } else {
      console.log(`${this.foregroundRed("Error:")} Command not found`);
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
    }
  }

  private renderIO(newChar: string = "", tabCompletion: boolean = false) {
    if (tabCompletion) {
      this.handleTabCompletion();
      //   const autoCompletedInput = this.getSelectedItemFromList(
      //     this.firebaseCommands
      //   );
      // process.stdout.cursorTo(this.currentCursorPos.x - 2);
      //   const cmdSection = autoCompletedInput.value;
      //   this.input = `${cmdSection} `;
      // process.stdout.write(this.input);
      //   this.shiftCursorPosition(this.input.length);
      //   this.listItemIndex = 0;
      //   // this.loadCommandOptions();
    } else {
      process.stdout.cursorTo(this.currentCursorPos.x - newChar.length);
      process.stdout.write(
        `${this.input.slice(
          this.currentCursorPos.x - this.prefix.length - newChar.length
        )}\x1b[K`
      );
    }
    this.moveCursorToSavedCurrentPos();
    // const base = this.input.split(" ")[0];
    // // if (this.input.split(" ").length === 1) {
    // if (
    //   base !== "" &&
    //   this.firebaseCommands.filter((cmdInfo) => base.includes(cmdInfo.value))
    //     .length !== 0
    // ) {
    //   this.renderCommandHelp();
    // } else {
    const { base, args, options } = this.formatArguments(this.input);
    if (base.length + this.prefix.length >= this.currentCursorPos.x) {
      this.renderCommandList();
    } else {
      this.renderCommandHelp();
    }
    // }
    // this.lastBaseCommand =
    //   base !== this.lastBaseCommand ? base : this.lastBaseCommand;
    // } else {
    // this.showCommandOptions();
    // }
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
      // console.log(`Data ${this.input}`);
      // this.formatArguments();
      // this.runCommand();
      this.createTerminalBuffer();
      this.clearTerminalDownward();
      console.log("\n");
      console.log("\n");
      console.log(this.input);
      process.exit();
    } else if (key.name === "up") {
      if (this.listItemIndex > 0) {
        this.listItemIndex -= 1;
        render = true;
      }
    } else if (key.name === "down") {
      if (this.listItemIndex < this.itemList.length - 1) {
        // if (this.listItemIndex < 4) {
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
      console.log(`${this.foregroundRed("Error:")} ${error.message}`);
      process.exit(1);
    }
    process.stdout.write(`\r\x1b[K`);
    clearInterval(loading);

    readline.emitKeypressEvents(process.stdin);
    console.log(this.firebaseCommands);
    this.createTerminalBuffer();
    this.originalCursorPos = await this.getCursorPosition();
    // Shift the cursor position
    this.originalCursorPos = {
      x: this.originalCursorPos.x - 1,
      y: this.originalCursorPos.y - 1,
    };
    this.currentCursorPos = { ...this.originalCursorPos };

    process.stdin.setRawMode(true);
    process.stdout.write(this.prefix);
    // console.log(this.currentCursorPos.x)
    this.shiftCursorPosition(prefixLen);
    this.renderCommandList();
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (str, key) => {
      this.keyPressListener(str, key);
    });

    process.on("exit", () => {
      this.clearTerminalDownward();
      console.log("MAIN_EXIT");
    });
  }
}

const cli = new CommandLineInterface({ prefix: "> " });
cli.init();
