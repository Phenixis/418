"use client";

import { Button } from "@/components/ui/button";
import type { Select as Student } from "@/lib/db/schema/student";
import type { Select as Tag } from "@/lib/db/schema/tag";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import TagCard from "./TagCard";
import TagModal, { type TagModalData } from "./TagModal";

export default function TagsList({
    tagsWithStudents,
}: Readonly<{
    tagsWithStudents: Array<{ tag: Tag; students: Student[] }>;
}>) {
    const [tagModalData, setTagModalData] = useState<TagModalData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    function handleOpenCreate() {
        setTagModalData(null);
        setIsModalOpen(true);
    }

    function handleOpenEdit(data: TagModalData) {
        setTagModalData(data);
        setIsModalOpen(true);
    }

    function handleModalOpenChange(open: boolean) {
        setIsModalOpen(open);
        if (!open) setTagModalData(null);
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                    {tagsWithStudents.length === 0
                        ? "Aucun tag créé."
                        : `${tagsWithStudents.length} tag${tagsWithStudents.length !== 1 ? "s" : ""}`}
                </p>
                <Button onClick={handleOpenCreate} className="gap-2">
                    <PlusIcon className="size-4" />
                    Créer un tag
                </Button>
            </div>

            {tagsWithStudents.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tagsWithStudents.map(({ tag, students }) => (
                        <TagCard
                            key={tag.tagId}
                            tag={tag}
                            students={students}
                            onEdit={handleOpenEdit}
                        />
                    ))}
                </div>
            )}

            <TagModal
                data={tagModalData}
                open={isModalOpen}
                onOpenChange={handleModalOpenChange}
            />
        </>
    );
}
