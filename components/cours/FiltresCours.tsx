"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
  ComboboxTrigger,
} from "@/components/ui/combobox";

export const courseFilters = [
    "En cours",
    "À venir",
    "Terminé",
] as const;

export type CourseFilter = typeof courseFilters[number];

interface FiltresCoursProps {
    selectedFilters: CourseFilter[];
    onFilterChange: (filters: CourseFilter[]) => void;
}

export default function FiltresCours({ selectedFilters, onFilterChange }: FiltresCoursProps) {
    const anchor = useComboboxAnchor();

    return (
        <div className="flex justify-end items-center">
            <Combobox
                multiple
                autoHighlight
                items={courseFilters as unknown as string[]}
                value={selectedFilters}
                onValueChange={(val) => onFilterChange(val as CourseFilter[])}
            >
                <div className="flex items-center gap-2">
                    <ComboboxChips 
                        ref={anchor} 
                        className="w-full max-w-xs min-w-[200px] border border-black/10 shadow-sm rounded-[18px] bg-white px-3 py-1.5 cursor-text hover:border-black/30 transition-colors"
                        onClick={(e) => {
                            const input = e.currentTarget.querySelector('input');
                            if (input) input.focus();
                        }}
                    >
                        <ComboboxValue>
                            {(values) => {
                                const safeValues = values || [];
                                return (
                                    <React.Fragment>
                                        {safeValues.map((value: string) => (
                                            <ComboboxChip key={value} className="rounded-full bg-primary/20 text-black border-transparent">
                                                {value}
                                            </ComboboxChip>
                                        ))}
                                        <ComboboxChipsInput 
                                            placeholder={safeValues.length === 0 ? "Filtrer les cours..." : ""} 
                                            className="min-w-[120px] ml-1 bg-transparent border-none focus:ring-0 text-sm flex-1 !shadow-none" 
                                        />
                                    </React.Fragment>
                                );
                            }}
                        </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxTrigger className="flex items-center justify-center p-2 rounded-full border border-black/10 bg-white hover:bg-gray-50 transition-colors shadow-sm cursor-pointer" />
                </div>
                <ComboboxContent anchor={anchor}>
                    <ComboboxEmpty>Aucun filtre trouvé.</ComboboxEmpty>
                    <ComboboxList>
                        {(item: string) => (
                            <ComboboxItem key={item} value={item}>
                                {item}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>
        </div>
    );
}