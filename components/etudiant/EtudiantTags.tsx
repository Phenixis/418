"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Select as Tag } from "@/lib/db/schema/tag";
import { PlusIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EtudiantTags({
    studentMail,
    assignedTags,
    availableTags,
}: Readonly<{
    studentMail: string;
    assignedTags: Tag[];
    availableTags: Tag[];
}>) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const unassignedTags = availableTags.filter(
        (availableTag) => !assignedTags.some((assignedTag) => assignedTag.tagId === availableTag.tagId)
    );

    async function handleAddTag(tagId: number) {
        setIsSubmitting(true);
        await fetch(`/api/teacher/tags/${tagId}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentMail }),
        });
        router.refresh();
        setIsSubmitting(false);
    }

    async function handleRemoveTag(tagId: number) {
        setIsSubmitting(true);
        await fetch(`/api/teacher/tags/${tagId}/students`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentMail }),
        });
        router.refresh();
        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5 items-center">
                {assignedTags.map((tag) => (
                    <Badge
                        key={tag.tagId}
                        variant="outline"
                        className="gap-1 pr-1"
                        style={{ borderColor: tag.color ?? "#6B7280", color: tag.color ?? "#6B7280" }}
                    >
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(tag.tagId)}
                            disabled={isSubmitting}
                            className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"
                            aria-label={`Retirer le tag ${tag.name}`}
                        >
                            <XIcon className="size-3" />
                        </button>
                    </Badge>
                ))}

                {unassignedTags.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="xs"
                                disabled={isSubmitting}
                                className="gap-1"
                            >
                                <PlusIcon className="size-3" />
                                Ajouter un tag
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {unassignedTags.map((tag) => (
                                <DropdownMenuItem
                                    key={tag.tagId}
                                    onClick={() => handleAddTag(tag.tagId)}
                                    className="gap-2"
                                >
                                    <span
                                        className="size-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: tag.color ?? "#6B7280" }}
                                    />
                                    {tag.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {assignedTags.length === 0 && unassignedTags.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">Aucun tag disponible</span>
                )}
            </div>
        </div>
    );
}
