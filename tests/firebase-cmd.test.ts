import { exec } from "child_process";
import { FirebaseCommands } from "../src/firebase-cmd";

const COMMAND_TIMEOUT = 10000;
const TEST_TIMEOUT = 10000;

class MockFirebaseCommands extends FirebaseCommands {
  async _loadFirebaseModule() {
    return await this.loadFirebaseModule();
  }
  async _wrapString(str: string, start: string, end: string) {
    return this.wrapString(str, start, end);
  }
  async _getCommandsUsingModule() {
    return this.getCommandsUsingModule();
  }
}

describe("Find global node_module paths", () => {
  const firebaseCommands = new MockFirebaseCommands();

  it("Should find the global node module path", async () => {
    const path = await new Promise((resolve, reject) => {
      const rejectTimout = setTimeout(() => {
        reject("Error");
      }, COMMAND_TIMEOUT);
      const npmSpawnPath = exec("npm root -g");

      let bufferString = "";
      npmSpawnPath.stdout?.on("data", (data) => {
        bufferString += data;
      });

      npmSpawnPath.stdout?.on("end", () => {
        clearTimeout(rejectTimout);
        const rootPath = bufferString.toString().trim();
        resolve(rootPath);
      });
    });

    expect(path).toBeDefined();
  });

  it(
    "Should load the 'firbease-tools' module",
    async () => {
      const client = await firebaseCommands._loadFirebaseModule();
      expect(client).toBeDefined();
    },
    TEST_TIMEOUT
  );

  it(
    "Should wrap the string",
    async () => {
      const message = await firebaseCommands._wrapString(
        "HelloWorld",
        "<",
        ">"
      );
      expect(message).toBe("<HelloWorld>");
    },
    TEST_TIMEOUT
  );

  it("Should load commands using the Firebase Tools module", async () => {
    const commands = firebaseCommands._getCommandsUsingModule();
    expect(commands).toBeDefined();
  });
});
