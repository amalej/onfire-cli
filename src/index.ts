#!/usr/bin/env node

import { OnFireCLI } from "./onfire-cli";
import packageJson from "./package-json";

async function initializeApp() {
  const cli = new OnFireCLI({ prefix: "> " });
  if (process.argv.length <= 2) {
    cli.init();
  } else if (process.argv.includes("--version")) {
    console.log(`OnFire: v${packageJson.version}`);
  } else {
    console.log(`OnFire: Unknown args ${process.argv.slice(2).join(", ")}`);
    console.log(`Type 'onfire' to initialize the OnFire CLI`);
  }
}

initializeApp();
