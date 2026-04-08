"use client";

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
import { importFromIcal, syncFromIcal } from "@/lib/actions/ical-import";
import { ActionResult } from "@/lib/actions/types";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

function buildSuccessMessage(resourceCount: number, sessionCount: number): string {
    return `${resourceCount} ressource${resourceCount > 1 ? "s" : ""} et ${sessionCount} séance${sessionCount > 1 ? "s" : ""} importées.`;
}

export default function IcalImportModal({
    initIcalUrl,
}: Readonly<{
    initIcalUrl?: string;
}>) {
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [icalUrl, setIcalUrl] = useState(initIcalUrl ?? "");

    const [importState, importAction, importPending] = useActionState<ActionResult, FormData>(
        importFromIcal,
        { pending: true }
    );

    const [syncState, syncAction, syncPending] = useActionState<ActionResult, FormData>(
        syncFromIcal,
        { pending: true }
    );

    useEffect(() => {
        if ("success" in importState) {
            setIsDialogOpen(false);
            toast.success(buildSuccessMessage(importState.resourceCount, importState.sessionCount));
            router.refresh();
        }
    }, [importState, router]);

    useEffect(() => {
        if ("success" in syncState) {
            toast.success(buildSuccessMessage(syncState.resourceCount, syncState.sessionCount));
            router.refresh();
        }

        if ("error" in syncState) {
            toast.error(syncState.message);
        }
    }, [syncState, router]);

    const isImportFormValid = icalUrl.trim().length > 0;

    return (
        <>
            {isDialogOpen && (
                <button
                    type="button"
                    aria-label="Fermer le dialogue d'import iCal"
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsDialogOpen(false)}
                />
            )}

            <div className="flex gap-2">
                <Dialog modal={false} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="default">Importer mes ressources</Button>
                    </DialogTrigger>
                    <DialogContent className="z-50 w-[700px]">
                        <DialogHeader>
                            <DialogTitle className="h2 font-normal">Importer mes ressources</DialogTitle>
                            <DialogDescription hidden>
                                Dialogue d'import des ressources depuis un flux iCal
                            </DialogDescription>
                        </DialogHeader>
                        <form action={importAction} className="w-full">
                            <div className="w-full flex flex-col gap-2 mb-2">
                                <Label htmlFor="icalUrl">URL du flux iCal</Label>
                                <Input
                                    id="icalUrl"
                                    name="icalUrl"
                                    type="url"
                                    placeholder="https://ade.universite.fr/..."
                                    value={icalUrl}
                                    onChange={(e) => setIcalUrl(e.target.value)}
                                />
                            </div>
                            <DialogFooter className="flex-col sm:flex-col">
                                {"error" in importState && (
                                    <p className="text-sm text-red-500">{importState.message}</p>
                                )}
                                <Button
                                    type="submit"
                                    variant="big"
                                    className="w-full"
                                    disabled={importPending || !isImportFormValid}
                                >
                                    {importPending ? "Import en cours…" : "Confirmer"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {initIcalUrl && (
                    <form action={syncAction}>
                        <Button type="submit" variant="default" disabled={syncPending}>
                            {syncPending ? "Synchronisation…" : "Synchroniser"}
                        </Button>
                    </form>
                )}
            </div>
        </>
    );
}
