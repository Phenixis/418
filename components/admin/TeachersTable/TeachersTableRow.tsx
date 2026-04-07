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
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function TeachersTableRow({
    teacher
}: Readonly<{
    teacher: Teacher
}>) {
    const router = useRouter();
    const [isRefuseDialogOpen, setIsRefuseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [validateState, validateTeacherAction] = useActionState<any, FormData>(async (_previousState, formData) => {
        return await validateTeacherAccount(formData);
    }, { pending: false });

    const [refuseState, refuseTeacherAction] = useActionState<any, FormData>(async (_previousState, formData) => {
        return await refuseTeacherAccount(formData);
    }, { pending: false });

    const [deleteState, deleteTeacherAction] = useActionState<any, FormData>(async (_previousState, formData) => {
        return await deleteTeacherAccount(formData);
    }, { pending: false });

    useEffect(() => {
        if ("success" in validateState || "success" in refuseState || "success" in deleteState) {
            router.refresh();
        }
    }, [validateState, refuseState, deleteState, router]);

    return (
        <TableRow key={teacher.userMail} className="bg-white/80">
            <TableCell className="px-6">
                <form action={validateTeacherAction}>
                    <input type="hidden" name="teacherEmail" value={teacher.userMail} />
                    <button type="submit" disabled={teacher.isValidated} className={teacher.isValidated ? "" : "cursor-pointer"}>
                        <Badge className={teacher.isValidated ? "" : "hover:bg-primary/90"} variant={teacher.isValidated ? "default" : "destructive"} >
                            {teacher.isValidated ? "Validé" : "Non validé"}
                        </Badge>
                    </button>
                </form>
            </TableCell>
            <TableCell className="text-left px-6">{teacher.firstName} {teacher.lastName}</TableCell>
            <TableCell className="text-left px-6">{teacher.userMail}</TableCell>
            <TableCell className="text-left px-6">{teacher.isAdmin ? "Administrateur" : "Enseignant"}</TableCell>
            <TableCell>
                <form action={validateTeacherAction}>
                    <input type="hidden" name="teacherEmail" value={teacher.userMail} />
                    {/* Bouton de validation visible seulement si non validé */}
                    <Button type="submit" hidden={teacher.isValidated} variant="default" className="bg-green hover:bg-green/90">
                        <CheckIcon />
                    </Button>
                    {/* Bouton de suppression visible seulement si validé */}
                    <Button type="reset" hidden={!teacher.isValidated} variant="destructive">
                        <DeleteIcon />
                    </Button>
                </form>
            </TableCell>
        </TableRow>
    )
}