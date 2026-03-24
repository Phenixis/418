import { Select as Attendance } from "./schema/attendance";
import { Select as Course } from "./schema/course";
import { Select as CourseGroup } from "./schema/course-group";
import { Select as CourseTeacher } from "./schema/course-teacher";
import { Select as Group } from "./schema/group";
import { Select as Student } from "./schema/student";
import { Select as Teacher } from "./schema/teacher";

export type Data = {
    attendances: Attendance[]
    courses: Course[];
    courseGroups: CourseGroup[];
    courseTeachers: CourseTeacher[];
    groups: Group[];
    students: Student[];
    teachers: Teacher[];
}