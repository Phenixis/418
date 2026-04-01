"use client";

import { PortalToBreadcrumb } from "@/app/professeur/(app)/dashboard/breadcrumb-context";
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';
import { useMemo, useState } from "react";
import FiltresCours, { CourseFilter } from "./FiltresCours";
import TableauCours, { CourseWithStatus } from "./TableauCours";

interface CoursContainerProps {
    courses: CourseWithStatus[];
    groupCourses: CourseGroup[];
    groups: Group[];
}

export default function CoursContainer({ courses, groupCourses, groups }: Readonly<CoursContainerProps>) {
    const [selectedFilters, setSelectedFilters] = useState<CourseFilter[]>([]);

    const filteredCourses = useMemo(() => {
        const now = new Date();

        return courses.filter(course => {
            if (selectedFilters.length === 0) return true;

            const isCurrent = now >= course.startAt && now <= course.endAt;
            if (selectedFilters.includes('En cours') && isCurrent) return true;

            const isUpcoming = now < course.startAt;
            if (selectedFilters.includes('À venir') && isUpcoming) return true;

            const isPast = now > course.endAt;
            if (selectedFilters.includes('Terminé') && isPast) return true;

            return false;
        });
    }, [courses, selectedFilters]);

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
                filtered={selectedFilters.length > 0}
            />
        </>
    );
}
