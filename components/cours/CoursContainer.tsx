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

export default function CoursContainer({ courses, groupCourses, groups }: CoursContainerProps) {
    const [selectedFilter, setSelectedFilter] = useState<CourseFilter>('all');

    const now = new Date();

    const filteredCourses = courses.filter(course => {
        if (selectedFilter === 'all') return true;

        const isCurrent = now >= course.startAt && now <= course.endAt;
        if (selectedFilter === 'current') return isCurrent;

        const isUpcoming = now < course.startAt;
        if (selectedFilter === 'upcoming') return isUpcoming;

        const isPast = now > course.endAt;
        if (selectedFilter === 'past') return isPast;

        return true;
    });

    return (
        <>
            <FiltresCours
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
            />
            <TableauCours
                courses={filteredCourses}
                groupCourses={groupCourses}
                groups={groups}
            />
        </>
    );
}
