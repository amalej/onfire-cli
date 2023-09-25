import { OnFireCLI } from "../src/onfire-cli";
import { MockFirebaseCommands } from "./firebase-cmd.test";

interface SavedInput {
  pastCommands?: string[] | undefined;
  [key: string]: any;
}

class MockOnFireCLI extends OnFireCLI {
  _getCurrentCommandNullableOptions(): string[] {
    return this.getCurrentCommandNullableOptions();
  }

  _getCurrentCommandNonNullableOptions(): string[] {
    return this.getCurrentCommandNonNullableOptions();
  }

  _loadFirebaseCommands(): Promise<void> {
    return this.loadFirebaseCommands();
  }

  _setInput(str: string) {
    this.input = str;
  }

  _loadCommandOptions(str: string) {
    return this.firebaseCommands[str].options ?? [];
  }

  _setCursorPosition(x: number, y: number = 0) {
    // y position does not matter
    this.currentCursorPos = {
      x,
      y,
    };
  }

  _getTypedWord(): { word: string; start: number; end: number } {
    return this.getTypedWord();
  }

  _getTypeFlag(): { flag: string; start: number; end: number } {
    return this.getTypedFlag();
  }

  _updateSavedInput(): void {
    return this.updateSavedInput();
  }

  _getSavedInput(): SavedInput {
    return this.getSavedInput();
  }

  _setSavedInput(obj: Object): void {
    return this.setSavedInput(obj);
  }
}

const appdistribution = {
  distributeLen: 10,
  testers: {
    addLen: 5,
    removeLen: 5,
  },
};

describe("Run simple commands", () => {
  const cli = new MockOnFireCLI();
  beforeAll(async () => {
    await cli._loadFirebaseCommands();
  });

  it("Should return blank options for 'exit'", async () => {
    cli._setInput("exit");
    const _opts = cli._getCurrentCommandNullableOptions();
    expect(_opts).toEqual([]);
  });

  it("Should return blank options for 'stopdropandroll'", async () => {
    cli._setInput("stopdropandroll");
    const _opts = cli._getCurrentCommandNullableOptions();
    expect(_opts).toEqual([]);
  });

  it("Should return non-nullable options for 'appdistribution:distribute'", async () => {
    cli._setInput("appdistribution:distribute");
    const _opts = cli._getCurrentCommandNonNullableOptions();
    expect(_opts).toEqual([
      "--app",
      "--release-notes",
      "--release-notes-file",
      "--testers",
      "--testers-file",
      "--groups",
      "--groups-file",
      "--project",
    ]);
  });

  it("Should return blank options for 'invalidcommand'", async () => {
    cli._setInput("invalidcommand");
    const _opts = cli._getCurrentCommandNonNullableOptions();
    expect(_opts).toEqual([]);
  });

  it(`Should have ${appdistribution.distributeLen} options available for command 'appdistribution:distribute'`, async () => {
    cli._setInput("appdistribution:distribute");
    const _options = Object.keys(
      cli._loadCommandOptions("appdistribution:distribute")
    );

    expect(_options.length).toEqual(appdistribution.distributeLen);
  });

  it(`Should have ${appdistribution.testers.addLen} options available for command 'appdistribution:testers:add'`, async () => {
    cli._setInput("appdistribution:testers:add");
    const _options = Object.keys(
      cli._loadCommandOptions("appdistribution:testers:add")
    );

    expect(_options.length).toEqual(appdistribution.testers.addLen);
  });

  it(`Should have ${appdistribution.testers.removeLen} options available for command 'appdistribution:testers:remove'`, async () => {
    cli._setInput("appdistribution:testers:remove");
    const _options = Object.keys(
      cli._loadCommandOptions("appdistribution:testers:remove")
    );

    expect(_options.length).toEqual(appdistribution.testers.removeLen);
  });
});

describe("Get typed word", () => {
  const cli = new MockOnFireCLI();
  beforeAll(async () => {
    await cli._loadFirebaseCommands();
  });

  it(`Should show that the word currently being typed is '' for 'appdistribution:distribute --app   '`, async () => {
    cli._setInput("appdistribution:distribute --app");
    cli._setCursorPosition(cli.prefix.length + 35);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("");
  });

  it(`Should show that the word currently being typed is 'appdistribution:distribute' for 'appdistribution:distribute --app'`, async () => {
    cli._setInput("appdistribution:distribute --app");
    cli._setCursorPosition(cli.prefix.length + 2);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("appdistribution:distribute");
  });

  it(`Should show that the word currently being typed is '--app' for 'appdistribution:distribute --app'`, async () => {
    cli._setInput("appdistribution:distribute --app");
    cli._setCursorPosition(cli.prefix.length + 28);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("--app");
  });

  it(`Should show that the word currently being typed is '--functions:shell' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 15);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("functions:shell");
  });

  it(`Should show that the word currently being typed is '--port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 16);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("--port");
  });

  it(`Should show that the word currently being typed is '--port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 17);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("--port");
  });

  it(`Should show that the word currently being typed is '5000' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 27);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("5000");
  });

  it(`Should show that the word currently being typed is '--project' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 37);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("--project");
  });

  it(`Should show that the word currently being typed is 'demo-project' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 38);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("demo-project");
  });

  it(`Should show that the word currently being typed is 'This is release notes' for 'appdistribution:distribute --release-notes "This is release notes"'`, async () => {
    cli._setInput(
      'appdistribution:distribute --release-notes "This is release notes"'
    );
    cli._setCursorPosition(cli.prefix.length + 52);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual('"This is release notes"');
  });

  it(`Should show that the word currently being typed is 'This is release notes' for "appdistribution:distribute --release-notes 'This is release notes'"`, async () => {
    cli._setInput(
      "appdistribution:distribute --release-notes 'This is release notes'"
    );
    cli._setCursorPosition(cli.prefix.length + 52);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual("'This is release notes'");
  });

  it(`Should have release notes equal to "This is release notes, additional text" for 'appdistribution:distribute --release-notes "This is release notes, additional text"'`, async () => {
    cli._setInput(
      'appdistribution:distribute --release-notes "This is release notes, additional text"'
    );
    cli._setCursorPosition(cli.prefix.length + 52);

    const typedWord = cli._getTypedWord();
    expect(typedWord.word).toEqual('"This is release notes, additional text"');
  });
});

describe("Get typed flag", () => {
  const cli = new MockOnFireCLI();
  beforeAll(async () => {
    await cli._loadFirebaseCommands();
  });

  it(`Should show that the flag currently being inputted is '-app' for 'appdistribution:distribute --app '`, async () => {
    cli._setInput("appdistribution:distribute --app ");
    cli._setCursorPosition(cli.prefix.length + 33);

    const typedWord = cli._getTypeFlag();
    expect(typedWord.flag).toEqual("--app");
  });

  it(`Should show that the flag currently being inputted is '-app' for 'appdistribution:distribute --app='`, async () => {
    cli._setInput("appdistribution:distribute --app=");
    cli._setCursorPosition(cli.prefix.length + 33);

    const typedWord = cli._getTypeFlag();
    expect(typedWord.flag).toEqual("--app");
  });

  it(`Should show that the flag currently being inputted is '-app' for 'appdistribution:distribute --app=1:1234567890:ios:321abc456def7890'`, async () => {
    cli._setInput("appdistribution:distribute --app=");
    cli._setCursorPosition(cli.prefix.length + 37);

    const typedWord = cli._getTypeFlag();
    expect(typedWord.flag).toEqual("--app");
  });

  it(`Should show that the flag currently being inputted is '-port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 23);

    const typedWord = cli._getTypeFlag();
    expect(typedWord.flag).toEqual("--port");
  });

  it(`Should show that the flag currently being inputted is '-port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port 5000 --project=demo-project");
    cli._setCursorPosition(cli.prefix.length + 48);

    const typedWord = cli._getTypeFlag();
    expect(typedWord.flag).toEqual("--project");
  });

  it(`Should show that the flag currently being inputted is '-port' for 'functions:shell --port --project=demo-project'`, async () => {
    cli._setInput("functions:shell --port  --project");
    cli._setCursorPosition(cli.prefix.length + 23);

    const typedWord = cli._getTypeFlag();
    expect(typedWord.flag).toEqual("--port");
  });
});

describe("Update the saved inputs", () => {
  const cli = new MockOnFireCLI();
  beforeAll(async () => {
    await cli._loadFirebaseCommands();
  });

  it("Should show that --app input saved value is '1:1234567890:ios:321abc456def7890'", () => {
    cli._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890"
    );
    cli._updateSavedInput();
    const savedInput = cli._getSavedInput();
    expect(savedInput["--app"][0]).toEqual("1:1234567890:ios:321abc456def7890");
  });

  it("Should show that --project input saved value is 'demo-proj'", () => {
    cli._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890 --project demo-proj"
    );
    cli._updateSavedInput();
    const savedInput = cli._getSavedInput();
    expect(savedInput["--project"][0]).toEqual("demo-proj");
  });

  it("Should show that --project input saved value is 'demo-project', 'demo-proj'", () => {
    // First input
    cli._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890 --project demo-proj"
    );
    cli._updateSavedInput();
    // Second input
    cli._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890 --project demo-project"
    );
    cli._updateSavedInput();
    const savedInput = cli._getSavedInput();
    expect(savedInput["--project"]).toEqual(["demo-project", "demo-proj"]);
  });

  it("Should show that 'feature' input saved value is 'functions'", () => {
    cli._setInput("init functions --project demo-project");
    cli._updateSavedInput();
    const savedInput = cli._getSavedInput();
    expect(savedInput["--project"][0]).toEqual("demo-project");
    expect(savedInput["feature"][0]).toEqual("functions");
  });

  it("Should show that 'feature' input saved value is list 'functions,firestore'", () => {
    cli._setInput("init functions,firestore --project demo-project");
    cli._updateSavedInput();
    const savedInput = cli._getSavedInput();
    expect(savedInput["--project"][0]).toEqual("demo-project");
    expect(savedInput["feature"]).toEqual([
      "functions,firestore",
      "functions",
      "firestore",
    ]);
  });

  afterEach(() => {
    cli._setSavedInput({}); // Reset the saved input for each test
  });
});
