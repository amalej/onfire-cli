import readline from "readline";
import { FirebaseCommands } from "./firebase-cmd";
import { CommandLineInterface } from "./cli";
import { ChildProcess } from "child_process";
import { CliCache } from "./cli-cache";

interface CommandConfig {
  description: string;
  usage: string;
  options: {
    [key: string]: CommandOptionsConfig;
  } | null;
  args: {
    [key: string]: CommandArgsConfig;
  } | null;
}

interface CommandOptionsConfig {
  option: string;
  hint: string;
  description: string;
}

interface CommandArgsConfig {
  required: boolean;
  name: string;
  variadic: boolean;
}

interface SavedInput {
  pastCommands?: string[] | undefined;
  [key: string]: any;
}

export class OnFireCLI extends CommandLineInterface {
  input = "";

  private cancelPendingRenders = false;
  private isHelpProcessRunning = false;
  private firebaseSpawn: ChildProcess | null = null;
  private listItemIndex: number = 0;
  private itemList: Array<string> = [];
  private isProcessingExit = false;
  protected firebaseCommands: {
    [key: string]: CommandConfig;
  };
  private firebaseCli: FirebaseCommands;
  private savedInput: SavedInput;

  constructor({
    prefix = "",
    maxItemShown = 4,
    savedInput = {},
  }: {
    prefix?: string;
    maxItemShown?: number;
    savedInput?: SavedInput;
  } = {}) {
    super({
      prefix,
      maxItemShown,
    });
    this.firebaseCli = new FirebaseCommands();
    this.savedInput = savedInput;
  }

  /**
   * Get a string array of flags that do not expect an argument
   * @returns An array of string
   */
  protected getCurrentCommandNullableOptions(): string[] {
    const { base } = this.getCommandParams(this.input);
    if (
      this.firebaseCommands[base] === undefined ||
      this.firebaseCommands[base].options === null
    ) {
      return [];
    }
    return Object.keys(this.firebaseCommands[base].options).filter(
      (opt) => this.firebaseCommands[base].options[opt].hint === null
    );
  }

  private getCurrentCommandArgs() {
    const { base } = this.getCommandParams(this.input);
    if (this.firebaseCommands[base] === undefined) {
      return [];
    }
    return Object.keys(this.firebaseCommands[base].args);
  }

  private renderPastCommands() {
    const list = this.savedInput.pastCommands || [];
    this.clearTerminalDownward();

    console.log("");
    this.itemList = list;

    const slicedList = list.slice(this.listItemIndex);

    for (let i = 0; i < this.maxItemShown; i++) {
      const command = slicedList[i];
      if (command !== undefined) {
        const msg =
          i === 0
            ? `${this.textGreen(this.textBold(command))}`
            : `${this.textBold(command)}`;
        console.log(`${msg}\x1b[K`);
      } else {
        console.log(`-\x1b[K`);
      }
    }
    this.moveCursorToSavedCurrentPos();
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
        const cmdLabel = `-> ${this.firebaseCommands[command].description}`;
        const msg =
          i === 0
            ? `${this.textGreen(this.textBold(command))} ${this.textGreen(
                cmdLabel
              )}`
            : `${this.textBold(command)} ${cmdLabel}`;
        console.log(`${msg}\x1b[K`);
      } else {
        console.log(`-\x1b[K`);
      }
    }

    this.moveCursorToSavedCurrentPos();
  }

  private renderCommandOptions() {
    if (this.isHelpProcessRunning || this.cancelPendingRenders) return;
    const { base, args, options } = this.getCommandParams(this.input);
    this.clearTerminalDownward();
    console.log("");
    const cmdConfig = this.firebaseCommands[base];
    if (cmdConfig !== undefined) {
      const typedWord = this.getTypedWord();
      const _options = this.firebaseCommands[base].options || {};
      const list = Object.keys(_options);
      const argList = Object.keys(args);
      const filteredList = list.filter(
        (_option) =>
          _option.startsWith(typedWord.word) &&
          ((!argList.includes(_option) && !options.includes(_option)) ||
            _option === typedWord.word)
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
          const optString = `${_option} ${_options[_option].hint || ""}`;
          const optDescription = `-> ${_options[_option].description}`;
          const msg =
            i === 0
              ? `${this.textGreen(this.textBold(optString))} ${this.textGreen(
                  optDescription
                )}`
              : `${this.textBold(optString)} ${optDescription}`;
          console.log(`${msg}\x1b[K`);
        } else {
          console.log(`-\x1b[K`);
        }
      }
    } else {
      console.log(`${this.textBold(this.textRed("Error:"))} Command not found`);
    }
    this.moveCursorToSavedCurrentPos();
  }

  private getTypedWord(): {
    word: string;
    start: number;
    end: number;
  } {
    const posX = this.currentCursorPos.x - this.prefix.length;
    const words = this.input.split(" ");
    for (let i = 0; i < words.length; i++) {
      const currentLen = words.slice(0, i + 1).join("").length + i;
      if (posX <= currentLen) {
        return {
          word: words[i],
          start: currentLen - words[i].length,
          end: currentLen,
        };
      }
    }
    return {
      word: "",
      start: posX,
      end: posX,
    };
  }

  private renderCommandArgs() {
    this.clearTerminalDownward();
    // TODO: Handle args input
    // console.log("");
    // console.log("PROVIDE ARGS");
    this.moveCursorToSavedCurrentPos();
  }

  private handleTabCompletion() {
    const { base, args, options } = this.getCommandParams(this.input);

    if (base === "") {
      const list = this.savedInput.pastCommands || [];
      const slicedList = list.slice(this.listItemIndex);
      this.input = slicedList[0] || "";
      process.stdout.write(this.input);
      this.shiftCursorPosition(this.input.length);
    } else if (base.length + this.prefix.length >= this.currentCursorPos.x) {
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
          _option.startsWith(typedWord.word) &&
          ((!argList.includes(_option) && !options.includes(_option)) ||
            _option === typedWord.word)
      );

      this.itemList = filteredList;
      const slicedList = filteredList.slice(this.listItemIndex);
      if (slicedList[0] !== undefined) {
        const xPos = this.currentCursorPos.x - this.prefix.length;
        this.shiftCursorPosition(-(xPos - typedWord.start));
        process.stdout.write(
          `${slicedList[0]}${this.input.slice(typedWord.end)}`
        );
        this.input = `${this.input.slice(0, typedWord.start)}${
          slicedList[0]
        }${this.input.slice(typedWord.end)}`;
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
    const _options = this.getCurrentCommandNullableOptions();
    const typedWord = this.getTypedWord();
    const { base, input } = this.getCommandParams(this.input, _options);
    if (base === "") {
      this.renderPastCommands();
    } else if (base.length + this.prefix.length >= this.currentCursorPos.x) {
      this.renderCommandList();
    } else if (input.length > 0 && input.includes(typedWord.word)) {
      // Handle required inputs for commands
      this.renderCommandArgs();
    } else {
      this.renderCommandOptions();
    }
  }

  private onExit() {
    this.clearTerminalDownward();
    console.log("");
    console.log(`${this.textGreen("OnFire:")} exit`);
  }

  private updateSavedInput() {
    const _options = this.getCurrentCommandNullableOptions();
    const { base, args, input } = this.getCommandParams(this.input, _options);

    // Handle past commands
    if (this.savedInput.pastCommands === undefined) {
      this.savedInput.pastCommands = [this.input];
    } else {
      if (this.savedInput.pastCommands.includes(this.input)) {
        this.savedInput.pastCommands.sort((x: string, y: string) => {
          return x == this.input ? -1 : y == this.input ? 1 : 0;
        });
      } else {
        this.savedInput.pastCommands.unshift(this.input);
      }
    }

    // Handle args
    const argFlags = Object.keys(args);
    for (let i = 0; i < argFlags.length; i++) {
      const argFlag = argFlags[i];
      if (this.savedInput[argFlag] === undefined) {
        this.savedInput[argFlag] = [args[argFlag]];
      } else {
        if (!this.savedInput[argFlag].includes(args[argFlag])) {
          this.savedInput[argFlag].push(args[argFlag]);
        }
      }
      // const _savedArgFlag = this.savedInput[argFlag] || [];
      // this.savedInput[argFlag] = {};
    }
  }

  private async runCommand() {
    const { base } = this.getCommandParams(this.input);
    if (base === "exit" || base === "stopdropandroll") {
      process.exit();
    }
    this.clearTerminalDownward();
    console.log(`\x1b[K`);

    process.stdin.pause();

    const spawnCommands = this.input.trim().split(" ");
    this.firebaseSpawn = FirebaseCommands.runCommand(
      "firebase",
      [...spawnCommands],
      {
        stdio: "inherit",
      }
    );

    this.firebaseSpawn.on("spawn", () => {
      this.cancelPendingRenders = true;
      process.stdout.cursorTo(0);
      process.stdin.setRawMode(false);
    });

    this.firebaseSpawn.on("exit", async (code) => {
      if (code === 0) {
        this.updateSavedInput();
      }
      this.cancelPendingRenders = false;
      process.stdout.cursorTo(0);
      const exitMessage =
        code === 0
          ? `${this.textGreen(
              "OnFire:"
            )} Command finished with exit code ${this.textGreen(
              code?.toString()
            )}\n`
          : `${this.textRed(
              "OnFire:"
            )} Command finished with exit code ${this.textRed(
              code?.toString()
            )}\n`;
      console.log(exitMessage);
      process.stdin.setRawMode(true);
      process.stdin.resume();

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
        this.renderIO();
      } else {
        process.stdout.write(this.input);
        this.shiftCursorPosition(this.input.length);
        this.renderIO();
      }
      this.firebaseSpawn = null;
    });
  }

  private async handleExit() {
    if (!this.isProcessingExit) {
      this.isProcessingExit = true;
      await CliCache.writeToFile(this.savedInput);
      process.exit();
    } else {
      console.log("\n Processing exit");
    }
  }

  private keyPressListener(str: string, key: any) {
    const prefixLen = this.prefix.length;
    let render = false;
    let tabCompletion = false;
    let newChar = "";
    const xPos = this.currentCursorPos.x - prefixLen;

    if (key.ctrl == true && key.name == "c") {
      if (this.firebaseSpawn === null) {
        this.handleExit();
      }
    } else if (key.name === "backspace") {
      if (xPos > 0) {
        render = true;
        this.listItemIndex = 0;
        const endString = this.input.trim().slice(xPos);
        this.input = this.input.slice(0, xPos - 1) + endString;
        this.currentCursorPos.x -= 1;
      }
    } else if (key.name === "return") {
      const _options = this.getCurrentCommandNullableOptions();
      const { base, args, options, input } = this.getCommandParams(
        this.input,
        _options
      ); // Used for debugging
      this.moveCursorToInputStart();
      this.shiftCursorPosition(this.input.length);
      this.listItemIndex = 0;
      this.createTerminalBuffer();
      this.clearTerminalDownward();
      // -------------- DEBUGGING --------------
      // console.log("\n -------------- DEBUGGING -------------- ");
      // console.log(_options);
      // console.log(this.input);
      // console.log(base);
      // console.log(args);
      // console.log(options);
      // console.log(input);
      // this.firebaseSpawnExit(0);
      // -------------- DEBUGGING --------------
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

  protected async loadFirebaseCommands() {
    this.firebaseCommands = await this.firebaseCli.getCommandConfig();

    // Attach custom commands
    this.firebaseCommands["exit"] = {
      description: "Exit the OnFire CLI",
      usage: "exit",
      options: null,
      args: null,
    };
    this.firebaseCommands["stopdropandroll"] = {
      description: "Exit the OnFire CLI same as 'exit'",
      usage: "stopdropandroll",
      options: null,
      args: null,
    };
  }

  async init() {
    const prefixLen = this.prefix.length;

    process.stdout.write("Loading");
    const loading = setInterval(() => {
      process.stdout.write(".");
    }, 200);
    try {
      await this.loadFirebaseCommands();
    } catch (error) {
      process.stdout.write(`\r\x1b[K`);
      console.log(`${this.textBold(this.textRed("Error:"))} ${error.message}`);
      process.exit(1);
    }
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
    this.renderIO();
    process.stdin.setRawMode(true);
    process.on("SIGINT", function () {
      console.log(`\x1b[32mOnFire:\x1b[0m Received SIGINT signal`);
    });
    process.stdin.on("keypress", (str, key) => {
      this.keyPressListener(str, key);
    });

    process.on("exit", () => {
      this.onExit();
    });
  }
}
