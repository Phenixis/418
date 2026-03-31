"use client";

import { useState } from "react";
import FiltresCours, { CourseFilter } from "./FiltresCours";
import TableauCours from "./TableauCours";
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';

interface CoursContainerProps {
    courses: Course[];
    groupCourses: CourseGroup[];
    groups: Group[];
}

import { PortalToBreadcrumb } from "@/app/professeur/(app)/dashboard/breadcrumb-context";

export default function CoursContainer({ courses, groupCourses, groups }: CoursContainerProps) {
    const [selectedFilters, setSelectedFilters] = useState<CourseFilter[]>([]);

    const now = new Date();

    const filteredCourses = courses.filter(course => {
        if (selectedFilters.length === 0) return true;

        const isCurrent = now >= course.startAt && now <= course.endAt;
        if (selectedFilters.includes('En cours') && isCurrent) return true;

        const isUpcoming = now < course.startAt;
        if (selectedFilters.includes('À venir') && isUpcoming) return true;

        const isPast = now > course.endAt;
        if (selectedFilters.includes('Terminé') && isPast) return true;

        return false;
    });

    return (
        <>
            <PortalToBreadcrumb>
                <FiltresCours
                    selectedFilters={selectedFilters}
                    onFilterChange={setSelectedFilters}
                />
            </PortalToBreadcrumb>
            
            <TableauCours
                courses={filteredCourses}
                groupCourses={groupCourses}
                groups={groups}
            />
        </>
    );
}
