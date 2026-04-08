import { execFileSync } from "node:child_process";

function getPnpmCommand() {
    return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

async function globalSetup() {
    execFileSync(getPnpmCommand(), ["db:test:save"], { stdio: "inherit" });
}

export default globalSetup;
