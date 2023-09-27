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

process.on('message', function (path) {
    try {
        const client = require(path); // Load the Firebase Tools module
        const configStr = stringify(client) // Removes circular reference and convert to string
        process.send(configStr); // Send to main process
    } catch (_) {
        process.send('ENOENT'); // Send to main process
    }
});
