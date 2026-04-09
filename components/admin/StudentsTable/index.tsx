import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import StudentsManagementNoSSR from './StudentsManagementNoSSR';

export default async function StudentsTable() {
    const studentsResult = await studentQueries.getAll();
    const groupsResult = await groupQueries.getAll();

    const students = 'success' in studentsResult ? studentsResult.entity : [];
    const groups = 'success' in groupsResult ? groupsResult.entity : [];

    return (
        <StudentsManagementNoSSR
            initialStudents={students}
            groups={groups}
        />
    );
}
