import { execFileSync } from "node:child_process";

function getPnpmCommand() {
    return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

async function globalTeardown() {
    execFileSync(getPnpmCommand(), ["db:test:restore"], { stdio: "inherit" });
}

export default globalTeardown;
