#!/usr/bin/env node

import "../src/cli.js";


import path from "node:path";

import {
    createServer
} from "../src/index.js";

const args =
    process.argv.slice(2);

function getArg(
    name
) {
    const index =
        args.indexOf(name);

    if (index === -1) {
        return null;
    }

    return (
        args[index + 1] ||
        null
    );
}

if (
    args.includes("--help") ||
    args.includes("-h")
) {
    console.log(`
OrinPHP

Usage:
    orinphp
    orinphp ./public

Options:
    --root <directory>
    --port <port>
    --host <host>
`);

    process.exit(0);
}

const root =
    getArg("--root") ||
    args.find(
        value =>
            !value.startsWith("--")
    ) ||
    process.cwd();

const port =
    Number(
        getArg("--port")
    ) || 8080;

const host =
    getArg("--host") ||
    "127.0.0.1";

try {
    const server =
        await createServer({
            root:
                path.resolve(
                    root
                ),

            port,
            host
        });

    await server.start();

    const shutdown =
        async () => {
            await server.stop();
            process.exit(0);
        };

    process.on(
        "SIGINT",
        shutdown
    );

    process.on(
        "SIGTERM",
        shutdown
    );
} catch (
    error
) {
    console.error(
        `[OrinPHP] ${error.message}`
    );

    process.exit(1);
}