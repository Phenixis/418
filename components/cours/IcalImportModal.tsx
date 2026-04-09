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
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function buildSuccessMessage(resourceCount: number, sessionCount: number): string {
    return `${resourceCount} ressource${resourceCount > 1 ? "s" : ""} et ${sessionCount} séance${sessionCount > 1 ? "s" : ""} importées.`;
}

type ImportStatus = "idle" | "loading" | "success" | "error";

export default function IcalImportModal({
    initIcalUrl,
}: Readonly<{
    initIcalUrl?: string;
}>) {
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [icalUrl, setIcalUrl] = useState(initIcalUrl ?? "");
    const [status, setStatus] = useState<ImportStatus>("idle");
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        return () => {
            eventSourceRef.current?.close();
        };
    }, []);

    function startImport(mode: "import" | "sync") {
        eventSourceRef.current?.close();

        const params = new URLSearchParams({ mode });

        if (mode === "import") {
            params.set("icalUrl", icalUrl.trim());
        }

        const url = `/api/ical-import?${params.toString()}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        setStatus("loading");
        setProgress(null);
        setErrorMessage(null);

        eventSource.addEventListener("progress", (e) => {
            const data = JSON.parse(e.data) as { current: number; total: number };
            setProgress(data);
        });

        eventSource.addEventListener("done", (e) => {
            eventSource.close();
            const data = JSON.parse(e.data) as { resourceCount: number; sessionCount: number };
            setStatus("success");
            setProgress(null);
            toast.success(buildSuccessMessage(data.resourceCount, data.sessionCount));
            router.refresh();

            if (mode === "import") {
                setIsDialogOpen(false);
            }
        });

        eventSource.addEventListener("error", (e) => {
            eventSource.close();

            if (e instanceof MessageEvent) {
                const data = JSON.parse(e.data) as { message: string };
                setErrorMessage(data.message);
            } else {
                setErrorMessage("Connexion perdue. Veuillez réessayer.");
            }

            setStatus("error");
            setProgress(null);
        });

        eventSource.onerror = () => {
            if (status !== "error") {
                eventSource.close();
                setErrorMessage("Connexion perdue. Veuillez réessayer.");
                setStatus("error");
                setProgress(null);
            }
        };
    }

    const isLoading = status === "loading";
    const isImportFormValid = icalUrl.trim().length > 0;
    const progressPercent = progress && progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

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
                        <div className="w-full flex flex-col gap-2 mb-2">
                            <Label htmlFor="icalUrl">URL du flux iCal</Label>
                            <Input
                                id="icalUrl"
                                name="icalUrl"
                                type="url"
                                placeholder="https://ade.universite.fr/..."
                                value={icalUrl}
                                onChange={(e) => setIcalUrl(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <DialogFooter className="flex-col sm:flex-col gap-2">
                            {isLoading && progress && (
                                <div className="w-full flex flex-col gap-1">
                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground text-right">
                                        {progress.current} / {progress.total} ({progressPercent}%)
                                    </p>
                                </div>
                            )}
                            {errorMessage && (
                                <p className="text-sm text-red-500">{errorMessage}</p>
                            )}
                            <Button
                                type="button"
                                variant="big"
                                className="w-full"
                                disabled={isLoading || !isImportFormValid}
                                onClick={() => startImport("import")}
                            >
                                {isLoading ? "Import en cours…" : "Confirmer"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {initIcalUrl && (
                    <div className="flex flex-col gap-1">
                        <Button
                            type="button"
                            variant="default"
                            disabled={isLoading}
                            onClick={() => startImport("sync")}
                        >
                            {isLoading ? "Synchronisation…" : "Synchroniser"}
                        </Button>
                        {isLoading && progress && (
                            <div className="w-full flex flex-col gap-1">
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-right">
                                    {progress.current} / {progress.total} ({progressPercent}%)
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
