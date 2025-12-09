function stringify(obj) {
    let cache = [];
    let str = JSON.stringify(obj, function (key, value) {
        if (typeof value === "object" && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    });
    cache = null; // reset the cache
    return str;
}

function determineCommandList(map, parentKey = null, depth = 0) {
    if (depth > 10) return []
    const commandList = []
    if (map) {
        for (let [key, value] of Object.entries(map)) {
            if (key === "load") continue
            if (typeof value?.load === "function") {
                if (!parentKey) {
                    commandList.push(key)
                } else {
                    commandList.push([parentKey, key].join(":"))
                }
            }

            if (!parentKey) {
                commandList.push(...determineCommandList(value, key, depth + 1))
            } else {
                commandList.push(...determineCommandList(value, [parentKey, key].join(":"), depth + 1))
            }
        }
    }

    return commandList.map((e) => e.toLowerCase())
}

process.on('message', function (path) {
    try {
        const client = require(path); // Load the Firebase Tools module
        let configStr = stringify(client) // Removes circular reference and convert to string

        const clientObj = JSON.parse(configStr)
        if (clientObj.cli.commands.length === 0) {
            /**
             *  Due to firebase-tools v15 introducing lazy laoding of commands
             *  we would need to run `getCommand([command_name])` for each command
             *  to register each command
             */
            const commands = determineCommandList(client)
            for (let command of commands) {
                require(path).getCommand(command)
            }

            const clientWithLoadedCommands = require(path);
            configStr = stringify(clientWithLoadedCommands)
        }

        process.send(configStr); // Send to main process
    } catch (err) {
        process.send(`ERROR__${err}`); // Send to main process
    }
});
