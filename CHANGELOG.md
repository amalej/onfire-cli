<!-- ADD CHANGES HERE -->

v1.3.2

- Added feature to list folders/files in current path to make it easier to use
  `cd` and `git add <file>` commands

v1.3.1

- Fixed issue where spawn processes cannot be exitted(#56)
- Fixed issue where multiple spawn processes are spawned by spamming `Enter` key
- [dev] set `strictNullChecks` to `true`
- Improve UI to offset newlines

v1.3.0

- Fixed issue where argument selection does not shown possible values(#45)
- Added possible values for `feature`(#15)
- Fixed issue where argument passed is misarranged(#3)
- Added way to clear commands using SIGNINT signal
  - When input has value and SIGNINT signal is sent, CLI will clear the input
  - When input is clear and SIGNINT signal is sent, CLI exits
- Added experimental feature to run non-Firebase commands
  - `clear` and `cls` to clear the console.
  - `pwd` and `cwd` to print current working directory.

v1.2.3

- Added caching for firebase commands
  - Reduces the loading time to almost nothing

v1.2.2

- Added logic to cache command arguments
- Improved the selection ui
- Added partial matching
