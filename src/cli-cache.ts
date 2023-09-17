import path from "path";
import { mkdir, readFile, stat, writeFile } from "fs/promises";

const APP_NAME = "onfire-cli";

export class CliCache {
  static async getAppDir(): Promise<string> {
    var plat = process.platform;

    var homeDir = process.env[plat == "win32" ? "USERPROFILE" : "HOME"];
    var appDir = null;

    if (plat == "win32") {
      appDir = path.join(homeDir, "AppData", APP_NAME);
    } else {
      appDir = path.join(homeDir, "." + APP_NAME);
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
    const filePath = path.join(dirPath, "cache.json");
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
    const filePath = path.join(dirPath, "cache.json");

    try {
      await writeFile(filePath, JSON.stringify(obj, null, 4));
      return;
    } catch (err) {
      throw new Error(`Unknown error occured: ${err.message}`);
    }
  }
}
