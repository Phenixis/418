import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

type BranchInfo = {
    id: string;
    name: string;
};

type ScriptOptions = {
    neonProjectId: string;
    shouldKeepBranch: boolean;
    playwrightArgs: string[];
};

function readNeonApiKey(): string {
    const neonApiKey = process.env.NEON_API_KEY;

    if (!neonApiKey) {
        throw new Error("NEON_API_KEY is required for this script.");
    }

    return neonApiKey;
}

function parseScriptOptions(): ScriptOptions {
    const rawArgs = process.argv.slice(2);
    const parsedOptions: ScriptOptions = {
        neonProjectId: process.env.NEON_PROJECT_ID || "",
        shouldKeepBranch: false,
        playwrightArgs: [],
    };

    for (let argIndex = 0; argIndex < rawArgs.length; argIndex += 1) {
        const currentArg = rawArgs[argIndex];

        if (currentArg === "--") {
            continue;
        }

        if (currentArg === "--project-id") {
            const nextArg = rawArgs[argIndex + 1];
            if (!nextArg) {
                throw new Error("Missing value for --project-id.");
            }
            parsedOptions.neonProjectId = nextArg;
            argIndex += 1;
            continue;
        }

        if (currentArg === "--keep-branch") {
            parsedOptions.shouldKeepBranch = true;
            continue;
        }

        parsedOptions.playwrightArgs.push(currentArg);
    }

    return parsedOptions;
}

function readRequiredNeonProjectId(neonProjectId: string): string {
    if (!neonProjectId) {
        throw new Error("NEON_PROJECT_ID is required (or pass --project-id). Example: NEON_PROJECT_ID=ancient-term-81154960");
    }

    return neonProjectId;
}

function runNeonctlCommand(args: string[], neonApiKey: string): string {
    const commandResult = spawnSync("pnpm", ["exec", "neonctl", ...args, "--api-key", neonApiKey], {
        encoding: "utf-8",
        env: process.env,
    });

    if (commandResult.status !== 0) {
        const stderrMessage = commandResult.stderr?.trim();
        const stdoutMessage = commandResult.stdout?.trim();
        const combinedMessage = stderrMessage || stdoutMessage || "Unknown neonctl error";
        throw new Error(`neonctl ${args.join(" ")} failed: ${combinedMessage}`);
    }

    return commandResult.stdout.trim();
}

function parseJsonOutput<T>(rawText: string): T {
    const firstBraceIndex = rawText.search(/[[{]/);
    if (firstBraceIndex < 0) {
        throw new Error("Could not find JSON payload in neonctl output.");
    }

    const jsonText = rawText.slice(firstBraceIndex);
    return JSON.parse(jsonText) as T;
}

function collectBranchInfos(value: unknown): BranchInfo[] {
    if (!value || typeof value !== "object") {
        return [];
    }

    if (Array.isArray(value)) {
        return value.flatMap((arrayItem) => collectBranchInfos(arrayItem));
    }

    const valueAsRecord = value as Record<string, unknown>;
    const hasBranchShape = typeof valueAsRecord.id === "string" && typeof valueAsRecord.name === "string";

    const nestedBranchInfos = Object.values(valueAsRecord).flatMap((nestedValue) => collectBranchInfos(nestedValue));

    if (!hasBranchShape) {
        return nestedBranchInfos;
    }

    return [{ id: valueAsRecord.id as string, name: valueAsRecord.name as string }, ...nestedBranchInfos];
}

function collectConnectionStrings(value: unknown): string[] {
    if (typeof value === "string") {
        const isConnectionString = value.startsWith("postgres://") || value.startsWith("postgresql://");
        return isConnectionString ? [value] : [];
    }

    if (!value || typeof value !== "object") {
        return [];
    }

    if (Array.isArray(value)) {
        return value.flatMap((arrayItem) => collectConnectionStrings(arrayItem));
    }

    const valueAsRecord = value as Record<string, unknown>;
    return Object.values(valueAsRecord).flatMap((nestedValue) => collectConnectionStrings(nestedValue));
}

function normalizeNeonHostname(hostname: string): string {
    return hostname.replace("-pooler.", ".");
}

function readRequiredPostgresUrl(): URL {
    const postgresUrl = process.env.POSTGRES_URL;

    if (!postgresUrl) {
        throw new Error("POSTGRES_URL is required in environment variables.");
    }

    return new URL(postgresUrl);
}

function getBranchConnectionString(branchIdOrName: string, neonProjectId: string, basePostgresUrl: URL, neonApiKey: string): string {
    const isPooledConnection = basePostgresUrl.hostname.includes("-pooler.");
    const databaseName = basePostgresUrl.pathname.replace(/^\//, "");
    const roleName = decodeURIComponent(basePostgresUrl.username);

    const connectionStringRawOutput = runNeonctlCommand([
        "connection-string",
        branchIdOrName,
        "--project-id",
        neonProjectId,
        "--database-name",
        databaseName,
        "--role-name",
        roleName,
        "--pooled",
        String(isPooledConnection),
        "-o",
        "json",
    ], neonApiKey);

    if (
        connectionStringRawOutput.startsWith("postgres://") ||
        connectionStringRawOutput.startsWith("postgresql://")
    ) {
        return connectionStringRawOutput;
    }

    const connectionStringPayload = parseJsonOutput<unknown>(connectionStringRawOutput);
    const connectionStrings = collectConnectionStrings(connectionStringPayload);

    if (connectionStrings.length === 0) {
        throw new Error(`No PostgreSQL connection string found for branch ${branchIdOrName}.`);
    }

    return connectionStrings[0];
}

function findParentBranchFromPostgresUrl(neonProjectId: string, basePostgresUrl: URL, neonApiKey: string): BranchInfo {
    const branchesRawOutput = runNeonctlCommand(["branches", "list", "--project-id", neonProjectId, "-o", "json"], neonApiKey);
    const branchPayload = parseJsonOutput<unknown>(branchesRawOutput);
    const allBranches = collectBranchInfos(branchPayload);

    if (allBranches.length === 0) {
        throw new Error("No Neon branches found for the selected project.");
    }

    const targetHostname = normalizeNeonHostname(basePostgresUrl.hostname);

    for (const currentBranch of allBranches) {
        const currentBranchConnectionString = getBranchConnectionString(currentBranch.id, neonProjectId, basePostgresUrl, neonApiKey);
        const currentBranchHostname = normalizeNeonHostname(new URL(currentBranchConnectionString).hostname);

        if (currentBranchHostname === targetHostname) {
            return currentBranch;
        }
    }

    throw new Error("Could not match POSTGRES_URL to any branch in this Neon project. Check --project-id / NEON_PROJECT_ID.");
}

function createTemporaryBranch(neonProjectId: string, parentBranchId: string, parentBranchName: string, neonApiKey: string): BranchInfo {
    const dateSuffix = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
    const temporaryBranchName = `playwright-${parentBranchName}-${dateSuffix}`.slice(0, 63);
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const branchCreationOutput = runNeonctlCommand([
        "branches",
        "create",
        "--project-id",
        neonProjectId,
        "--name",
        temporaryBranchName,
        "--parent",
        parentBranchId,
        "--expires-at",
        expirationDate,
        "-o",
        "json",
    ], neonApiKey);

    const branchCreationPayload = parseJsonOutput<unknown>(branchCreationOutput);
    const createdBranchInfos = collectBranchInfos(branchCreationPayload);

    if (createdBranchInfos.length === 0) {
        throw new Error("Could not read newly created branch information from neonctl output.");
    }

    return createdBranchInfos[0];
}

function runPlaywrightWithDedicatedDatabase(postgresUrl: string, playwrightArgs: string[]): number {
    const isUiMode = playwrightArgs.includes("--ui");
    const scriptName = isUiMode ? "test:playwright:ui:raw" : "test:playwright:raw";
    const forwardedPlaywrightArgs = isUiMode
        ? playwrightArgs.filter((currentArg) => currentArg !== "--ui")
        : playwrightArgs;
    const pnpmArgs = ["run", scriptName];

    if (forwardedPlaywrightArgs.length > 0) {
        pnpmArgs.push("--", ...forwardedPlaywrightArgs);
    }

    const commandResult = spawnSync("pnpm", pnpmArgs, {
        stdio: "inherit",
        env: {
            ...process.env,
            POSTGRES_URL: postgresUrl,
        },
    });

    return commandResult.status ?? 1;
}

function deleteTemporaryBranch(neonProjectId: string, branchId: string, neonApiKey: string): void {
    runNeonctlCommand(["branches", "delete", branchId, "--project-id", neonProjectId], neonApiKey);
}

async function main() {
    const neonApiKey = readNeonApiKey();
    const scriptOptions = parseScriptOptions();
    const neonProjectId = readRequiredNeonProjectId(scriptOptions.neonProjectId);
    const basePostgresUrl = readRequiredPostgresUrl();

    let temporaryBranch: BranchInfo | null = null;

    try {
        const parentBranch = findParentBranchFromPostgresUrl(neonProjectId, basePostgresUrl, neonApiKey);
        console.log(`Detected Neon parent branch: ${parentBranch.name} (${parentBranch.id})`);

        temporaryBranch = createTemporaryBranch(neonProjectId, parentBranch.id, parentBranch.name, neonApiKey);
        console.log(`Created temporary Neon branch: ${temporaryBranch.name} (${temporaryBranch.id})`);

        const temporaryBranchConnectionString = getBranchConnectionString(
            temporaryBranch.id,
            neonProjectId,
            basePostgresUrl,
            neonApiKey
        );

        const playwrightExitCode = runPlaywrightWithDedicatedDatabase(temporaryBranchConnectionString, scriptOptions.playwrightArgs);

        if (playwrightExitCode !== 0) {
            process.exitCode = playwrightExitCode;
        }
    } finally {
        if (temporaryBranch) {
            if (scriptOptions.shouldKeepBranch) {
                console.log(`Keeping temporary branch as requested: ${temporaryBranch.name} (${temporaryBranch.id})`);
            } else {
                try {
                    deleteTemporaryBranch(neonProjectId, temporaryBranch.id, neonApiKey);
                    console.log(`Deleted temporary Neon branch: ${temporaryBranch.name} (${temporaryBranch.id})`);
                } catch (deleteError) {
                    console.error("Failed to delete temporary Neon branch:", deleteError);
                    process.exitCode = process.exitCode || 1;
                }
            }
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
