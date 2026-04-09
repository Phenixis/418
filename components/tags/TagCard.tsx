"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Select as Student } from "@/lib/db/schema/student";
import type { Select as Tag } from "@/lib/db/schema/tag";
import { PencilIcon, TrashIcon, UserPlusIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { TagModalData } from "./TagModal";

export default function TagCard({
    tag,
    students,
    onEdit,
}: Readonly<{
    tag: Tag;
    students: Student[];
    onEdit: (data: TagModalData) => void;
}>) {
    const router = useRouter();
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const tagColor = tag.color ?? "#6B7280";

    async function handleDeleteTag() {
        if (!confirm(`Supprimer le tag "${tag.name}" ? Les étudiants et séances associés seront dissociés.`)) return;

        const response = await fetch(`/api/teacher/tags/${tag.tagId}`, { method: "DELETE" });
        if (response.ok) {
            router.refresh();
        }
    }

    async function handleAddStudent(event: React.FormEvent) {
        event.preventDefault();
        const studentMail = searchQuery.trim();
        if (!studentMail) return;

        setIsSubmitting(true);
        setError(null);

        const response = await fetch(`/api/teacher/tags/${tag.tagId}/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentMail }),
        });

        if (response.ok) {
            setSearchQuery("");
            setIsAddingStudent(false);
            router.refresh();
        } else {
            const body = await response.json();
            setError(body.error ?? "Erreur lors de l'ajout.");
        }

        setIsSubmitting(false);
    }

    async function handleRemoveStudent(studentMail: string) {
        const response = await fetch(`/api/teacher/tags/${tag.tagId}/students`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentMail }),
        });
        if (response.ok) {
            router.refresh();
        }
    }

    function handleStartAdding() {
        setIsAddingStudent(true);
        setError(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    }

    return (
        <div className="border border-border rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: tagColor }}
                    />
                    <h3 className="font-medium text-base">{tag.name}</h3>
                    <span className="text-sm text-muted-foreground">
                        {students.length} étudiant{students.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit({ tag })}
                        aria-label="Modifier le tag"
                    >
                        <PencilIcon />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDeleteTag}
                        aria-label="Supprimer le tag"
                        className="text-red-500 hover:text-red-600"
                    >
                        <TrashIcon />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-6">
                {students.map((student) => (
                    <Badge
                        key={student.userMail}
                        variant="outline"
                        className="gap-1 pr-1"
                        style={{ borderColor: tagColor, color: tagColor }}
                    >
                        {student.firstName} {student.lastName}
                        <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.userMail)}
                            className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"
                            aria-label={`Retirer ${student.firstName} ${student.lastName}`}
                        >
                            <XIcon className="size-3" />
                        </button>
                    </Badge>
                ))}

                {students.length === 0 && !isAddingStudent && (
                    <span className="text-sm text-muted-foreground italic">Aucun étudiant</span>
                )}
            </div>

            {isAddingStudent ? (
                <form onSubmit={handleAddStudent} className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        type="email"
                        placeholder="email@etudiant.univ-rennes.fr"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-sm"
                    />
                    <Button type="submit" size="sm" disabled={isSubmitting || !searchQuery.trim()}>
                        Ajouter
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setIsAddingStudent(false); setError(null); setSearchQuery(""); }}
                    >
                        <XIcon />
                    </Button>
                </form>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    className="self-start gap-1.5 text-muted-foreground"
                    onClick={handleStartAdding}
                >
                    <UserPlusIcon className="size-4" />
                    Ajouter un étudiant
                </Button>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
