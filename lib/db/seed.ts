/**
 * 1. Ajouter les groupes
 * 2. Ajouter les étudiants
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { normalize } from "node:path";
import { Data } from "./save.types";
import { attendanceQueries } from "./queries/attendance";
import { resourceQueries } from "./queries/resource";
import { sessionQueries } from "./queries/session";
import { sessionGroupQueries } from "./queries/session-group";
import { resourceTeacherQueries } from "./queries/resource-teacher";
import { sessionTeacherQueries } from "./queries/session-teacher";
import { groupQueries } from "./queries/group";
import { studentQueries } from "./queries/student";
import { teacherQueries } from "./queries/teacher";
import { QueryModel } from "./queries/model";
import { pathToFileURL } from "node:url";

export const SAVES_FOLDER_PATH = normalize(__dirname + "/saves/")

const SEED_ORDER = [
    "groups",
    "resources",
    "sessions",
    "teachers",
    "students",
    "sessionGroups",
    "resourceTeachers",
    "sessionTeachers",
    "attendances",
]

const queriesByKey: Record<string, QueryModel<any, any>> = {
    students: studentQueries,
    teachers: teacherQueries,
    groups: groupQueries,
    resources: resourceQueries,
    sessions: sessionQueries,
    sessionGroups: sessionGroupQueries,
    resourceTeachers: resourceTeacherQueries,
    sessionTeachers: sessionTeacherQueries,
    attendances: attendanceQueries,
};

function isIsoDateTimeValue(value: unknown): value is string {
    if (typeof value !== "string") {
        return false;
    }

    const isIsoFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value);

    if (!isIsoFormat) {
        return false;
    }

    return !Number.isNaN(Date.parse(value));
}

function parseSaveContent(fileContent: string): Data {
    return JSON.parse(fileContent, (_key, value) => {
        if (isIsoDateTimeValue(value)) {
            return new Date(value);
        }

        return value;
    }) as Data;
}

function getLatestSaveFilePath(): string | null {
    if (!readdirSync(SAVES_FOLDER_PATH).length) {
        return null;
    }
    const files = readdirSync(SAVES_FOLDER_PATH);

    const latestFile = files.reduce((latest, current) => {
        const latestTimestamp = Number.parseInt(latest.split(".")[0]);
        const currentTimestamp = Number.parseInt(current.split(".")[0]);

        return currentTimestamp > latestTimestamp ? current : latest;
    }, "0.json");

    return normalize(SAVES_FOLDER_PATH + "/" + latestFile);

}

function getSaveFilePath(fileName?: string): string | null {
    if (fileName && fileName.trim().length > 0) {
        const requestedFilePath = normalize(SAVES_FOLDER_PATH + "/" + fileName);
        if (!existsSync(requestedFilePath)) {
            return null;
        }

        return requestedFilePath;
    }

    return getLatestSaveFilePath();
}

async function deleteAndCreateForTable(queries: QueryModel<any, any>, data: any[]) {
    const softDeleteResult = await queries.deleteAll(true);

    if ("error" in softDeleteResult) {
        console.error("Error soft-deleting entities:", softDeleteResult.error);
        return;
    }

    console.log("Soft-deleted entities for table.");

    const hardDeleteResult = await queries.hardDeleteAll(true);

    if ("error" in hardDeleteResult) {
        console.error("Error hard-deleting entities:", hardDeleteResult.error);
        return;
    }

    console.log("Hard-deleted entities for table.");

    for (const entity of data) {
        const createResult = await queries.create(entity);

        if ("error" in createResult) {
            console.error("Error creating entity:", createResult.error);
            return;
        }
    }
}

export async function seedFromFile(fileName?: string) {
    const filePath = getSaveFilePath(fileName);

    if (!filePath) {
        if (fileName && fileName.trim().length > 0) {
            const errorMessage = "Fichier de sauvegarde introuvable: " + fileName + " dans [" + SAVES_FOLDER_PATH + "].";
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        console.log("Aucun fichier de sauvegarde trouvé. Créez une sauvegarde avant de lancer le seed, ou récupérez-en une auprès de votre administrateur et placez la dans [" + SAVES_FOLDER_PATH + "].");
        return;
    }

    const fileContent = readFileSync(filePath, "utf-8");

     if (fileContent.length === 0) {  
        console.log("Fichier vide");  
        return;  
    }  

    const fileContentParsed = parseSaveContent(fileContent);  

    for (const [key, value] of Object.entries(fileContentParsed).sort(([a], [b]) => {
        const indexA = SEED_ORDER.indexOf(a);
        const indexB = SEED_ORDER.indexOf(b);

        if (indexA === -1 || indexB === -1) {
            return 0;
        }

        return indexA - indexB;
    })) {
        console.log(key);
        const queryModel = queriesByKey[key];
        if (queryModel) {
            await deleteAndCreateForTable(queryModel, value);
        }
        console.log("Data inserted for table:", key);
    }
}

const isMainModule = process.argv[1]
    ? import.meta.url === pathToFileURL(process.argv[1]).href
    : false;

if (isMainModule) {
    seedFromFile();
}