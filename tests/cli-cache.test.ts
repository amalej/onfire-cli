import path from "path";
import { APP_NAME, CliCache } from "../src/cli-cache";
import { unlink } from "fs/promises";

describe("Test caching", () => {
  process.env.TEST_CACHE_PATH = "-test";
  let plat = process.platform;
  let homeDir = process.env[plat == "win32" ? "USERPROFILE" : "HOME"];
  let testAppDir: string = "";

  beforeAll(() => {
    if (homeDir == undefined) {
      throw Error("homeDir is undefined");
    }
    if (plat == "win32") {
      testAppDir = path.join(homeDir, "AppData", `${APP_NAME}`);
    } else {
      testAppDir = path.join(homeDir, "." + `${APP_NAME}`);
    }
  });

  it("Should get the app cache directory", async () => {
    const appDir = await CliCache.getAppDir();

    expect(appDir).toBe(testAppDir);
  });

  it("Should read the cache empty json file", async () => {
    const contents = await CliCache.readFromFile();

    expect(contents).toEqual({});
  });

  afterAll(async () => {
    await CliCache.writeToFile({});
  });
});

describe("Test reading cache", () => {
  process.env.TEST_CACHE_PATH = "-test";
  let plat = process.platform;
  let homeDir = process.env[plat == "win32" ? "USERPROFILE" : "HOME"];
  let testAppDir: string = "";
  const obj = {
    pastCommands: [
      "emulators:start --project demo-project",
      "functions:shell --port 5000 --project demo-project",
      "appdistribution:distribute --project demo-proj --app=1:1234567890:ios:321abc456def7890",
    ],
  };

  beforeAll(async () => {
    if (homeDir == undefined) {
      throw Error("homeDir is undefined");
    }
    if (plat == "win32") {
      testAppDir = path.join(homeDir, "AppData", `${APP_NAME}-test`);
    } else {
      testAppDir = path.join(homeDir, "." + `${APP_NAME}-test`);
    }
    await CliCache.writeToFile(JSON.stringify(obj));
  });

  it("Should read the cache from json file", async () => {
    const contents = await CliCache.readFromFile();

    expect(JSON.parse(contents.toString())).toEqual(obj);
  });

  afterAll(async () => {
    await CliCache.writeToFile({});
  });
});
