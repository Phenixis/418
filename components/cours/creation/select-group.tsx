"use client"

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList,
    ComboboxSeparator,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import type { Select as Group } from "@/lib/db/schema/group";
import { useEffect, useMemo, useState } from "react";

type GroupOption = {
    value: string;
    label: string;
    chipLabel: string;
};

export default function SelectGroup({
    groups,
    groupsSelected,
    setGroupsSelected,
    label = 'Groupes',
    placeholder = 'Choisir les groupes',
    hideLabel = false,
    displayMode = 'chips',
    className,
}: Readonly<{
    groups?: Group[];
    groupsSelected: string[];
    setGroupsSelected: (groups: string[]) => void;
    label?: string;
    placeholder?: string;
    hideLabel?: boolean;
    displayMode?: 'chips' | 'summary';
    className?: string;
}>) {
    const [loadedGroups, setLoadedGroups] = useState<Group[]>(groups ?? []);
    const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
    const [groupsError, setGroupsError] = useState<string | null>(null);

    useEffect(() => {
        if (groups) {
            setLoadedGroups(groups);
            setGroupsError(null);
            setIsLoadingGroups(false);
            return;
        }

        const loadGroups = async () => {
            setIsLoadingGroups(true);
            setGroupsError(null);

            try {
                const response = await fetch("/api/teacher/groups");

                if (!response.ok) {
                    throw new Error("Impossible de charger les groupes.");
                }

                const groupsData = (await response.json()) as Group[];
                setLoadedGroups(groupsData);
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : "Une erreur inattendue est survenue pendant le chargement des groupes.";

                setGroupsError(errorMessage);
            } finally {
                setIsLoadingGroups(false);
            }
        };

        void loadGroups();
    }, [groups]);

    const groupedOptions = useMemo(() => {
        const sortedGroups = loadedGroups.slice().sort((groupA, groupB) => {
            const promoComparison = groupA.promo.localeCompare(groupB.promo);

            if (promoComparison !== 0) {
                return promoComparison;
            }

            const tdComparison = groupA.td.localeCompare(groupB.td);

            if (tdComparison !== 0) {
                return tdComparison;
            }

            return groupA.tp.localeCompare(groupB.tp);
        });

        const optionsByPromo = new Map<string, GroupOption[]>();

        for (const group of sortedGroups) {
            const groupLabel = `${group.td}${group.tp}`;
            const groupValue = String(group.groupId);
            const fullGroupLabel = `${group.promo} - ${groupLabel}`;

            if (!optionsByPromo.has(group.promo)) {
                optionsByPromo.set(group.promo, []);
            }

            optionsByPromo.get(group.promo)?.push({
                value: groupValue,
                label: groupLabel,
                chipLabel: fullGroupLabel,
            });
        }

        return Array.from(optionsByPromo.entries()).map(([promo, promoGroups]) => ({
            promo,
            options: promoGroups,
        }));
    }, [loadedGroups]);

    const groupsFlat = useMemo(
        () => groupedOptions.flatMap(({ options }) => options.map((groupOption) => groupOption.value)),
        [groupedOptions]
    );

    const groupLabelByValue = useMemo(() => {
        const valuesWithLabels = groupedOptions.flatMap(({ options }) =>
            options.map((groupOption) => [groupOption.value, groupOption.chipLabel] as const)
        );

        return new Map<string, string>(valuesWithLabels);
    }, [groupedOptions]);

    const chipsAnchor = useComboboxAnchor();
    const hasGroupsSelected = groupsSelected.length > 0;

    const selectedGroupsSummary = groupsSelected.length === 1
        ? '1 classe sélectionnée'
        : `${groupsSelected.length} classes sélectionnées`;

    const containerClassName = hideLabel
        ? (className ? `w-full h-10 ${className}` : 'w-full h-10')
        : (className ? `w-full flex flex-col gap-1 ${className}` : 'w-full flex flex-col gap-1');

    return (
        <div className={containerClassName}>
            {groupsSelected.map((groupValue) => (
                <input
                    key={groupValue}
                    type="hidden"
                    name="groups"
                    value={groupValue}
                    readOnly
                />
            ))}
            {!hideLabel && <Label htmlFor="groups">{label}</Label>}
            <Combobox
                items={groupsFlat}
                multiple
                value={groupsSelected}
                onValueChange={setGroupsSelected}
            >
                <ComboboxChips ref={chipsAnchor} className="h-full items-center overflow-hidden">
                    <ComboboxValue>
                        {displayMode === 'summary' ? (
                            hasGroupsSelected ? (
                                <span className="truncate text-sm text-black/80">{selectedGroupsSummary}</span>
                            ) : null
                        ) : (
                            <div className="flex w-full flex-wrap gap-1.5">
                                {groupsSelected.map((item) => (
                                    <ComboboxChip key={item}>{groupLabelByValue.get(item) ?? item}</ComboboxChip>
                                ))}
                            </div>
                        )}
                    </ComboboxValue>
                    <ComboboxChipsInput
                        className="h-full w-full min-w-0 basis-full text-left"
                        placeholder={placeholder}
                    />
                </ComboboxChips>
                <ComboboxContent anchor={chipsAnchor}>
                    <ComboboxEmpty>Aucune classe trouvée.</ComboboxEmpty>
                    <ComboboxList>
                        {isLoadingGroups && (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                Chargement des groupes...
                            </p>
                        )}
                        {groupsError && (
                            <p className="px-2 py-1.5 text-sm text-destructive">
                                {groupsError}
                            </p>
                        )}
                        {groupedOptions.map(({ promo, options }, index) => (
                            <div key={promo}>
                                <ComboboxGroup>
                                    <ComboboxLabel>Promo {promo}</ComboboxLabel>
                                    {options.map((groupOption) => {
                                        return (
                                            <ComboboxItem key={groupOption.value} value={groupOption.value}>
                                                {groupOption.label}
                                            </ComboboxItem>
                                        )
                                    })}
                                </ComboboxGroup>
                                {index < groupedOptions.length - 1 && <ComboboxSeparator />}
                            </div>
                        ))}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    )
}