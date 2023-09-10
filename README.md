# OnFire CLI [![github](https://img.shields.io/badge/GitHub-repository-blue)](https://github.com/amalej/onfire-cli) [![npm](https://img.shields.io/npm/v/onfire-cli)](https://www.npmjs.com/package/onfire-cli) [![npm](https://img.shields.io/npm/dt/onfire-cli)](https://www.npmjs.com/package/onfire-cli?activeTab=versions)

OnFire is an experimental CLI that is built on top of the [Firebase CLI](https://firebase.google.com/docs/cli). This provides basic tab completion for commands and arguments.

## Installation

```
npm install -g onfire-cli
```

## Demo

https://github.com/amalej/onfire-cli/assets/78371908/275da358-9938-468f-acc1-e5671e90bb48

## Usage

<ol>
    <li>
        <div>
            Run <code>onfire</code> to initialize the CLI
        </div>
        <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
            <div>
                <span style="color: green"><b>></b></span> 
            </div>
            <div>
                <span style="color: green"> <b>appdistribution:distribute</b> -> upload a release binary</span>
            </div>
            <div>
                <b>appdistribution:testers:add</b> -> add testers to project (and possibly group)
            </div>
            <div>
                <b>appdistribution:testers:remove</b> -> remove testers from a project (or group)
            </div>
            <div>
                <b>appdistribution:group:create</b> -> create group in project
            </div>
        </div>
    </li>
    <br>
    <li>
        <div>
            Type a command, for example <code>func</code> will list out the ff:
        </div>
        <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
            <div>
                <span style="color: green"><b>></b></span> func
            </div>
            <div>
                <span style="color: green"><b>functions:config:clone</b> -> clone environment config from another project</span>
            </div>
            <div>
                <b>functions:config:export</b> -> Export environment config as environment variables in dotenv format
            </div>
            <div>
                <b>functions:config:get</b> -> fetch environment config stored at the given path
            </div>
            <div>
                <b>functions:config:set</b> -> set environment config with key=value syntax
            </div>
        </div>
    </li>
    <br>
    <li>
        <div>
            Move the cursor arrow up(↑) or arrow down(↓) to select a command
        </div>
        <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
            <div>
                <span style="color: green"><b>></b></span> func
            </div>
            <div>
                <span style="color: green"><b>functions:shell</b> -> launch full Node shell with emulated functions</span>
            </div>
            <div>
                <b>functions:list</b> -> list all deployed functions in your Firebase project
            </div>
            <div>
                <b>functions:secrets:access</b> -> Access secret value given secret and its version. Defaults to accessing the latest version.
            </div>
            <div>
                <b>functions:secrets:destroy</b> -> Destroy a secret. Defaults to destroying the latest version.
            </div>
        </div>
    </li>
    <br>
    <li>
        <div>
            Press <code>Tab</code> to autocomplete the command:
        </div>
        <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
            <div>
                <span style="color: green"><b>></b></span> functions:shell
            </div>
            <div>
                <span style="color: green"> <b>functions:shell</b> -> launch full Node shell with emulated functions</span>
            </div>
            <div>-</div>
            <div>-</div>
            <div>-</div>
        </div>
    </li>
    <br>
    <li>
        <div>
            Options will be listed for the command. Move the cursor arrow up(↑) or arrow down(↓) to select and add options:
        </div>
        <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
            <div>
                <span style="color: green"><b>></b></span> functions:shell
            </div>
            <div>
                <span style="color: yellow"><b>Usage: </b></span> firebase functions:shell [options]
            </div>
            <div>
                <span style="color: green"> <b>--port &lt;port&gt;</b> -> the port on which to emulate functions</span>
            </div>
            <div>
                <b>--inspect-functions [port]</b> -> emulate Cloud Functions in debug mode with the node inspector on the given port (9229 if not specified)
            </div>
            <div>
                <b>--project &lt;alias_or_project_id&gt;</b> -> the Firebase project to use for this command
            </div>
            <div>
                <b>--debug</b>  -> print verbose debug output and keep a debug log file
            </div>
        </div>
    </li>
    <br>
    <li>
        <div>
            Hit <code>Enter</code> to run the command:
        </div>
        <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
            <div>
                <span style="color: green"><b>></b></span> functions:shell --port 5000 --project demo-proj
            </div>
            <div>
                <span style="color: yellow"><b>Usage: </b></span> firebase functions:shell [options]
            </div>
            <div>
                -
            </div>
            <div>
                -
            </div>
            <div>
                -
            </div>
            <div>
                -
            </div>
        </div>
    </li>
    <br>
    <li>
        <div>
            When command finishes:
        </div>
        <ul>
            <li>
                <div>
                    Successful exit(exit code is 0), resets to blank input state:
                </div>
                <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
                    <div>
                        <span style="color: green"><b>></b></span> 
                    </div>
                    <div>
                        <span style="color: green"> <b>appdistribution:distribute</b> -> upload a release binary</span>
                    </div>
                    <div>
                        <b>appdistribution:testers:add</b> -> add testers to project (and possibly group)
                    </div>
                    <div>
                        <b>appdistribution:testers:remove</b> -> remove testers from a project (or group)
                    </div>
                    <div>
                        <b>appdistribution:group:create</b> -> create group in project
                    </div>
                </div>
            </li>
            <br>
            <li>
                <div>
                    Erroneous exit(exit code is not 0), reset to last input state:
                </div>
                <div style="background: #2c2c2c; padding: 12px; border-radius: 2px">
                    <div>
                        <span style="color: green"><b>></b></span> functions:shell --port 5000 --project demo-proj
                    </div>
                    <div>
                        <span style="color: yellow"><b>Usage: </b></span> firebase functions:shell [options]
                    </div>
                    <div>
                        -
                    </div>
                    <div>
                        -
                    </div>
                    <div>
                        -
                    </div>
                    <div>
                        -
                    </div>
                </div>
            </li>
        </ul>
    </li>
    <br>
</ol>
