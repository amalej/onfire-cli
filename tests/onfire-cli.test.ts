import { OnFireCLI } from "../src/onfire-cli";
import { MockFirebaseCommands } from "./firebase-cmd.test";

class MockOnFireCLI extends OnFireCLI {
  _getCurrentCommandNullableOptions(): string[] {
    return this.getCurrentCommandNullableOptions();
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
