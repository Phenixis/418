import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';
import StudentsManagementClient from './StudentsManagementClient';

export default async function StudentsTable() {
    const studentsResult = await studentQueries.getAll();
    const groupsResult = await groupQueries.getAll();

    const students = 'success' in studentsResult ? studentsResult.entity as Student[] : [];
    const groups = 'success' in groupsResult ? groupsResult.entity as Group[] : [];

    return (
        <StudentsManagementClient
            initialStudents={students}
            groups={groups}
        />
    );
}
