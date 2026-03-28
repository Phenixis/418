import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { Select as Teacher } from "@/lib/db/schema/teacher";
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function TeachersTableRow({
    teacher
}: Readonly<{
    teacher: Teacher
}>) {
    return (
        <TableRow key={teacher.userMail} className="bg-white/80">
            <TableCell>
                <Badge variant={teacher.isValidated ? "default" : "destructive"} >
                    {teacher.isValidated ? "Validé" : "Non validé"}
                </Badge>
            </TableCell>
            <TableCell>{teacher.firstName} {teacher.lastName}</TableCell>
            <TableCell>{teacher.userMail}</TableCell>
            <TableCell>{teacher.isAdmin ? "Administrateur" : "Enseignant"}</TableCell>
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer p-2" title="Actions" asChild>
                        <Button variant="ghost" size="icon">
                            <span className="sr-only">Open actions menu</span>
                            <MoreVertIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem disabled title="Cette action n'est pas encore implémentée">
                            Modifier le professeur
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {
                            teacher.isValidated ? (
                                <DropdownMenuItem variant="destructive" disabled title="Cette action n'est pas encore implémentée">
                                    Supprimer le compte
                                </DropdownMenuItem>
                            ) : (
                                <>
                                    <DropdownMenuItem variant="default" disabled title="Cette action n'est pas encore implémentée">
                                        Valider le compte
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" disabled title="Cette action n'est pas encore implémentée">
                                        Refuser le compte
                                    </DropdownMenuItem>
                                </>
                            )
                        }
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}