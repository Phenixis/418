import { writeFileSync, mkdirSync } from "node:fs";
import { attendanceQueries } from "./queries/attendance";
import { resourceQueries } from "./queries/resource";
import { sessionQueries } from "./queries/session";
import { sessionGroupQueries } from "./queries/session-group";
import { resourceTeacherQueries } from "./queries/resource-teacher";
import { sessionTeacherQueries } from "./queries/session-teacher";
import { groupQueries } from "./queries/group";
import { studentQueries } from "./queries/student";
import { teacherQueries } from "./queries/teacher";
import { Data } from "./save.types";
import { normalize } from "node:path";

export const SAVES_FOLDER_PATH = normalize(__dirname + "/saves/")

async function save() {
    const attendances = await attendanceQueries.getAll();

    if ("error" in attendances) {
        console.error("Error fetching attendances:", attendances.error);
        return;
    } 

    const resources = await resourceQueries.getAll();

    if ("error" in resources) {
        console.error("Error fetching resources:", resources.error);
        return;
    }

    const sessions = await sessionQueries.getAll();

    if ("error" in sessions) {
        console.error("Error fetching sessions:", sessions.error);
        return;
    }

    const sessionGroups = await sessionGroupQueries.getAll();

    if ("error" in sessionGroups) {
        console.error("Error fetching session groups:", sessionGroups.error);
        return;
    }

    const resourceTeachers = await resourceTeacherQueries.getAll();

    if ("error" in resourceTeachers) {
        console.error("Error fetching resource teachers:", resourceTeachers.error);
        return;
    }

    const sessionTeachers = await sessionTeacherQueries.getAll();

    if ("error" in sessionTeachers) {
        console.error("Error fetching session teachers:", sessionTeachers.error);
        return;
    }

    const groups = await groupQueries.getAll();

    if ("error" in groups) {
        console.error("Error fetching groups:", groups.error);
        return;
    }

    const students = await studentQueries.getAll();

    if ("error" in students) {
        console.error("Error fetching students:", students.error);
        return;
    }

    const teachers = await teacherQueries.getAll();

    if ("error" in teachers) {
        console.error("Error fetching teachers:", teachers.error);
        return;
    }

    const data = {
        attendances: attendances.entity,
        resources: resources.entity,
        sessions: sessions.entity,
        sessionGroups: sessionGroups.entity,
        resourceTeachers: resourceTeachers.entity,
        sessionTeachers: sessionTeachers.entity,
        groups: groups.entity,
        students: students.entity,
        teachers: teachers.entity
    } as Data;

    // Ensure the saves folder exists
    try {
        mkdirSync(SAVES_FOLDER_PATH, { recursive: true });
    } catch (error) {
        console.error("Error creating saves folder:", error);
        return;
    }

    writeFileSync(SAVES_FOLDER_PATH + Date.now() + ".json", JSON.stringify(data, null, 2));
}

save().then(() => console.log("Data saved successfully")).catch((error) => console.error("Error saving data:", error));