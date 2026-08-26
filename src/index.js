#!/usr/bin/env node

import path from "node:path";

import {
    createServer,
    getSystemInfo
} from "../src/index.js";

const args =
    process.argv.slice(2);

function argument(
    name
) {
    const index =
        args.indexOf(name);

    if (
        index === -1
    ) {
        return null;
    }

    return (
        args[index + 1] ||
        null
    );
}

if (
    args.includes("--version") ||
    args.includes("-v")
) {

    console.log(
        "OrinPHP v3.0.0"
    );

    process.exit(0);
}

if (
    args.includes("--system")
) {

    console.log(
        JSON.stringify(
            getSystemInfo(),
            null,
            2
        )
    );

    process.exit(0);
}

if (
    args.includes("--help") ||
    args.includes("-h")
) {

    console.log(`
OrinPHP v3

Usage:

  orinphp
  orinphp ./public

Options:

  --root <directory>
  --port <port>
  --host <host>

  --system
  --version
  --help

Examples:

  orinphp examples/basic

  orinphp --root ./public --port 8080

  orinphp --system
`);

    process.exit(0);
}

const positional =
    args.filter(
        arg =>
            !arg.startsWith("--") &&
            arg !== argument("--root") &&
            arg !== argument("--port") &&
            arg !== argument("--host")
    );

const root =
    argument("--root") ||
    positional[0] ||
    process.cwd();

const port =
    Number(
        argument("--port")
    ) || 8080;

const host =
    argument("--host") ||
    "127.0.0.1";

try {

    const app =
        await createServer({
            root:
                path.resolve(root),

            port,

            host
        });

    await app.start();

    const shutdown =
        async () => {

            await app.stop();

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