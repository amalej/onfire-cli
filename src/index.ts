#!/usr/bin/env node

import { CliCache } from "./cli-cache";
import { OnFireCLI } from "./onfire-cli";
import packageJson from "./package-json";

async function initializeApp() {
  if (process.argv.length <= 2) {
    const fileContent = await CliCache.readFromFile();
    const cli = new OnFireCLI({ prefix: "> ", savedInput: fileContent });
    cli.init();
  } else if (process.argv.includes("--version")) {
    console.log(`OnFire: v${packageJson.version}`);
  } else {
    console.log(`OnFire: Unknown args ${process.argv.slice(2).join(", ")}`);
    console.log(`Type 'onfire' to initialize the OnFire CLI`);
  }
}

initializeApp();
