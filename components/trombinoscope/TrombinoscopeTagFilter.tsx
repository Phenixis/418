"use client";

import EtudiantCard from "@/components/etudiant/etudiant-card";
import EtudiantCardSkeleton from "@/components/etudiant/etudiant-card-skeleton";
import { Badge } from "@/components/ui/badge";
import type { Select as Student } from "@/lib/db/schema/student";
import type { Select as Tag } from "@/lib/db/schema/tag";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TrombinoscopeTagFilter({
    tags,
}: Readonly<{
    tags: Tag[];
}>) {
    const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedTagId === null) {
            setStudents([]);
            return;
        }

        const loadStudents = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/teacher/tags/${selectedTagId}/students`);
                if (response.ok) {
                    setStudents(await response.json());
                }
            } finally {
                setIsLoading(false);
            }
        };

        void loadStudents();
    }, [selectedTagId]);

    if (tags.length === 0) return null;

    const selectedTag = tags.find((tag) => tag.tagId === selectedTagId);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Filtrer par tag :</span>
                {tags.map((tag) => (
                    <Badge
                        key={tag.tagId}
                        variant={selectedTagId === tag.tagId ? "default" : "outline"}
                        className="cursor-pointer select-none transition-all"
                        style={
                            selectedTagId === tag.tagId
                                ? { backgroundColor: tag.color ?? "#6B7280", borderColor: tag.color ?? "#6B7280", color: "white" }
                                : { borderColor: tag.color ?? "#6B7280", color: tag.color ?? "#6B7280" }
                        }
                        onClick={() => setSelectedTagId(selectedTagId === tag.tagId ? null : tag.tagId)}
                    >
                        {tag.name}
                    </Badge>
                ))}
                {selectedTagId !== null && (
                    <button
                        type="button"
                        onClick={() => setSelectedTagId(null)}
                        className="text-sm text-muted-foreground underline"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>

            {selectedTag && (
                <div className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="size-3 rounded-full shrink-0"
                            style={{ backgroundColor: selectedTag.color ?? "#6B7280" }}
                        />
                        <h2 className="font-semibold">{selectedTag.name}</h2>
                        {!isLoading && (
                            <span className="text-sm text-muted-foreground">
                                {students.length} étudiant{students.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                        {isLoading
                            ? Array.from({ length: 6 }, (_, index) => `skeleton-${index + 1}`).map((key) => (
                                <EtudiantCardSkeleton key={key} />
                            ))
                            : students.slice().sort((a, b) => a.lastName.localeCompare(b.lastName)).map((student) => (
                                <Link
                                    key={student.userMail}
                                    href={`/professeur/etudiant/${student.userMail.split("@")[0]}`}
                                    className="no-underline"
                                >
                                    <EtudiantCard etudiant={student} />
                                </Link>
                            ))}
                        {!isLoading && students.length === 0 && (
                            <p className="text-sm text-muted-foreground italic col-span-full">
                                Aucun étudiant dans ce tag.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
