"use client"

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createResource, updateResource } from "@/lib/actions/resource";
import { ActionResult } from "@/lib/actions/types";
import { useTeacher } from "@/lib/hooks/useTeacher";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

interface InitialResource {
    resourceId: string;
    subject: string;
}

export default function ResourceModal({
    initResource,
    triggerId,
    uniqueId = "default",
}: Readonly<{
    initResource?: InitialResource;
    triggerId?: string;
    uniqueId?: string;
}>) {
    const { teacher } = useTeacher();
    const router = useRouter();

    const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
    const [label, setLabel] = useState(initResource?.subject || "");
    const [isFormValid, setIsFormValid] = useState(false);

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        if (initResource === undefined) {
            return await createResource(prevState, formData)
        }
        return await updateResource(prevState, formData)
    }, { pending: true })

    useEffect(() => {
        if ("success" in state) {
            setIsResourceDialogOpen(false);
            setLabel(initResource?.subject || "");
            router.refresh();
        }
    }, [initResource, router, state]);

    useEffect(() => {
        setIsFormValid(label.trim().length > 0);
    }, [label]);

    return (
        <>
            {isResourceDialogOpen && (
                <button
                    type="button"
                    aria-label="Fermer le dialogue de création/modification de ressource"
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsResourceDialogOpen(false)}
                />
            )}
            <Dialog
                modal={false}
                open={isResourceDialogOpen}
                onOpenChange={setIsResourceDialogOpen}
            >
                <DialogTrigger asChild>
                    <Button 
                        variant="default" 
                        id={triggerId ?? (initResource === undefined ? "btn-creer-ressource" : undefined)}
                        className="btn-creer-ressource"
                    >
                        {
                            initResource === undefined ? "Créer une ressource" : "Modifier la ressource"
                        }
                    </Button>
                </DialogTrigger>
                <DialogContent className="z-50" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="h2 font-normal">
                            {
                                initResource === undefined ? "Créer une ressource" : "Modifier la ressource"
                            }
                        </DialogTitle>
                        <DialogDescription hidden>
                            Dialogue de création/modification de ressource
                        </DialogDescription>
                    </DialogHeader>
                    <form action={formAction} className="w-full">
                        {
                            initResource !== undefined && (
                                <input type="hidden" name="resourceId" value={initResource.resourceId} className="hidden" readOnly />
                            )
                        }
                        <input type="hidden" name="teacherEmail" value={teacher.userMail} className="hidden" readOnly />
                        <div className="w-full flex flex-col gap-2 mb-2">
                            <Label htmlFor={`resource-input-label-${uniqueId}`}>Nom de la ressource</Label>
                            <Input
                                id={`resource-input-label-${uniqueId}`}
                                name="label"
                                type="text"
                                placeholder="Nom de la ressource"
                                value={label}
                                onChange={(e) => setLabel(e.target.value.slice(0, 50))}
                                maxLength={50}
                                className="resource-input-label"
                            />
                        </div>

                        <DialogFooter className="flex-col sm:flex-col">
                            {
                                "error" in state && (
                                    <p className="text-sm text-red-500">
                                        {state.message}
                                    </p>
                                )
                            }
                            <Button 
                                type="submit" 
                                id={`resource-submit-btn-${uniqueId}`} 
                                variant="big" 
                                className="w-full resource-submit-btn" 
                                disabled={pending || !isFormValid}
                            >
                                {
                                    initResource === undefined ? "Créer la ressource" : "Modifier la ressource"
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}