"use client";

import { useState } from "react";
import CourseTableRow from "@/components/cours/CourseTableRow";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CourseStatus } from "@/components/cours/course.types";
import { vignetteLabels } from "@/components/ui/Vignette";
import type { Select as Course } from "@/lib/db/schema/course";
import type { Select as CourseGroup } from "@/lib/db/schema/course-group";
import type { Select as Group } from "@/lib/db/schema/group";

const statusOrder = [
    CourseStatus.EN_COURS,
    CourseStatus.A_VENIR,
    CourseStatus.TERMINE,
] as const;

/** Couleur de l'indicateur gauche + header selon le statut */
const statusAccent: Record<CourseStatus, string> = {
    [CourseStatus.EN_COURS]: "border-blue-500 text-blue-600",
    [CourseStatus.A_VENIR]: "border-gray-400 text-gray-600",
    [CourseStatus.TERMINE]: "border-green-500 text-green-700",
};

const statusDot: Record<CourseStatus, string> = {
    [CourseStatus.EN_COURS]: "bg-blue-500",
    [CourseStatus.A_VENIR]: "bg-gray-400",
    [CourseStatus.TERMINE]: "bg-green-500",
};

function getCourseStatus(course: Course, now: Date): CourseStatus {
    if (now >= course.startAt && now <= course.endAt) return CourseStatus.EN_COURS;
    if (now < course.startAt) return CourseStatus.A_VENIR;
    return CourseStatus.TERMINE;
}

interface TableauCoursGroupeProps {
    courses: Course[];
    groupCourses: CourseGroup[];
    groups: Group[];
}

interface StatusGroupProps {
    status: CourseStatus;
    courses: Course[];
    groupCourses: CourseGroup[];
    groups: Group[];
    defaultOpen: boolean;
}

function StatusGroup({ status, courses, groupCourses, groups, defaultOpen }: StatusGroupProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (courses.length === 0) return null;

    const accentClass = statusAccent[status];
    const dotClass = statusDot[status];
    const label = vignetteLabels[status];

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
            <CollapsibleTrigger
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-l-4 bg-white/60 hover:bg-white/90 transition-colors ${accentClass}`}
            >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
                <span className="font-semibold text-base flex-1 text-left">{label}</span>
                <span className="text-sm font-normal opacity-60">{courses.length} cours</span>
            </CollapsibleTrigger>

            <CollapsibleContent>
                <div className="mt-2 rounded-lg overflow-hidden border border-white/40 bg-white/40">
                    <Table className="text-center">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-px">Jour</TableHead>
                                <TableHead className="w-px">Début</TableHead>
                                <TableHead className="w-px">Fin</TableHead>
                                <TableHead className="w-full text-xl">Cours</TableHead>
                                <TableHead>Groupes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.map((course) => (
                                <CourseTableRow
                                    key={course.courseId}
                                    cours={course}
                                    showStatus={false}
                                    groups={groups.filter((group) =>
                                        groupCourses.some(
                                            (gc) =>
                                                gc.courseId === course.courseId &&
                                                gc.groupId === group.groupId
                                        )
                                    )}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export default function TableauCoursGroupe({
    courses,
    groupCourses,
    groups,
}: TableauCoursGroupeProps) {
    const now = new Date();

    const grouped = statusOrder.reduce<Record<CourseStatus, Course[]>>(
        (acc, status) => {
            acc[status] = courses.filter(
                (course) => getCourseStatus(course, now) === status
            );
            return acc;
        },
        {
            [CourseStatus.EN_COURS]: [],
            [CourseStatus.A_VENIR]: [],
            [CourseStatus.TERMINE]: [],
        }
    );

    const totalCourses = courses.length;

    if (totalCourses === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                Aucun cours disponible.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {statusOrder.map((status) => (
                <StatusGroup
                    key={status}
                    status={status}
                    courses={grouped[status]}
                    groupCourses={groupCourses}
                    groups={groups}
                    defaultOpen={status !== CourseStatus.TERMINE}
                />
            ))}
        </div>
    );
}
