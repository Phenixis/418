import { TableCell, TableRow } from '@/components/ui/table';
import type { Select as Student } from '@/lib/db/schema/student';

type StudentsTableRowProps = {
    student: Student;
    groupLabel: string;
};

export default function StudentsTableRow({ student, groupLabel }: Readonly<StudentsTableRowProps>) {
    return (
        <TableRow className="bg-white/80">
            <TableCell>{student.firstName} {student.lastName}</TableCell>
            <TableCell>{student.userMail}</TableCell>
            <TableCell>{groupLabel}</TableCell>
        </TableRow>
    );
}
