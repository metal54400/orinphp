import {
    ensurePHP
} from "../src/runtime.js";

try {

    console.log(
        "[OrinPHP] Checking PHP runtime..."
    );

    await ensurePHP();

    console.log(
        "[OrinPHP] Runtime ready."
    );

} catch (
    error
) {

    console.error(
        `[OrinPHP] ${error.message}`
    );

    process.exit(1);
}