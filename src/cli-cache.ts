import path from "path";
import { mkdir, readFile, stat, writeFile } from "fs/promises";

export const APP_NAME = "onfire-cli";
export const MAX_CACHE_COUNT = 25;

export class CliCache {
  static async getAppDir(): Promise<string> {
    let plat = process.platform;

    let homeDir = process.env[plat == "win32" ? "USERPROFILE" : "HOME"];
    let appDir = null;

    if (plat == "win32") {
      appDir = path.join(homeDir, "AppData", `${APP_NAME}`);
    } else {
      appDir = path.join(homeDir, "." + `${APP_NAME}`);
    }

    try {
      await stat(appDir);
    } catch (err) {
      if (err.code === "ENOENT") {
        await mkdir(appDir);
      } else {
        throw new Error(`Unknown error occured: ${err.message}`);
      }
    }

    return appDir;
  }

  static async readFromFile(): Promise<Object> {
    const dirPath = await CliCache.getAppDir();
    const additionalPath = process.env.TEST_CACHE_PATH || "";
    const filePath = path.join(dirPath, `cache${additionalPath}.json`);
    let _obj = {};
    try {
      await stat(filePath);
      const contents = await readFile(filePath);
      _obj = JSON.parse(contents.toString());
    } catch (err) {
      if (err.code === "ENOENT") {
        try {
          await writeFile(filePath, "{}");
        } catch (error) {
          throw new Error(`Unknown error occured: ${err.message}`);
        }
      } else {
        throw new Error(`Unknown error occured: ${err.message}`);
      }
    }
    return _obj;
  }

  static async writeToFile(obj: Object): Promise<void> {
    const dirPath = await CliCache.getAppDir();
    const additionalPath = process.env.TEST_CACHE_PATH || "";
    const filePath = path.join(dirPath, `cache${additionalPath}.json`);

    try {
      let objToSave = obj;
      // Move the 'firebaseCommands' key to the last index
      if (objToSave["firebaseCommands"] !== undefined) {
        objToSave = Object.fromEntries(
          Object.entries(obj).filter(([key]) => key !== "firebaseCommands")
        );
        objToSave["firebaseCommands"] = obj["firebaseCommands"];
      }
      await writeFile(filePath, JSON.stringify(objToSave, null, 4));
      return;
    } catch (err) {
      throw new Error(`Unknown error occured: ${err.message}`);
    }
  }
}
