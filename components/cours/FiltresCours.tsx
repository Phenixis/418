"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";

export type CourseFilter = 'all' | 'current' | 'upcoming' | 'past';

interface FiltresCoursProps {
    selectedFilter: CourseFilter;
    onFilterChange: (filter: CourseFilter) => void;
}

export default function FiltresCours({ selectedFilter, onFilterChange }: FiltresCoursProps) {
    const filterButtons: Array<{ id: CourseFilter; label: string }> = [
        { id: 'all', label: 'Tous les cours' },
        { id: 'current', label: 'En cours' },
        { id: 'upcoming', label: 'À venir' },
        { id: 'past', label: 'Terminé' },
    ];

    return (
        <div className="mb-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="default" className="font-action">
                        <ListFilter /> Filtres
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                    <DropdownMenuLabel>Filtrer par état</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedFilter} onValueChange={(val) => onFilterChange(val as CourseFilter)}>
                        {filterButtons.map((button) => (
                            <DropdownMenuRadioItem key={button.id} value={button.id}>
                                {button.label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}