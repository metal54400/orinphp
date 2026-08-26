import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { execFile, spawn } from "node:child_process";

import {
    getPlatform,
    getArchitecture,
    getPlatformKey
} from "./platform.js";

const PHP_VERSION = "8.5.10";

const ORINPHP_HOME =
    path.join(os.homedir(), ".orinphp");

const RUNTIME_HOME =
    path.join(
        ORINPHP_HOME,
        "runtime"
    );

const RUNTIME_FOLDER =
    path.join(
        RUNTIME_HOME,
        `${PHP_VERSION}-${getPlatformKey()}`
    );

let installationPromise = null;

function executablePath() {
    if (
        getPlatform() === "windows"
    ) {
        return path.join(
            RUNTIME_FOLDER,
            "php-cgi.exe"
        );
    }

    return path.join(
        RUNTIME_FOLDER,
        "bin",
        "php-cgi"
    );
}

function mkdir(directory) {
    fs.mkdirSync(
        directory,
        {
            recursive: true
        }
    );
}

async function download(
    url,
    destination
) {
    console.log(
        `[OrinPHP] Downloading PHP runtime...`
    );

    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Download failed: HTTP ${response.status}\n${url}`
        );
    }

    if (!response.body) {
        throw new Error(
            "Download returned an empty response."
        );
    }

    const stream =
        fs.createWriteStream(
            destination
        );

    await pipeline(
        response.body,
        stream
    );
}

async function sha256(
    file
) {
    return new Promise(
        (resolve, reject) => {
            const hash =
                crypto.createHash(
                    "sha256"
                );

            const stream =
                fs.createReadStream(
                    file
                );

            stream.on(
                "data",
                chunk => hash.update(chunk)
            );

            stream.on(
                "end",
                () => {
                    resolve(
                        hash.digest("hex")
                    );
                }
            );

            stream.on(
                "error",
                reject
            );
        }
    );
}

function verifyHash(
    actual,
    expected
) {
    return (
        actual.toLowerCase() ===
        expected.toLowerCase()
    );
}

/*
|--------------------------------------------------------------------------
| Runtime manifest
|--------------------------------------------------------------------------
|
| Les URLs doivent pointer vers des builds PHP
| réellement disponibles.
|
*/

const RUNTIMES = {

    "windows-x64": {
        type: "zip",

        url:
            "https://windows.php.net/downloads/releases/php-8.5.10-nts-Win32-vs17-x64.zip",

        sha256: null
    },

    "windows-arm64": {
        type: "zip",
        url: null,
        sha256: null
    },

    "linux-x64": {
        type: "tar.gz",
        url: null,
        sha256: null
    },

    "linux-arm64": {
        type: "tar.gz",
        url: null,
        sha256: null
    },

    "macos-x64": {
        type: "tar.gz",
        url: null,
        sha256: null
    },

    "macos-arm64": {
        type: "tar.gz",
        url: null,
        sha256: null
    }
};

function getRuntime() {
    const key =
        getPlatformKey();

    const runtime =
        RUNTIMES[key];

    if (!runtime) {
        throw new Error(
            `No PHP runtime configured for ${key}.`
        );
    }

    if (!runtime.url) {
        throw new Error(
            `PHP ${PHP_VERSION} is not yet configured for ${key}.`
        );
    }

    return runtime;
}

async function extractZip(
    archive,
    destination
) {
    await new Promise(
        (resolve, reject) => {

            execFile(
                "powershell.exe",
                [
                    "-NoProfile",
                    "-NonInteractive",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-Command",
                    `Expand-Archive -LiteralPath "${archive}" -DestinationPath "${destination}" -Force`
                ],
                error => {

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );
        }
    );
}

async function extractTarGz(
    archive,
    destination
) {
    await new Promise(
        (resolve, reject) => {

            const child =
                spawn(
                    "tar",
                    [
                        "-xzf",
                        archive,
                        "-C",
                        destination
                    ],
                    {
                        stdio: "inherit"
                    }
                );

            child.on(
                "error",
                reject
            );

            child.on(
                "close",
                code => {

                    if (
                        code === 0
                    ) {
                        resolve();
                        return;
                    }

                    reject(
                        new Error(
                            `tar exited with code ${code}`
                        )
                    );
                }
            );
        }
    );
}

export function getPHPPath() {
    return executablePath();
}

export function isPHPInstalled() {
    return fs.existsSync(
        executablePath()
    );
}

export async function installPHP() {

    if (
        installationPromise
    ) {
        return installationPromise;
    }

    installationPromise =
        installPHPInternal();

    try {
        return await installationPromise;
    } finally {
        installationPromise = null;
    }
}

async function installPHPInternal() {

    if (
        isPHPInstalled()
    ) {
        return getPHPPath();
    }

    const runtime =
        getRuntime();

    mkdir(
        ORINPHP_HOME
    );

    mkdir(
        RUNTIME_HOME
    );

    mkdir(
        RUNTIME_FOLDER
    );

    const extension =
        runtime.type === "zip"
            ? ".zip"
            : ".tar.gz";

    const archive =
        path.join(
            ORINPHP_HOME,
            `php-${PHP_VERSION}-${getPlatformKey()}${extension}`
        );

    console.log(
        `[OrinPHP] OS: ${getPlatform()}`
    );

    console.log(
        `[OrinPHP] Architecture: ${getArchitecture()}`
    );

    console.log(
        `[OrinPHP] PHP: ${PHP_VERSION}`
    );

    await download(
        runtime.url,
        archive
    );

    if (
        runtime.sha256
    ) {

        console.log(
            "[OrinPHP] Verifying SHA-256..."
        );

        const actual =
            await sha256(
                archive
            );

        if (
            !verifyHash(
                actual,
                runtime.sha256
            )
        ) {

            fs.rmSync(
                archive,
                {
                    force: true
                }
            );

            throw new Error(
                "SHA-256 verification failed."
            );
        }
    }

    console.log(
        "[OrinPHP] Extracting PHP..."
    );

    if (
        runtime.type === "zip"
    ) {

        await extractZip(
            archive,
            RUNTIME_FOLDER
        );

    } else {

        await extractTarGz(
            archive,
            RUNTIME_FOLDER
        );
    }

    fs.rmSync(
        archive,
        {
            force: true
        }
    );

    if (
        !isPHPInstalled()
    ) {

        throw new Error(
            `PHP executable not found.\nExpected: ${getPHPPath()}`
        );
    }

    if (
        getPlatform() !== "windows"
    ) {

        await fs.promises.chmod(
            getPHPPath(),
            0o755
        );
    }

    console.log(
        `[OrinPHP] PHP ${PHP_VERSION} installed.`
    );

    return getPHPPath();
}

export async function ensurePHP() {

    if (
        isPHPInstalled()
    ) {
        return getPHPPath();
    }

    return installPHP();
}