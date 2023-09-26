import { OnFireCLI } from "../src/onfire-cli";
import { MockCommandLineInterface } from "./cli.test";

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

  _getPastCommandsToRender(): string[] {
    return this.getPastCommandsToRender();
  }

  _getCommandsToRender(): string[] {
    return this.getCommandsToRender();
  }

  _getCommandOptionsToRender(): string[] {
    return this.getCommandOptionsToRender();
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
  const onfireCLI = new MockOnFireCLI();
  beforeAll(async () => {
    await onfireCLI._loadFirebaseCommands();
  });

  it("Should return blank options for 'exit'", async () => {
    onfireCLI._setInput("exit");
    const _opts = onfireCLI._getCurrentCommandNullableOptions();
    expect(_opts).toEqual([]);
  });

  it("Should return blank options for 'stopdropandroll'", async () => {
    onfireCLI._setInput("stopdropandroll");
    const _opts = onfireCLI._getCurrentCommandNullableOptions();
    expect(_opts).toEqual([]);
  });

  it("Should return non-nullable options for 'appdistribution:distribute'", async () => {
    onfireCLI._setInput("appdistribution:distribute");
    const _opts = onfireCLI._getCurrentCommandNonNullableOptions();
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
    onfireCLI._setInput("invalidcommand");
    const _opts = onfireCLI._getCurrentCommandNonNullableOptions();
    expect(_opts).toEqual([]);
  });

  it(`Should have ${appdistribution.distributeLen} options available for command 'appdistribution:distribute'`, async () => {
    onfireCLI._setInput("appdistribution:distribute");
    const _options = Object.keys(
      onfireCLI._loadCommandOptions("appdistribution:distribute")
    );

    expect(_options.length).toEqual(appdistribution.distributeLen);
  });

  it(`Should have ${appdistribution.testers.addLen} options available for command 'appdistribution:testers:add'`, async () => {
    onfireCLI._setInput("appdistribution:testers:add");
    const _options = Object.keys(
      onfireCLI._loadCommandOptions("appdistribution:testers:add")
    );

    expect(_options.length).toEqual(appdistribution.testers.addLen);
  });

  it(`Should have ${appdistribution.testers.removeLen} options available for command 'appdistribution:testers:remove'`, async () => {
    onfireCLI._setInput("appdistribution:testers:remove");
    const _options = Object.keys(
      onfireCLI._loadCommandOptions("appdistribution:testers:remove")
    );

    expect(_options.length).toEqual(appdistribution.testers.removeLen);
  });
});

describe("Get typed word", () => {
  const onfireCLI = new MockOnFireCLI();
  beforeAll(async () => {
    await onfireCLI._loadFirebaseCommands();
  });

  it(`Should show that the word currently being typed is '' for 'appdistribution:distribute --app   '`, async () => {
    onfireCLI._setInput("appdistribution:distribute --app");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 35);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("");
  });

  it(`Should show that the word currently being typed is 'appdistribution:distribute' for 'appdistribution:distribute --app'`, async () => {
    onfireCLI._setInput("appdistribution:distribute --app");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 2);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("appdistribution:distribute");
  });

  it(`Should show that the word currently being typed is '--app' for 'appdistribution:distribute --app'`, async () => {
    onfireCLI._setInput("appdistribution:distribute --app");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 28);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("--app");
  });

  it(`Should show that the word currently being typed is '--functions:shell' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 15);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("functions:shell");
  });

  it(`Should show that the word currently being typed is '--port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 16);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("--port");
  });

  it(`Should show that the word currently being typed is '--port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 17);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("--port");
  });

  it(`Should show that the word currently being typed is '5000' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 27);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("5000");
  });

  it(`Should show that the word currently being typed is '--project' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 37);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("--project");
  });

  it(`Should show that the word currently being typed is 'demo-project' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 38);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("demo-project");
  });

  it(`Should show that the word currently being typed is 'This is release notes' for 'appdistribution:distribute --release-notes "This is release notes"'`, async () => {
    onfireCLI._setInput(
      'appdistribution:distribute --release-notes "This is release notes"'
    );
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 52);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual('"This is release notes"');
  });

  it(`Should show that the word currently being typed is 'This is release notes' for "appdistribution:distribute --release-notes 'This is release notes'"`, async () => {
    onfireCLI._setInput(
      "appdistribution:distribute --release-notes 'This is release notes'"
    );
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 52);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual("'This is release notes'");
  });

  it(`Should have release notes equal to "This is release notes, additional text" for 'appdistribution:distribute --release-notes "This is release notes, additional text"'`, async () => {
    onfireCLI._setInput(
      'appdistribution:distribute --release-notes "This is release notes, additional text"'
    );
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 52);

    const typedWord = onfireCLI._getTypedWord();
    expect(typedWord.word).toEqual('"This is release notes, additional text"');
  });
});

describe("Get typed flag", () => {
  const onfireCLI = new MockOnFireCLI();
  beforeAll(async () => {
    await onfireCLI._loadFirebaseCommands();
  });

  it(`Should show that the flag currently being inputted is '-app' for 'appdistribution:distribute --app '`, async () => {
    onfireCLI._setInput("appdistribution:distribute --app ");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 33);

    const typedWord = onfireCLI._getTypeFlag();
    expect(typedWord.flag).toEqual("--app");
  });

  it(`Should show that the flag currently being inputted is '-app' for 'appdistribution:distribute --app='`, async () => {
    onfireCLI._setInput("appdistribution:distribute --app=");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 33);

    const typedWord = onfireCLI._getTypeFlag();
    expect(typedWord.flag).toEqual("--app");
  });

  it(`Should show that the flag currently being inputted is '-app' for 'appdistribution:distribute --app=1:1234567890:ios:321abc456def7890'`, async () => {
    onfireCLI._setInput("appdistribution:distribute --app=");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 37);

    const typedWord = onfireCLI._getTypeFlag();
    expect(typedWord.flag).toEqual("--app");
  });

  it(`Should show that the flag currently being inputted is '-port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 23);

    const typedWord = onfireCLI._getTypeFlag();
    expect(typedWord.flag).toEqual("--port");
  });

  it(`Should show that the flag currently being inputted is '-port' for 'functions:shell --port 5000 --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port 5000 --project=demo-project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 48);

    const typedWord = onfireCLI._getTypeFlag();
    expect(typedWord.flag).toEqual("--project");
  });

  it(`Should show that the flag currently being inputted is '-port' for 'functions:shell --port --project=demo-project'`, async () => {
    onfireCLI._setInput("functions:shell --port  --project");
    onfireCLI._setCursorPosition(onfireCLI.prefix.length + 23);

    const typedWord = onfireCLI._getTypeFlag();
    expect(typedWord.flag).toEqual("--port");
  });
});

describe("Update the saved inputs", () => {
  const onfireCLI = new MockOnFireCLI();
  beforeAll(async () => {
    await onfireCLI._loadFirebaseCommands();
  });

  it("Should show that --app input saved value is '1:1234567890:ios:321abc456def7890'", () => {
    onfireCLI._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890"
    );
    onfireCLI._updateSavedInput();
    const savedInput = onfireCLI._getSavedInput();
    expect(savedInput["--app"][0]).toEqual("1:1234567890:ios:321abc456def7890");
  });

  it("Should show that --project input saved value is 'demo-proj'", () => {
    onfireCLI._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890 --project demo-proj"
    );
    onfireCLI._updateSavedInput();
    const savedInput = onfireCLI._getSavedInput();
    expect(savedInput["--project"][0]).toEqual("demo-proj");
  });

  it("Should show that --project input saved value is 'demo-project', 'demo-proj'", () => {
    // First input
    onfireCLI._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890 --project demo-proj"
    );
    onfireCLI._updateSavedInput();
    // Second input
    onfireCLI._setInput(
      "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890 --project demo-project"
    );
    onfireCLI._updateSavedInput();
    const savedInput = onfireCLI._getSavedInput();
    expect(savedInput["--project"]).toEqual(["demo-project", "demo-proj"]);
  });

  it("Should show that 'feature' input saved value is 'functions'", () => {
    onfireCLI._setInput("init functions --project demo-project");
    onfireCLI._updateSavedInput();
    const savedInput = onfireCLI._getSavedInput();
    expect(savedInput["--project"][0]).toEqual("demo-project");
    expect(savedInput["feature"][0]).toEqual("functions");
  });

  it("Should show that 'feature' input saved value is list 'functions,firestore'", () => {
    onfireCLI._setInput("init functions,firestore --project demo-project");
    onfireCLI._updateSavedInput();
    const savedInput = onfireCLI._getSavedInput();
    expect(savedInput["--project"][0]).toEqual("demo-project");
    expect(savedInput["feature"]).toEqual([
      "functions,firestore",
      "functions",
      "firestore",
    ]);
  });

  afterEach(() => {
    onfireCLI._setSavedInput({}); // Reset the saved input for each test
  });
});

describe("Test getting rendering list", () => {
  const onfireCLI = new MockOnFireCLI();
  const cli = new MockCommandLineInterface();

  beforeAll(async () => {
    await onfireCLI._loadFirebaseCommands();
  });

  describe("Load less than 2 past commands", () => {
    beforeAll(() => {
      onfireCLI._setInput(
        "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890"
      );
      onfireCLI._updateSavedInput();
      onfireCLI._setInput(
        "emulators:start --project demo-project-4 --debug --only functions"
      );
      onfireCLI._updateSavedInput();
    });

    it("Should show that there a 2 past commands", () => {
      const renderMessage = onfireCLI._getPastCommandsToRender();
      expect(renderMessage.length).toEqual(2);
    });

    it("Should show that the selected past command in index [0] is 'emulators:start --project demo-project-4 --debug --only functions'", () => {
      const renderMessage = onfireCLI._getPastCommandsToRender();
      console.log(renderMessage);
      expect(renderMessage[0]).toEqual(
        `${cli._textCyan(cli._textBold(">"))} ${cli._textGreen(
          cli._textBold(
            "emulators:start --project demo-project-4 --debug --only functions"
          )
        )}\x1b[K`
      );
    });

    it("Should show that the unselected past command in index [1] is 'appdistribution:distribute --app=1:1234567890:ios:321abc456def7890'", () => {
      const renderMessage = onfireCLI._getPastCommandsToRender();
      console.log(renderMessage);
      expect(renderMessage[1]).toEqual(
        `  ${cli._textBold(
          "appdistribution:distribute --app=1:1234567890:ios:321abc456def7890"
        )}\x1b[K`
      );
    });
  });

  describe("Load commands to render", () => {
    beforeAll(() => {
      onfireCLI._setInput("appdistribution");
    });

    it("Should show that there are 5 commands to render", () => {
      const renderMessage = onfireCLI._getCommandsToRender();
      expect(renderMessage.length).toEqual(5);
    });

    it("Should show that the selected command in index [0] is 'appdistribution:distribute -> upload a release binary'", () => {
      const renderMessage = onfireCLI._getCommandsToRender();
      const cmdLabel = `-> upload a release binary`;
      expect(renderMessage[0]).toEqual(
        `${cli._textCyan(cli._textBold(">"))} ${cli._textGreen(
          cli._textBold("appdistribution:distribute")
        )} ${cli._textGreen(cmdLabel)}\x1b[K`
      );
    });

    it("Should show that the unselected command in index [1] is 'appdistribution:testers:add -> add testers to project (and possibly group)'", () => {
      const renderMessage = onfireCLI._getCommandsToRender();
      const cmdLabel = `-> add testers to project (and possibly group)`;
      expect(renderMessage[1]).toEqual(
        `  ${cli._textBold("appdistribution:testers:add")} ${cmdLabel}\x1b[K`
      );
    });
  });

  describe("Load commands options to render", () => {
    beforeAll(() => {
      const command = "appdistribution:distribute --";
      onfireCLI._setInput(command);
      onfireCLI._setCursorPosition(onfireCLI.prefix.length + command.length);
    });

    it("Should show that there are 5 options to render", () => {
      const renderMessage = onfireCLI._getCommandOptionsToRender();
      expect(renderMessage.length).toEqual(5);
    });

    it("Should show that the selected option in index [0] is '--app <app_id> -> the app id of your Firebase app'", () => {
      const renderMessage = onfireCLI._getCommandOptionsToRender();
      const cmdLabel = `-> the app id of your Firebase app`;
      expect(renderMessage[0]).toEqual(
        `${cli._textCyan(cli._textBold(">"))} ${cli._textGreen(
          cli._textBold("--app <app_id>")
        )} ${cli._textGreen(cmdLabel)}\x1b[K`
      );
    });

    it("Should show that the unselected command in index [1] is '--release-notes <string> -> release notes to include'", () => {
      const renderMessage = onfireCLI._getCommandOptionsToRender();
      const cmdLabel = `-> release notes to include`;
      expect(renderMessage[1]).toEqual(
        `  ${cli._textBold("--release-notes <string>")} ${cmdLabel}\x1b[K`
      );
    });
  });
});
