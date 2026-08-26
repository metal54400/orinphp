import path from "node:path";
import process from "node:process";

import {
  createServer
} from "./server.js";

import {
  installPHP
} from "./runtime.js";

function argument(name) {
  const index =
    process.argv.indexOf(name);

  if (index === -1) {
    return null;
  }

  return (
    process.argv[index + 1] ||
    null
  );
}

function help() {
  console.log(`
OrinPHP 2.0

Usage:

  orinphp
  orinphp ./public

Options:

  --port <port>
  --host <host>
  --root <directory>
  --php-version <version>
  --php <path>

Commands:

  orinphp install
  orinphp install --php-version 8.5
`);
}

async function main() {
  if (
    process.argv.includes("--help") ||
    process.argv.includes("-h")
  ) {
    help();
    return;
  }

  if (
    process.argv.includes("install")
  ) {
    const version =
      argument(
        "--php-version"
      ) ||
      "8.5";

    await installPHP(
      version
    );

    return;
  }

  const root =
    argument("--root") ||
    process.argv
      .slice(2)
      .find(
        value =>
          !value.startsWith("--")
      ) ||
    process.cwd();

  const port =
    Number(
      argument("--port")
    ) || 8080;

  const host =
    argument("--host") ||
    "127.0.0.1";

  const phpVersion =
    argument(
      "--php-version"
    ) || "8.5";

  const php =
    argument("--php") ||
    undefined;

  const server =
    await createServer({
      root:
        path.resolve(root),
      port,
      host,
      phpVersion,
      php
    });

  await server.start();

  const shutdown =
    () => {
      server.stop()
        .finally(
          () =>
            process.exit(0)
        );
    };

  process.on(
    "SIGINT",
    shutdown
  );

  process.on(
    "SIGTERM",
    shutdown
  );
}

main().catch(
  error => {
    console.error("");
    console.error(
      "❌ OrinPHP error:"
    );
    console.error(
      error.message
    );
    console.error("");

    process.exit(1);
  }
);