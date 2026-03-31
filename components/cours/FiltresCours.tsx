"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

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
    const toggleFilter = (filter: CourseFilter) => {
        if (selectedFilters.includes(filter)) {
            onFilterChange(selectedFilters.filter(f => f !== filter));
        } else {
            const newFilters = [...selectedFilters, filter];
            if (newFilters.length === courseFilters.length) {
                onFilterChange([]); // on désactive tout
            } else {
                onFilterChange(newFilters);
            }
        }
    };

    return (
        <div className="flex justify-center mb-4">
            <ButtonGroup>
                {courseFilters.map((filter) => {
                    const isSelected = selectedFilters.includes(filter);
                    return (
                        <Button
                            key={filter}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleFilter(filter)}
                            className={cn(
                                "transition-all duration-150 ease-out w-28 font-medium border-1 ",
                                isSelected
                                    ? "translate-y-[4px] shadow-none"
                                    : "shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:translate-y-[4px] active:shadow-none "
                            )}

                        >
                            {filter}
                        </Button>
                    );
                })}
            </ButtonGroup>
        </div>
    );
}