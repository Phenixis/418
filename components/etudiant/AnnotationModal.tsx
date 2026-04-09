"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertAnnotation } from "@/lib/actions/annotation";
import { ActionResult } from "@/lib/actions/types";
import type { Select as Annotation } from "@/lib/db/schema/annotation";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

export interface AnnotationData {
    studentEmail: string;
    teacherEmail: string;
    annotation?: Annotation;
}

export default function AnnotationModal({
    data,
    open,
    onOpenChange,
}: Readonly<{
    data: AnnotationData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>) {
    const router = useRouter();
    const [content, setContent] = useState(data?.annotation?.content ?? "");

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(
        async (prevState, formData) => await upsertAnnotation(prevState, formData),
        { pending: true }
    );

    useEffect(() => {
        if (open) {
            setContent(data?.annotation?.content ?? "");
        }
    }, [open, data]);

    useEffect(() => {
        if ("success" in state) {
            onOpenChange(false);
            router.refresh();
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="z-50 w-[min(90vw,720px)]"
                onInteractOutside={(e) => e.preventDefault()}
                onFocusOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="h2 font-normal">
                        {data?.annotation ? "Modifier l'annotation" : "Créer une annotation"}
                    </DialogTitle>
                    <DialogDescription hidden>
                        Dialogue de création/modification d&apos;annotation
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="w-full flex flex-col gap-4">
                    <input type="hidden" name="studentEmail" value={data?.studentEmail ?? ""} readOnly />
                    <input type="hidden" name="teacherEmail" value={data?.teacherEmail ?? ""} readOnly />
                    {data?.annotation && (
                        <input type="hidden" name="annotationId" value={data.annotation.annotationId} readOnly />
                    )}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="content">Annotation</Label>
                        <Textarea
                            id="content"
                            name="content"
                            placeholder="Saisissez votre annotation..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={12}
                        />
                    </div>
                    <DialogFooter className="flex-col sm:flex-col">
                        {"error" in state && (
                            <p className="text-sm text-red-500">{state.message}</p>
                        )}
                        <Button
                            type="submit"
                            variant="big"
                            className="w-full"
                            disabled={pending || content.trim().length === 0}
                        >
                            {data?.annotation ? "Modifier" : "Créer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
