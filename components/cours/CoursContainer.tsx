"use client";

import { useMemo, useState } from "react";
import FiltresCours, { CourseFilter } from "./FiltresCours";
import TableauCours from "./TableauCours";
import { Input } from "@/components/ui/input";
import { useSortState } from "@/hooks/use-sort-state";
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as SessionGroup } from '@/lib/db/schema/session-group';
import type { Select as Group } from '@/lib/db/schema/group';

export interface CoursContainerProps {
    courses: Session[];
    groupCourses: SessionGroup[];
    groups: Group[];
}

export default function CoursContainer({ courses, groupCourses, groups }: Readonly<CoursContainerProps>) {
    const [selectedFilters, setSelectedFilters] = useState<CourseFilter[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { sortColumn, sortDirection, handleSort } = useSortState();

    const filteredCourses = useMemo(() => {
        const now = new Date();

        let result = courses.filter(course => {
            if (selectedFilters.length === 0) return true;

            const isCurrent = now >= course.startAt && now <= course.endAt;
            if (selectedFilters.includes('En cours') && isCurrent) return true;

            const isUpcoming = now < course.startAt;
            if (selectedFilters.includes('À venir') && isUpcoming) return true;

            const isPast = now > course.endAt;
            if (selectedFilters.includes('Terminé') && isPast) return true;

            return false;
        });

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter((course) =>
                course.subject.toLowerCase().includes(query)
            );
        }

        // Sort
        if (sortColumn) {
            result = [...result].sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortColumn === 'subject') {
                    aValue = a.subject;
                    bValue = b.subject;
                } else if (sortColumn === 'startAt') {
                    aValue = a.startAt.getTime();
                    bValue = b.startAt.getTime();
                } else if (sortColumn === 'endAt') {
                    aValue = a.endAt.getTime();
                    bValue = b.endAt.getTime();
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue);
                    return sortDirection === 'asc' ? comparison : -comparison;
                }

                const comparison = aValue - bValue;
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [courses, selectedFilters, searchQuery, sortColumn, sortDirection]);

    return (
        <div className="space-y-4">
            {
                filteredCourses.length !== 0 && (
                    <header className="flex flex-col lg:flex-row items-center gap-4">
                        <Input
                            placeholder="Rechercher un cours…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                        <FiltresCours
                            selectedFilters={selectedFilters}
                            onFilterChange={setSelectedFilters}
                        />
                    </header>
                )
            }
            <TableauCours
                courses={filteredCourses}
                groupCourses={groupCourses}
                groups={groups}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
            />
        </div>
    );
}
