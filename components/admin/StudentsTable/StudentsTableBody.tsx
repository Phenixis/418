import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';
import StudentsTableRow from './StudentsTableRow';

function buildGroupLabel(group: Group): string {
    return `${group.promo}${group.td}${group.tp}`;
}

export default async function StudentsTableBody() {
    const studentsResult = await studentQueries.getAll();

    if ('error' in studentsResult) {
        return (
            <TableBody>
                <TableRow className="bg-white/80">
                    <TableCell colSpan={3} className="text-center">
                        Une erreur est survenue lors du chargement des étudiants.
                    </TableCell>
                </TableRow>
            </TableBody>
        );
    }

    const students = studentsResult.entity as Student[];

    const uniqueGroupIds = [...new Set(students
        .map((student) => student.groupId)
        .filter((groupId): groupId is number => typeof groupId === 'number'))];

    const groupsById = new Map<number, Group>();

    if (uniqueGroupIds.length > 0) {
        const groupsResult = await groupQueries.getByIds(uniqueGroupIds);
        for (const group of groupsResult.entity as Group[]) {
            groupsById.set(group.groupId, group);
        }
    }

    const sortedStudents = students.slice().sort((firstStudent, secondStudent) => {
        const lastNameOrder = firstStudent.lastName.localeCompare(secondStudent.lastName, 'fr');
        if (lastNameOrder !== 0) {
            return lastNameOrder;
        }

        return firstStudent.firstName.localeCompare(secondStudent.firstName, 'fr');
    });

    return (
        <TableBody>
            {sortedStudents.map((student) => {
                const studentGroup = typeof student.groupId === 'number' ? groupsById.get(student.groupId) : undefined;
                const groupLabel = studentGroup ? buildGroupLabel(studentGroup) : 'Non assigné';

                return (
                    <StudentsTableRow
                        key={student.userMail}
                        student={student}
                        groupLabel={groupLabel}
                    />
                );
            })}
        </TableBody>
    );
}
