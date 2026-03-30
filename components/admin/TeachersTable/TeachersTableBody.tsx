import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { teacherQueries } from "@/lib/db/queries/teacher";
import TeachersTableRow from './TeachersTableRow';

export default async function TeachersTableBody() {
    const teachers = await teacherQueries.getAll();

    if ("error" in teachers) {
        return (
            <TableBody>
                <TableRow className="bg-white/80">
                    <TableCell colSpan={5} className="text-center">
                        Une erreur est survenue lors du chargement des comptes.
                    </TableCell>
                </TableRow>
            </TableBody>
        );
    }

    return (
        <TableBody>
            {teachers.entity.map((teacher) => (
                <TeachersTableRow key={teacher.userMail} teacher={teacher} />
            ))}
        </TableBody >
    );
}