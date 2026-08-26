import { spawn } from "node:child_process";

export function executePHP({
    php,
    file,
    env = {},
    body = ""
}) {
    return new Promise(
        (resolve, reject) => {

            const child =
                spawn(
                    php,
                    [
                        "-d",
                        "cgi.force_redirect=0",
                        "-d",
                        "cgi.fix_pathinfo=1"
                    ],
                    {
                        env: {
                            ...process.env,
                            ...env,
                            REDIRECT_STATUS: "1"
                        },

                        stdio: [
                            "pipe",
                            "pipe",
                            "pipe"
                        ]
                    }
                );

            const stdout = [];
            const stderr = [];

            child.stdout.on(
                "data",
                chunk => stdout.push(chunk)
            );

            child.stderr.on(
                "data",
                chunk => stderr.push(chunk)
            );

            child.on(
                "error",
                reject
            );

            child.on(
                "close",
                code => {

                    if (
                        code !== 0
                    ) {

                        reject(
                            new Error(
                                Buffer
                                    .concat(stderr)
                                    .toString()
                            )
                        );

                        return;
                    }

                    resolve(
                        Buffer.concat(
                            stdout
                        )
                    );
                }
            );

            if (
                body
            ) {
                child.stdin.write(
                    body
                );
            }

            child.stdin.end();
        }
    );
}

export function parseCGIResponse(
    buffer
) {
    const text =
        buffer.toString(
            "utf8"
        );

    let separator =
        "\r\n\r\n";

    let index =
        text.indexOf(
            separator
        );

    if (
        index === -1
    ) {

        separator =
            "\n\n";

        index =
            text.indexOf(
                separator
            );
    }

    if (
        index === -1
    ) {

        return {
            headers: {},
            body: buffer
        };
    }

    const headerText =
        text.substring(
            0,
            index
        );

    const body =
        Buffer.from(
            text.substring(
                index +
                separator.length
            )
        );

    const headers = {};

    for (
        const line of
        headerText.split(
            /\r?\n/
        )
    ) {

        const separatorIndex =
            line.indexOf(":");

        if (
            separatorIndex === -1
        ) {
            continue;
        }

        const name =
            line
                .substring(
                    0,
                    separatorIndex
                )
                .trim();

        const value =
            line
                .substring(
                    separatorIndex + 1
                )
                .trim();

        headers[name] =
            value;
    }

    return {
        headers,
        body
    };
}