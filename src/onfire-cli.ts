import readline from "readline";
import { DEFAULT_FEATURES, FirebaseCommands } from "./firebase-cmd";
import { CommandLineInterface } from "./cli";
import { ChildProcess } from "child_process";
import { CliCache, MAX_CACHE_COUNT } from "./cli-cache";

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

interface SavedConfig {
  pastCommands?: string[] | undefined;
  [key: string]: any;
}

export class OnFireCLI extends CommandLineInterface {
  input = "";

  private firebaseSpawn: ChildProcess | null = null;
  private listItemIndex: number = 0;
  private itemList: Array<string> = [];
  private isProcessingExit = false;
  protected firebaseCommands: {
    [key: string]: CommandConfig;
  };
  private firebaseCli: FirebaseCommands;
  private savedConfig: SavedConfig;

  constructor({
    prefix = "",
    maxItemShown = 5,
    savedConfig = {},
  }: {
    prefix?: string;
    maxItemShown?: number;
    savedConfig?: SavedConfig;
  } = {}) {
    super({
      prefix,
      maxItemShown,
    });
    this.firebaseCli = new FirebaseCommands();
    this.savedConfig = savedConfig;
    // Modify the `init` inputs
    const features: string[] = this.savedConfig["feature"] || [];
    features.splice(MAX_CACHE_COUNT - DEFAULT_FEATURES.length);
    for (let feature of DEFAULT_FEATURES) {
      if (!features.includes(feature)) {
        features.push(feature);
      }
    }
    this.savedConfig["feature"] = features;
  }

  protected getSavedConfig() {
    return this.savedConfig;
  }

  protected setSavedConfig(obj: Object) {
    this.savedConfig = obj;
  }

  protected getFirebaseCommands() {
    return this.firebaseCommands;
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

  /**
   * Get a string array of flags that do not expect an argument
   * @returns An array of string
   */
  protected getCurrentCommandNonNullableOptions(): string[] {
    const { base } = this.getCommandParams(this.input);
    if (
      this.firebaseCommands[base] === undefined ||
      this.firebaseCommands[base].options === null
    ) {
      return [];
    }
    return Object.keys(this.firebaseCommands[base].options).filter(
      (opt) => this.firebaseCommands[base].options[opt].hint !== null
    );
  }

  private getCurrentCommandArgs() {
    const { base } = this.getCommandParams(this.input);
    if (this.firebaseCommands[base] === undefined) {
      return [];
    }
    return Object.keys(this.firebaseCommands[base].args);
  }

  protected getItemsToDisplay(itemList: string[]) {
    return itemList.slice(this.displayBuffer.start, this.displayBuffer.end);
  }

  protected sortItemList(list: string[], reference: string) {
    return list.sort((a, b) =>
      a.startsWith(reference)
        ? b.startsWith(reference)
          ? 0
          : -1
        : a.includes(reference)
        ? b.includes(reference)
          ? 0
          : -1
        : !b.includes(reference)
        ? 0
        : 1
    );
  }

  protected getPastCommandsToRender(): string[] {
    const renderMessage = [];
    const list = this.savedConfig.pastCommands || [];
    this.itemList = list;
    const slicedList = this.getItemsToDisplay(list);
    for (let i = 0; i < this.itemList.length; i++) {
      const command = this.itemList[i];
      if (!slicedList.includes(command)) continue;
      if (command !== undefined) {
        const msg =
          i === this.listItemIndex
            ? `${this.textCyan(this.textBold(">"))} ${this.textGreen(
                this.textBold(command)
              )}`
            : `  ${this.textBold(command)}`;
        renderMessage.push(`${msg}\x1b[K`);
      }
    }
    return renderMessage;
  }

  protected getCommandsToRender(): string[] {
    const renderMessage = [];
    const { base } = this.getCommandParams(this.input);
    const list = Object.keys(this.firebaseCommands);

    const regExp = new RegExp(
      `${base
        .split("")
        .map((c) => c.replace(/[^a-z|:|A-Z]/g, (c) => `\\${c}`))
        .join(".*")}`
    );
    const filteredList = this.sortItemList(
      list.filter((command: string) => command.match(regExp)),
      base
    );

    this.itemList = filteredList;
    const slicedList = this.getItemsToDisplay(filteredList);

    for (let i = 0; i < this.itemList.length; i++) {
      const command = this.itemList[i];
      if (!slicedList.includes(command)) continue;
      if (command !== undefined) {
        const cmdLabel = `-> ${this.firebaseCommands[command].description}`;
        const msg =
          i === this.listItemIndex
            ? `${this.textCyan(this.textBold(">"))} ${this.textGreen(
                this.textBold(command)
              )} ${this.textGreen(cmdLabel)}`
            : `  ${this.textBold(command)} ${cmdLabel}`;
        renderMessage.push(`${msg}\x1b[K`);
      }
    }
    return renderMessage;
  }

  protected getCommandOptionsToRender(): string[] {
    const renderMessage = [];
    const { base, args, options } = this.getCommandParams(this.input);
    const typedWord = this.getTypedWord();
    const _options = this.firebaseCommands[base].options || {};
    const list = Object.keys(_options);
    const argList = Object.keys(args);

    const regExp = new RegExp(
      `${typedWord.word
        .split("")
        .map((c) => c.replace(/[^a-z|:|A-Z]/g, (c) => `\\${c}`))
        .join(".*")}`
    );
    const filteredList = this.sortItemList(
      list.filter(
        (_option) =>
          _option.match(regExp) &&
          ((!argList.includes(_option) && !options.includes(_option)) ||
            _option === typedWord.word)
      ),
      typedWord.word
    );
    this.itemList = filteredList;

    const slicedList = this.getItemsToDisplay(filteredList);

    for (let i = 0; i < this.itemList.length; i++) {
      const _option = this.itemList[i];
      if (!slicedList.includes(_option)) continue;
      if (_option !== undefined) {
        const optString = `${_option} ${_options[_option].hint || ""}`;
        const optDescription = `-> ${_options[_option].description}`;
        const msg =
          i === this.listItemIndex
            ? `${this.textCyan(this.textBold(">"))} ${this.textGreen(
                this.textBold(optString)
              )} ${this.textGreen(optDescription)}`
            : `  ${this.textBold(optString)} ${optDescription}`;
        renderMessage.push(`${msg}\x1b[K`);
      }
    }
    return renderMessage;
  }

  private renderPastCommands() {
    this.clearTerminalDownward();
    console.log("");
    const renderMessage = this.getPastCommandsToRender();
    for (let i = 0; i < renderMessage.length; i++) {
      console.log(renderMessage[i]);
    }
  }

  private renderCommandList() {
    this.clearTerminalDownward();
    console.log("");
    const renderMessage = this.getCommandsToRender();
    for (let i = 0; i < renderMessage.length; i++) {
      console.log(renderMessage[i]);
    }
  }

  private renderCommandOptions() {
    const { base, args, options } = this.getCommandParams(this.input);
    this.clearTerminalDownward();
    this.renderCommandInfo({ highlight: "options" });
    const cmdConfig = this.firebaseCommands[base];
    if (cmdConfig !== undefined) {
      const renderMessage = this.getCommandOptionsToRender();
      for (let i = 0; i < renderMessage.length; i++) {
        console.log(renderMessage[i]);
      }
    } else {
      console.log(`${this.textBold(this.textRed("Error:"))} Command not found`);
    }
  }

  private renderCommandArgs() {
    const { base, input } = this.getCommandParams(this.input);
    this.clearTerminalDownward();
    // TODO: Handle args input and multiple args input
    const typedWord = this.getTypedWord();
    const inputIndexShift = typedWord.word === "" ? 0 : 1;
    const inputIndex = input.length - inputIndexShift;
    const argName = Object.keys(this.firebaseCommands[base].args)[inputIndex];
    this.renderCommandInfo({ highlight: argName });
    const list = this.savedConfig[argName] || [];

    const filteredList = list.filter((argVal: string) =>
      argVal.startsWith(typedWord.word)
    );
    this.itemList = filteredList;
    const slicedList = this.getItemsToDisplay(filteredList);

    for (let i = 0; i < this.itemList.length; i++) {
      const command = this.itemList[i];
      if (!slicedList.includes(command)) continue;
      if (command !== undefined) {
        const msg =
          i === this.listItemIndex
            ? `${this.textCyan(this.textBold(">"))} ${this.textGreen(
                this.textBold(command)
              )}`
            : `  ${this.textBold(command)}`;
        console.log(`${msg}\x1b[K`);
      } else {
        console.log(`-\x1b[K`);
      }
    }
  }

  private renderOptionValues() {
    const { base } = this.getCommandParams(this.input);
    this.clearTerminalDownward();
    // TODO: Handle option input and multiple option input
    console.log("");
    const typedFlag = this.getTypedFlag();
    const msg = `${this.textBold(
      this.textYellow("Description:")
    )} ${this.capitalizeFirstLetter(
      this.firebaseCommands[base].options[typedFlag.flag].description
    )}`;
    console.log(msg);
    const typedWord = this.getTypedWord();
    const list = this.savedConfig[typedFlag.flag] || [];
    const filteredList = list.filter((argVal: string) =>
      argVal.startsWith(typedWord.word.replace(/--.*=/g, ""))
    );
    this.itemList = filteredList;
    const slicedList = this.getItemsToDisplay(filteredList);

    for (let i = 0; i < this.itemList.length; i++) {
      const command = this.itemList[i];
      if (!slicedList.includes(command)) continue;
      if (command !== undefined) {
        const msg =
          i === this.listItemIndex
            ? `${this.textCyan(this.textBold(">"))} ${this.textGreen(
                this.textBold(command)
              )}`
            : `  ${this.textBold(command)}`;
        console.log(`${msg}\x1b[K`);
      } else {
        console.log(`-\x1b[K`);
      }
    }
  }

  private renderCommandInfo({ highlight }: { highlight?: string } = {}) {
    this.clearTerminalDownward();
    console.log("");
    const { base, options } = this.getCommandParams(this.input);
    const _options = this.firebaseCommands[base].options || {};
    const list = Object.keys(_options);
    const missingArgs: Array<CommandOptionsConfig> = [];
    const cmdConfig = this.firebaseCommands[base];
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
      // TODO: improve matching. try to avoid using regex
      const regExp = new RegExp(`(\\b${highlight}\\b)(?!.*\\1)`);
      console.log(
        `${this.textBold(this.textYellow("Usage:"))} ${cmdConfig.usage.replace(
          regExp,
          (str) => this.textGreen(str)
        )}`
      );
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
    const _nonNullOptions = this.getCurrentCommandNonNullableOptions();
    const typedWord = this.getTypedWord();
    const typedFlag = this.getTypedFlag();
    const { base, args, options, input } = this.getCommandParams(
      this.input,
      _options
    );

    if (base === "") {
      this.renderPastCommands();
    } else if (base.length + this.prefix.length >= this.currentCursorPos.x) {
      this.renderCommandList();
    } else if (this.firebaseCommands[base]) {
      if (
        _nonNullOptions.includes(typedFlag.flag) &&
        !typedWord.word.replace(/--.*=/g, "").startsWith("-") &&
        (args[typedFlag.flag] === undefined ||
          args[typedFlag.flag] === "" ||
          args[typedFlag.flag] === typedWord.word.replace(/--.*=/g, ""))
      ) {
        this.renderOptionValues();
      } else if (typedWord.word.startsWith("-")) {
        this.renderCommandOptions();
        // }
        // else if (
        //   Object.keys(this.firebaseCommands[base].args).length > input.length
        // ) {
        //   this.renderCommandArgs();
      } else {
        // this.itemList = [];
        // this.renderCommandInfo();
        this.renderCommandArgs();
      }
    } else {
      this.itemList = [];
      this.clearTerminalDownward();
    }
    this.moveCursorToSavedCurrentPos();
  }

  protected handleTabCompletion() {
    const typedWord = this.getTypedWord();
    if (this.itemList[this.listItemIndex] !== undefined) {
      const xPos = this.currentCursorPos.x - this.prefix.length;
      this.shiftCursorPosition(-(xPos - typedWord.start));
      process.stdout.write(
        `${this.itemList[this.listItemIndex]}${this.input.slice(typedWord.end)}`
      );
      this.input = `${this.input.slice(0, typedWord.start)}${
        this.itemList[this.listItemIndex]
      }${this.input.slice(typedWord.end)}`;
      this.shiftCursorPosition(this.itemList[this.listItemIndex].length);
      this.listItemIndex = 0;
    }
  }

  protected getTypedWord(): {
    word: string;
    start: number;
    end: number;
  } {
    const posX = this.currentCursorPos.x - this.prefix.length;
    const words = this.input
      .replace(/=/g, " ")
      .match(/(".*?"|'.*?'|[^"\s]+)+(?=\s*|\s*$)/g) || [""];
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

  protected getTypedFlag(): {
    flag: string;
    start: number;
    end: number;
  } {
    const posX = this.currentCursorPos.x - this.prefix.length;
    const trimmedInput = this.input.slice(0, posX);
    const _options = this.getCurrentCommandNullableOptions();
    const { flags } = this.getCommandParams(trimmedInput, _options);

    const argFlags = flags;
    const words = this.input
      .replace(/=/g, " ")
      .match(/(".*?"|'.*?'|[^"\s]+)+(?=\s*|\s*$)/g) || [""];
    for (let i = 0; i < words.length; i++) {
      const currentLen = words.slice(0, i + 1).join("").length + i;
      if (posX <= currentLen) {
        return {
          flag: argFlags.at(-1),
          start: currentLen - words[i].length,
          end: currentLen,
        };
      }
    }

    return {
      flag: argFlags.at(-1),
      start: posX,
      end: posX,
    };
  }

  private onExit() {
    this.clearTerminalDownward();
    console.log("");
    console.log(`${this.textGreen("OnFire:")} exit`);
  }

  protected updateSavedConfig() {
    const _options = this.getCurrentCommandNullableOptions();
    const { base, args, input } = this.getCommandParams(this.input, _options);
    const cmdInput = this.input.trim();

    // Handle past commands
    if (this.savedConfig.pastCommands === undefined) {
      this.savedConfig.pastCommands = [cmdInput];
    } else {
      if (this.savedConfig.pastCommands.includes(cmdInput)) {
        this.savedConfig.pastCommands.sort((x: string, y: string) => {
          return x == cmdInput ? -1 : y == cmdInput ? 1 : 0;
        });
      } else {
        this.savedConfig.pastCommands.unshift(cmdInput);
        if (this.savedConfig.pastCommands.length >= MAX_CACHE_COUNT) {
          this.savedConfig.pastCommands = this.savedConfig.pastCommands.splice(
            0,
            MAX_CACHE_COUNT
          );
        }
      }
    }

    // Handle options args
    const optArgFlags = Object.keys(args);
    for (let i = 0; i < optArgFlags.length; i++) {
      const optArgFlag = optArgFlags[i];
      if (this.savedConfig[optArgFlag] === undefined) {
        if (args[optArgFlag].includes(",")) {
          const _splitArg =
            args[optArgFlag].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          this.savedConfig[optArgFlag] = [args[optArgFlag], ..._splitArg];
        } else {
          this.savedConfig[optArgFlag] = [args[optArgFlag]];
        }
      } else {
        if (args[optArgFlag].includes(",")) {
          const _splitArg =
            args[optArgFlag].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          if (_splitArg.length !== 0) {
            this.savedConfig[optArgFlag].unshift(..._splitArg);
          }
        }
        this.savedConfig[optArgFlag].unshift(args[optArgFlag]);
        this.savedConfig[optArgFlag] = [
          ...new Set(this.savedConfig[optArgFlag]),
        ];
      }
    }

    // Handle commands args
    const cmdArgConfig = this.firebaseCommands[base].args;
    const argFlags = Object.keys(cmdArgConfig);
    for (let i = 0; i < argFlags.length; i++) {
      if (input[i] === undefined) continue; // In case user does not input a command argument
      const argFlag = argFlags[i];
      if (this.savedConfig[argFlag] === undefined) {
        if (input[i].includes(",")) {
          const _splitArg =
            input[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          this.savedConfig[argFlag] = [input[i], ..._splitArg];
        } else {
          this.savedConfig[argFlag] = [input[i]];
        }
      } else {
        if (input[i].includes(",")) {
          const _splitArg =
            input[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          if (_splitArg.length !== 0) {
            this.savedConfig[argFlag].unshift(..._splitArg);
          }
        }
        this.savedConfig[argFlag].unshift(input[i]);
        this.savedConfig[argFlag] = [...new Set(this.savedConfig[argFlag])];
      }
    }
  }

  private async runCommand({
    debugging = false,
  }: { debugging?: boolean } = {}) {
    const { base } = this.getCommandParams(this.input);
    if (base === "exit" || base === "stopdropandroll") {
      this.handleExit();
    }
    this.clearTerminalDownward();
    console.log(`\x1b[K`);

    if (debugging) {
      const _options = this.getCurrentCommandNullableOptions();
      const { base, args, options, input } = this.getCommandParams(
        this.input,
        _options
      ); // Used for debugging
      console.log("\n -------------- DEBUGGING FULL ARG INFO-------------- ");
      console.log("command arg:", this.firebaseCommands[base].args);
      console.log("command options:", this.firebaseCommands[base].options);
      console.log("\n -------------- DEBUGGING -------------- ");
      console.log("this.input:", this.input);
      console.log("base:", base);
      console.log("args:", args);
      console.log("options:", options);
      console.log("input:", input);
      this.updateSavedConfig();
      process.stdout.cursorTo(0);
      console.log(this.savedConfig);
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

      this.input = "";
      this.moveCursorToInputStart();
      this.renderIO();
    } else {
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
        process.stdout.cursorTo(0);
        process.stdin.setRawMode(false);
      });

      this.firebaseSpawn.on("exit", async (code) => {
        if (code === 0) {
          this.updateSavedConfig();
        }
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
  }

  private async handleExit() {
    if (!this.isProcessingExit) {
      this.isProcessingExit = true;
      await CliCache.writeToFile(this.savedConfig);
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
        this.displayBuffer = {
          start: 0,
          end: this.maxItemShown,
        };
        const endString = this.input.trim().slice(xPos);
        this.input = this.input.slice(0, xPos - 1) + endString;
        this.currentCursorPos.x -= 1;
      }
    } else if (key.name === "return") {
      this.moveCursorToInputStart();
      this.shiftCursorPosition(this.input.length);
      this.listItemIndex = 0;
      this.displayBuffer = {
        start: 0,
        end: this.maxItemShown,
      };
      this.createTerminalBuffer();
      this.clearTerminalDownward();
      this.runCommand({ debugging: true }); // TODO: Set to true for debugging mode. Implement a better way to debug
    } else if (key.name === "up") {
      if (this.listItemIndex > 0) {
        this.listItemIndex -= 1;
        if (this.listItemIndex < this.displayBuffer.start) {
          this.displayBuffer.start -= 1;
          this.displayBuffer.end -= 1;
        }
        render = true;
      }
    } else if (key.name === "down") {
      if (this.listItemIndex < this.itemList.length - 1) {
        this.listItemIndex += 1;
        if (this.listItemIndex >= this.displayBuffer.end) {
          this.displayBuffer.start += 1;
          this.displayBuffer.end += 1;
        }
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
      this.displayBuffer = {
        start: 0,
        end: this.maxItemShown,
      };
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

  private attachCustomCommands() {
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

  protected async loadFirebaseCommands() {
    if (this.savedConfig["firebaseCommands"] === undefined) {
      this.firebaseCommands = await this.firebaseCli.getCommandConfig();
    } else {
      this.firebaseCommands = this.savedConfig["firebaseCommands"];
      this.firebaseCli.getCommandConfig().then((firebaseCommands) => {
        this.firebaseCommands = firebaseCommands;
        this.savedConfig["firebaseCommands"] = this.firebaseCommands;
        this.attachCustomCommands();
      });
    }
    this.attachCustomCommands();
    this.savedConfig["firebaseCommands"] = this.firebaseCommands;
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
