import { CommandLineInterface } from "../src/cli";

class MockCommandLineInterface extends CommandLineInterface {
  _getCommandParams(
    command: string,
    options?: string[]
  ): {
    base: string;
    args: { [key: string]: string };
    flags: string[];
    options: string[];
    input: string[];
  } {
    return this.getCommandParams(command, options);
  }

  _textRed(str: string): string {
    return this.textRed(str);
  }

  _textGreen(str: string): string {
    return this.textGreen(str);
  }

  _textYellow(str: string): string {
    return this.textYellow(str);
  }

  _textBold(str: string): string {
    return this.textBold(str);
  }

  _capitalizeFirstLetter(str: string): string {
    return this.capitalizeFirstLetter(str);
  }
}

describe("Text formatting", () => {
  const cli = new MockCommandLineInterface();
  const text = "Hello World";

  it("Should make the text red", () => {
    const wrappedText = cli._textRed(text);
    expect(wrappedText).toBe(`\x1b[31m${text}\x1b[0m`);
  });

  it("Should make the text green", () => {
    const wrappedText = cli._textGreen(text);
    expect(wrappedText).toBe(`\x1b[32m${text}\x1b[0m`);
  });

  it("Should make the text yellow", () => {
    const wrappedText = cli._textYellow(text);
    expect(wrappedText).toBe(`\x1b[33m${text}\x1b[0m`);
  });

  it("Should make the text bold", () => {
    const wrappedText = cli._textBold(text);
    expect(wrappedText).toBe(`\x1b[1m${text}\x1b[0m`);
  });

  it("Should capitalize the first letter of 'this is a sentence'", () => {
    const wrappedText = cli._capitalizeFirstLetter("this is a sentence");
    expect(wrappedText).toBe(`This is a sentence`);
  });
});

describe("Deconstuct commands", () => {
  const cli = new MockCommandLineInterface();

  it("Should deconstuct 'appdistribution:distribute bin_file --app app_id'", () => {
    const command = `appdistribution:distribute bin_file --app app_id`;
    const { base, args, input } = cli._getCommandParams(command);

    expect(base).toBe("appdistribution:distribute");
    expect(input.includes("bin_file")).toBe(true);
    expect(args["--app"]).toBe("app_id");
  });

  it("Should deconstuct 'appdistribution:distribute --debug bin_file --app app_id'", () => {
    const command = `appdistribution:distribute --debug bin_file --app app_id`;
    const { base, args, options, input } = cli._getCommandParams(command, [
      "--debug",
    ]);

    expect(base).toBe("appdistribution:distribute");
    expect(options.includes("--debug")).toBe(true);
    expect(input[0]).toBe("bin_file");
    expect(args["--app"]).toBe("app_id");
  });

  it("Should deconstuct 'appdistribution:distribute --debug --app app_id bin_file'", () => {
    const command = `appdistribution:distribute --app app_id bin_file --debug`;
    const { base, args, options, input } = cli._getCommandParams(command, [
      "--debug",
    ]);

    expect(base).toBe("appdistribution:distribute");
    expect(options.includes("--debug")).toBe(true);
    expect(input[0]).toBe("bin_file");
    expect(args["--app"]).toBe("app_id");
  });

  it(`Should deconstuct command with '=' sign: 'appdistribution:distribute --debug --app=app_id bin_file --release-notes "This is the release notes" --project=demo-proj'`, () => {
    const command = `appdistribution:distribute --debug --app=app_id bin_file --release-notes "This is the release notes" --project=demo-proj"`;
    const { base, args, options, input } = cli._getCommandParams(command, [
      "--debug",
    ]);

    expect(base).toBe("appdistribution:distribute");
    expect(options.includes("--debug")).toBe(true);
    expect(input[0]).toBe("bin_file");
    expect(args["--app"]).toBe("app_id");
    expect(args["--project"]).toBe("demo-proj");
    expect(args["--release-notes"]).toBe(`"This is the release notes"`);
  });

  it("Should list all flags passed for 'appdistribution:distribute --debug --app app_id bin_file --project demo-proj'", () => {
    const command = `appdistribution:distribute --debug --app app_id bin_file --project demo-proj`;
    const { flags } = cli._getCommandParams(command, ["--debug"]);

    expect(flags).toEqual(["--debug", "--app", "--project"]);
  });
});
