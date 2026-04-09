"use client";

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import type { Select as Tag } from "@/lib/db/schema/tag";
import { useEffect, useId, useMemo, useState } from "react";

export default function SelectTag({
    tags,
    tagsSelected,
    setTagsSelected,
}: Readonly<{
    tags?: Tag[];
    tagsSelected: string[];
    setTagsSelected: (tags: string[]) => void;
}>) {
    const [loadedTags, setLoadedTags] = useState<Tag[]>(tags ?? []);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const [tagsError, setTagsError] = useState<string | null>(null);

    useEffect(() => {
        if (tags) {
            setLoadedTags(tags);
            return;
        }

        const loadTags = async () => {
            setIsLoadingTags(true);
            setTagsError(null);
            try {
                const response = await fetch("/api/teacher/tags");
                if (!response.ok) throw new Error("Impossible de charger les tags.");
                setLoadedTags(await response.json());
            } catch (error) {
                setTagsError(error instanceof Error ? error.message : "Erreur inattendue.");
            } finally {
                setIsLoadingTags(false);
            }
        };

        void loadTags();
    }, [tags]);

    const tagOptions = useMemo(
        () => loadedTags.map((tag) => ({ value: String(tag.tagId), label: tag.name, color: tag.color })),
        [loadedTags]
    );

    const tagValues = useMemo(() => tagOptions.map((opt) => opt.value), [tagOptions]);

    const labelByValue = useMemo(
        () => new Map(tagOptions.map((opt) => [opt.value, opt.label])),
        [tagOptions]
    );

    const chipsAnchor = useComboboxAnchor();
    const inputId = useId();

    if (loadedTags.length === 0 && !isLoadingTags) return null;

    return (
        <div className="w-full flex flex-col gap-1">
            {tagsSelected.map((tagValue) => (
                <input key={tagValue} type="hidden" name="tags" value={tagValue} readOnly />
            ))}
            <Label htmlFor={inputId}>Tags</Label>
            <Combobox
                items={tagValues}
                multiple
                value={tagsSelected}
                onValueChange={setTagsSelected}
            >
                <ComboboxChips ref={chipsAnchor} className="h-full items-center overflow-hidden">
                    <ComboboxValue>
                        <div className="flex w-full flex-wrap gap-1.5">
                            {tagsSelected.map((item) => (
                                <ComboboxChip key={item}>{labelByValue.get(item) ?? item}</ComboboxChip>
                            ))}
                        </div>
                    </ComboboxValue>
                    <ComboboxChipsInput
                        id={inputId}
                        className="h-full w-full min-w-0 basis-full text-left"
                        placeholder="Choisir des tags"
                    />
                </ComboboxChips>
                <ComboboxContent anchor={chipsAnchor}>
                    <ComboboxEmpty>Aucun tag trouvé.</ComboboxEmpty>
                    <ComboboxList>
                        {isLoadingTags && (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">Chargement des tags...</p>
                        )}
                        {tagsError && (
                            <p className="px-2 py-1.5 text-sm text-destructive">{tagsError}</p>
                        )}
                        <ComboboxGroup>
                            {tagOptions.map((opt) => (
                                <ComboboxItem key={opt.value} value={opt.value}>
                                    <span
                                        className="size-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: opt.color ?? "#6B7280" }}
                                    />
                                    {opt.label}
                                </ComboboxItem>
                            ))}
                        </ComboboxGroup>
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    );
}
