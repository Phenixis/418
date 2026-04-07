"use client";

import { CourseStatus } from "@/components/cours/course.types";
import {
    TableCell,
    TableRow
} from "@/components/ui/table";
import type { Select as CourseGroup } from "@/lib/db/schema/course-group";
import type { Select as Group } from "@/lib/db/schema/group";
import CourseTableRow from "./CourseTableRow";
import { CourseWithStatus } from "./TableauCours";
import { useState } from "react";
import ChevronDownIcon from '@mui/icons-material/ExpandMore';

interface TableauCoursGroupeProps {
    courses: CourseWithStatus[];
    groupCourses: CourseGroup[];
    groups: Group[];
    status: CourseStatus;
}

export default function TableauCoursGroupe({
    courses,
    groupCourses,
    groups,
    status
}: Readonly<TableauCoursGroupeProps>) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (courses.length === 0) {
        return null;
    }

    return (
        <>
            <TableRow className="bg-white/80 hover:bg-white/30 group cursor-pointer" data-state={isExpanded ? 'open' : 'closed'} onClick={() => setIsExpanded(prev => !prev)}>
                <TableCell colSpan={6} className="text-left font-bold p-1 text-base capitalize">
                    <ChevronDownIcon className="shrink-0 !transition-transform !duration-200 !ease-in-out group-data-[state=open]:rotate-180" />
                    {status.split('-').join(' ')}
                </TableCell>
            </TableRow>
            {isExpanded && courses.map(course => (
                <CourseTableRow
                    key={course.courseId}
                    cours={course}
                    showStatus={false}
                    groups={groups.filter(group =>
                        groupCourses.some(
                            groupCourse =>
                                groupCourse.courseId === course.courseId &&
                                groupCourse.groupId === group.groupId
                        )
                    )}
                />
            ))}
        </>
    );
}
