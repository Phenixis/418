"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
import { deleteTeacherAccount, refuseTeacherAccount, validateTeacherAccount } from "@/lib/actions/admin";
import { Select as Teacher } from "@/lib/db/schema/teacher";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from "react";

export default function TeachersTableRow({
    teacher
}: Readonly<{
    teacher: Teacher
}>) {
    const [isRefuseDialogOpen, setIsRefuseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={(event) => {
                                        event.preventDefault();
                                        setIsDeleteDialogOpen(true);
                                    }}
                                >
                                    Supprimer le compte
                                </DropdownMenuItem>
                            ) : (
                                <>
                                    <form action={validateTeacherAccount}>
                                        <input type="hidden" name="teacherEmail" value={teacher.userMail} />
                                        <DropdownMenuItem asChild variant="default">
                                            <button type="submit" className="w-full text-left cursor-pointer">
                                                Valider le compte
                                            </button>
                                        </DropdownMenuItem>
                                    </form>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setIsRefuseDialogOpen(true);
                                        }}
                                    >
                                        Refuser le compte
                                    </DropdownMenuItem>
                                </>
                            )
                        }
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialog open={isRefuseDialogOpen} onOpenChange={setIsRefuseDialogOpen}>
                    <AlertDialogContent size="sm">
                        <form action={refuseTeacherAccount}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Refuser ce compte ?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogDescription>
                                Cette action supprimera le compte de {teacher.firstName} {teacher.lastName} ({teacher.userMail}).
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <input type="hidden" name="teacherEmail" value={teacher.userMail} />
                                <Button variant="destructive" type="submit">
                                    Refuser
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent size="sm">
                        <form action={deleteTeacherAccount}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogDescription>
                                Cette action supprimera le compte de {teacher.firstName} {teacher.lastName} ({teacher.userMail}).
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <input type="hidden" name="teacherEmail" value={teacher.userMail} />
                                <Button variant="destructive" type="submit">
                                    Supprimer
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    )
}