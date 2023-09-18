interface CursorPosition {
  x: number;
  y: number;
}

export class CommandLineInterface {
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
    this.displayDownBuffer = Math.ceil(maxItemShown * 2) + 4;
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

  /**
   * Get the parameters passed into a command
   * @param command The entire command as a string
   * @param options Commands flags that do not expect an argument
   * @returns
   */
  protected getCommandParams(
    command: string,
    options: Array<string> = []
  ): {
    base: string;
    args: {
      [key: string]: string;
    };
    flags: Array<string>;
    options: Array<string>;
    input: Array<string>;
  } {
    const args = command.match(/(".*?"|'.*?'|[^"\s]+)+(?=\s*|\s*$)/g) || [""];
    // const args = command.split(" ");
    let _base = args[0];
    let _arguments = {};
    let _options = [];
    let _flags = [];
    let _input = [];
    if (args === null) return null;
    for (let i = 1; i < args.length; i++) {
      if (args[i].includes("=")) {
        const splitArg = args[i].split("=");
        if (_arguments === null) {
          _arguments = {
            [splitArg[0]]: splitArg[1],
          };
        } else {
          _arguments[splitArg[0]] = splitArg[1];
        }
        _flags.push(splitArg[0]);
      } else if (args[i].startsWith("-")) {
        if (
          args.length - 1 === i ||
          args[i + 1].startsWith("-") ||
          args[i + 1] === "" ||
          options.includes(args[i])
        ) {
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

        _flags.push(args[i]);
        if (!options.includes(args[i]) && !args[i + 1]?.startsWith("-")) {
          i++; // TODO: This might introduce bugs, remove if it does.
        }
      } else {
        if (args[i] !== "") {
          _input.push(args[i]);
        }
      }
    }

    return {
      base: _base,
      args: _arguments,
      options: _options,
      flags: _flags,
      input: _input,
    };
  }

  protected moveCursorToInputStart() {
    this.currentCursorPos = {
      x: this.originalCursorPos.x + this.prefix.length,
      y: this.originalCursorPos.y,
    };
    this.moveCursorToSavedCurrentPos();
  }

  protected textRed(str: string) {
    return `\x1b[31m${str}\x1b[0m`;
  }

  protected textGreen(str: string) {
    return `\x1b[32m${str}\x1b[0m`;
  }

  protected textYellow(str: string) {
    return `\x1b[33m${str}\x1b[0m`;
  }

  protected textBold(str: string) {
    return `\x1b[1m${str}\x1b[0m`;
  }

  protected capitalizeFirstLetter(str: string) {
    return str[0].toUpperCase() + str.slice(1);
  }
}
