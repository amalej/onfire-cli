# OnFire CLI [![github](https://img.shields.io/badge/GitHub-repository-blue)](https://github.com/amalej/onfire-cli) [![npm](https://img.shields.io/npm/v/onfire-cli)](https://www.npmjs.com/package/onfire-cli) [![npm](https://img.shields.io/npm/dt/onfire-cli)](https://www.npmjs.com/package/onfire-cli?activeTab=versions)

OnFire is an experimental CLI that is built on top of the [Firebase CLI](https://firebase.google.com/docs/cli). This provides basic tab completion for commands and arguments.

## Demo

https://github.com/amalej/onfire-cli/assets/78371908/d0a11ee2-cfad-4cbc-87a8-b6857759e0a5

## Installation

```
npm install -g onfire-cli
```

## Features

- Clear current input by pressing `command + C`
  - If input is blank, `command + C` will exit the CLI
- Tab completion for Firebase CLI commands, options, and option values
- Option autocompletion
  - Provides a dropdown list of available options for a command
- Command and input local caching
  - Saves previously passed commands and input and provide them as autocomplete values
- Usage and description message
- Partial matching of commands
  - Matches input to closest possble command. Helpful when making spelling errors
