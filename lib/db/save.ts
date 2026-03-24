import { writeFileSync } from "fs";
import { attendanceQueries } from "./queries/attendance";
import { courseQueries } from "./queries/course";
import { courseGroupQueries } from "./queries/course-group";
import { courseTeacherQueries } from "./queries/course-teacher";
import { groupQueries } from "./queries/group";
import { studentQueries } from "./queries/student";
import { teacherQueries } from "./queries/teacher";
import { Data } from "./save.types";

async function save() {
    const attendances = await attendanceQueries.getAll();

    if ("error" in attendances) {
        console.error("Error fetching attendances:", attendances.error);
        return;
    } 

    const courses = await courseQueries.getAll();

    if ("error" in courses) {
        console.error("Error fetching courses:", courses.error);
        return;
    }

    const courseGroups = await courseGroupQueries.getAll();

    if ("error" in courseGroups) {
        console.error("Error fetching course groups:", courseGroups.error);
        return;
    }

    const courseTeachers = await courseTeacherQueries.getAll();

    if ("error" in courseTeachers) {
        console.error("Error fetching course teachers:", courseTeachers.error);
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
        courses: courses.entity,
        courseGroups: courseGroups.entity,
        courseTeachers: courseTeachers.entity,
        groups: groups.entity,
        students: students.entity,
        teachers: teachers.entity
    } as Data;

    writeFileSync(__dirname + "/saves/" + Date.now() + ".json", JSON.stringify(data, null, 2));

    return;
}

save().then(() => console.log("Data saved successfully")).catch((error) => console.error("Error saving data:", error));