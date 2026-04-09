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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Select as Tag } from "@/lib/db/schema/tag";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TAG_COLORS = [
    "#EF4444", // rouge
    "#F97316", // orange
    "#EAB308", // jaune
    "#22C55E", // vert
    "#06B6D4", // cyan
    "#3B82F6", // bleu
    "#8B5CF6", // violet
    "#EC4899", // rose
    "#6B7280", // gris
    "#78716C", // stone
];

export interface TagModalData {
    tag?: Tag;
}

export default function TagModal({
    data,
    open,
    onOpenChange,
}: Readonly<{
    data: TagModalData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>) {
    const router = useRouter();
    const [name, setName] = useState(data?.tag?.name ?? "");
    const [color, setColor] = useState<string>(data?.tag?.color ?? TAG_COLORS[5]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(data?.tag?.name ?? "");
            setColor(data?.tag?.color ?? TAG_COLORS[5]);
            setError(null);
        }
    }, [open, data]);

    const isFormValid = name.trim().length > 0;

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!isFormValid) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const isEditing = data?.tag !== undefined;
            const url = isEditing
                ? `/api/teacher/tags/${data!.tag!.tagId}`
                : "/api/teacher/tags";

            const response = await fetch(url, {
                method: isEditing ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), color }),
            });

            if (!response.ok) {
                const body = await response.json();
                setError(body.error ?? "Une erreur est survenue.");
                return;
            }

            onOpenChange(false);
            router.refresh();
        } catch {
            setError("Une erreur inattendue est survenue.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="z-50"
                onInteractOutside={(e) => e.preventDefault()}
                onFocusOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="h2 font-normal">
                        {data?.tag ? "Modifier le tag" : "Créer un tag"}
                    </DialogTitle>
                    <DialogDescription hidden>
                        Dialogue de création/modification de tag
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="tag-name">Nom du tag</Label>
                        <Input
                            id="tag-name"
                            type="text"
                            placeholder="Ex : Groupe projet A"
                            value={name}
                            onChange={(e) => setName(e.target.value.slice(0, 50))}
                            maxLength={50}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>Couleur</Label>
                        <div className="flex flex-wrap gap-2">
                            {TAG_COLORS.map((tagColor) => (
                                <button
                                    key={tagColor}
                                    type="button"
                                    onClick={() => setColor(tagColor)}
                                    className="size-7 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                    style={{
                                        backgroundColor: tagColor,
                                        boxShadow: color === tagColor ? `0 0 0 3px white, 0 0 0 5px ${tagColor}` : undefined,
                                    }}
                                    aria-label={`Couleur ${tagColor}`}
                                />
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-col">
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button
                            type="submit"
                            variant="big"
                            className="w-full"
                            disabled={isSubmitting || !isFormValid}
                        >
                            {data?.tag ? "Modifier" : "Créer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
