"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

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
        <div className="flex justify-end mb-4">
            <ButtonGroup>
                {courseFilters.map((filter) => {
                    const isSelected = selectedFilters.includes(filter);
                    return (
                        <Button
                            key={filter}
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleFilter(filter)}
                            className="transition-colors w-24"
                        >
                            {filter}
                        </Button>
                    );
                })}
            </ButtonGroup>
        </div>
    );
}