import { Select as Attendance } from "./schema/attendance";
import { Select as Resource } from "./schema/resource";
import { Select as Session } from "./schema/session";
import { Select as SessionGroup } from "./schema/session-group";
import { Select as ResourceTeacher } from "./schema/resource-teacher";
import { Select as SessionTeacher } from "./schema/session-teacher";
import { Select as Group } from "./schema/group";
import { Select as Student } from "./schema/student";
import { Select as Teacher } from "./schema/teacher";

export type Data = {
    attendances: Attendance[]
    resources: Resource[];
    sessions: Session[];
    sessionGroups: SessionGroup[];
    resourceTeachers: ResourceTeacher[];
    sessionTeachers: SessionTeacher[];
    groups: Group[];
    students: Student[];
    teachers: Teacher[];
}