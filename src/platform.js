import os from "node:os";

export function getPlatform() {
    switch (process.platform) {
        case "win32":
            return "windows";

        case "linux":
            return "linux";

        case "darwin":
            return "macos";

        default:
            throw new Error(
                `OrinPHP: unsupported operating system: ${process.platform}`
            );
    }
}

export function getArchitecture() {
    switch (process.arch) {
        case "x64":
            return "x64";

        case "arm64":
            return "arm64";

        default:
            throw new Error(
                `OrinPHP: unsupported architecture: ${process.arch}`
            );
    }
}

export function getPlatformKey() {
    return `${getPlatform()}-${getArchitecture()}`;
}

export function getSystemInfo() {
    return {
        platform: getPlatform(),
        architecture: getArchitecture(),
        nodeVersion: process.version,
        kernel: os.release()
    };
}