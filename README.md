# OnFire CLI [![github](https://img.shields.io/badge/GitHub-repository-blue)](https://github.com/amalej/onfire-cli) [![npm](https://img.shields.io/npm/v/onfire-cli)](https://www.npmjs.com/package/onfire-cli) [![npm](https://img.shields.io/npm/dt/onfire-cli)](https://www.npmjs.com/package/onfire-cli?activeTab=versions)

OnFire is an experimental CLI that is built on top of the [Firebase CLI](https://firebase.google.com/docs/cli). This provides basic tab completion for commands and arguments.

## Installation

```
npm install -g onfire-cli
```

## Demo

https://github.com/amalej/onfire-cli/assets/78371908/275da358-9938-468f-acc1-e5671e90bb48

## Usage


1. Run `onfire` to initialize the CLI
![step-1](https://github.com/amalej/onfire-cli/assets/78371908/a56607f0-4558-4e8c-8652-a46b561943e9)

2. Type a command, for example `func` will list out the ff:
![step-2](https://github.com/amalej/onfire-cli/assets/78371908/54dacce1-1be2-4292-8d6a-761624cb08a8)

3. Move the cursor arrow up(↑) or arrow down(↓) to select a command
![step-3](https://github.com/amalej/onfire-cli/assets/78371908/131480be-cdfa-4893-86b1-6411e8de271c)

4. Press `Tab` to autocomplete the command:
![step-4](https://github.com/amalej/onfire-cli/assets/78371908/159e42a7-a82f-4076-be94-b7eca1321443)

5. Options will be listed for the command. Move the cursor arrow up(↑) or arrow down(↓) to select and add options:
![step-5](https://github.com/amalej/onfire-cli/assets/78371908/15a1c424-0128-49f8-abd3-6919fae3390f)

6. Hit `Enter` to run the command:
![step-6](https://github.com/amalej/onfire-cli/assets/78371908/0754e3a2-e5e7-4cad-9b25-b809fbd3b286)

7. When command finishes:
   - Successful exit(exit code is 0), resets to blank input state:
![step-7-ok](https://github.com/amalej/onfire-cli/assets/78371908/9ed78810-6a9d-4c01-babb-dc5c43aea6f7)

   - Erroneous exit(exit code is not 0), reset to last input state:
![step-7-err](https://github.com/amalej/onfire-cli/assets/78371908/63ed17ad-f374-4260-848f-abf98ae9806b)
