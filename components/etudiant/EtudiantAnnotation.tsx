"use client";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { clearAnnotation } from "@/lib/actions/annotation";
import { useDialog } from "@/lib/hooks/use-dialog";
import type { Select as Annotation } from "@/lib/db/schema/annotation";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { ActionResult } from "@/lib/actions/types";

export default function EtudiantAnnotation({
    annotation,
    studentEmail,
    teacherEmail,
}: Readonly<{
    annotation?: Annotation;
    studentEmail: string;
    teacherEmail: string;
}>) {
    const { setAnnotationData } = useDialog();
    const router = useRouter();

    const [state, formAction] = useActionState<ActionResult, FormData>(
        async (prevState, formData) => await clearAnnotation(prevState, formData),
        { pending: true }
    );

    useEffect(() => {
        if ("success" in state) {
            router.refresh();
        }
    }, [state, router]);

    return (
        <div className="flex-1 flex flex-col h-full gap-2">
            <header className="flex items-center justify-between">
                <h2 className="h2">Annotations</h2>
                {annotation?.content && (
                    <div className="flex items-center gap-1">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <DeleteIcon fontSize="small" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent size="sm">
                                <form action={formAction} className="space-y-4">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Vider cette annotation ?</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <AlertDialogDescription>
                                        Cette action supprimera définitivement le contenu de l&apos;annotation.
                                    </AlertDialogDescription>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <input type="hidden" name="annotationId" value={annotation.annotationId} readOnly />
                                        <Button variant="destructive" type="submit">Vider</Button>
                                    </AlertDialogFooter>
                                </form>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAnnotationData({ studentEmail, teacherEmail, annotation })}
                        >
                            <EditIcon fontSize="small" />
                        </Button>
                    </div>
                )}
                {!annotation?.content && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAnnotationData({ studentEmail, teacherEmail, annotation })}
                    >
                        <EditIcon fontSize="small" />
                    </Button>
                )}
            </header>
            {
                annotation?.content ? (
                    <p className="w-full flex-1 border bg-background-alternative p-2 rounded-lg whitespace-pre-wrap overflow-y-auto">
                        {annotation.content}
                    </p>
                ) : (
                    <p>
                        Aucune annotation disponible. Cliquez sur le bouton <EditIcon fontSize="small" /> pour en créer une.
                    </p>
                )
            }
        </div>
    );
}
