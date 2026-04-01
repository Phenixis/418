"use client";

import { PortalToBreadcrumb } from "@/app/professeur/(app)/dashboard/breadcrumb-context";
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';
import { useMemo, useState } from "react";
import FiltresCours, { CourseFilter } from "./FiltresCours";
import TableauCours, { CourseWithStatus } from "./TableauCours";
import { Button } from "@/components/ui/button";
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SelectGroup from "@/components/cours/creation/select-group";

interface CoursContainerProps {
    courses: CourseWithStatus[];
    groupCourses: CourseGroup[];
    groups: Group[];
}

export default function CoursContainer({ courses, groupCourses, groups }: Readonly<CoursContainerProps>) {
    const [selectedFilters, setSelectedFilters] = useState<CourseFilter[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

    // Calcul des semaines disponibles
    const availableWeeks = useMemo(() => {
        const weeksMap = new Map<string, { week: number; label: string }>();

        courses.forEach((course) => {
            const date = new Date(course.startAt);
            const week = getISOWeek(date);
            const year = getISOWeekYear(date);
            const key = `${year}-W${week}`;

            if (!weeksMap.has(key)) {
                const start = startOfISOWeek(date);
                const end = endOfISOWeek(date);
                weeksMap.set(key, {
                    week,
                    label: `Semaine ${week} (${format(start, "d MMM", { locale: fr })} - ${format(end, "d MMM", { locale: fr })})`,
                });
            }
        });

        return Array.from(weeksMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [courses]);

    // 1. Filtre par statut
    const filteredByStatus = useMemo(() => {
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

    // 2. Filtre par groupe TD/TP
    const filteredByGroup = useMemo(() => {
        if (selectedGroupIds.length === 0) return filteredByStatus;
        return filteredByStatus.filter(course =>
            groupCourses.some(gc =>
                gc.courseId === course.courseId &&
                selectedGroupIds.includes(String(gc.groupId))
            )
        );
    }, [filteredByStatus, selectedGroupIds, groupCourses]);

    // 3. Filtre par semaine
    const filteredCourses = useMemo(() => {
        if (!selectedWeek || selectedWeek === "all") return filteredByGroup;
        return filteredByGroup.filter(course => {
            const date = new Date(course.startAt);
            const week = getISOWeek(date);
            const year = getISOWeekYear(date);
            return `${year}-W${week}` === selectedWeek;
        });
    }, [filteredByGroup, selectedWeek]);

    const isFiltered = selectedFilters.length > 0 || selectedGroupIds.length > 0 || (selectedWeek !== null && selectedWeek !== "all");

    return (
        <>
            <PortalToBreadcrumb>
                <div className="flex flex-col items-center gap-2">
                    <FiltresCours
                        selectedFilters={selectedFilters}
                        onFilterChange={setSelectedFilters}
                    />
                </div>
            </PortalToBreadcrumb>

            <div className="flex flex-col gap-4 mt-10 mb-8 bg-white/40 p-6 rounded-2xl border border-white/60 backdrop-blur-md shadow-sm transition-all">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    {/* Section Groupes via SelectGroup */}
                    <div className="flex-1 min-w-[300px]">
                        <SelectGroup className="w-[250px]" 
                            groupsSelected={selectedGroupIds}
                            setGroupsSelected={setSelectedGroupIds}
                            initialGroups={groups}
                        />
                    </div>

                    {/* Filtre par semaine */}
                    <div className="flex flex-col gap-2 mb-2">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Période</span>
                        {availableWeeks.length > 0 && (
                            <div className="flex items-center gap-2">
                                <CalendarTodayIcon className="!size-4 text-muted-foreground" />
                                <Select
                                    value={selectedWeek ?? "all"}
                                    onValueChange={(value) => setSelectedWeek(value === "all" ? null : value)}
                                >
                                    <SelectTrigger size="default" className="w-[300px] bg-white/80 h-10 font-medium border-white/80">
                                        <SelectValue placeholder="Toutes les semaines" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes les semaines</SelectItem>
                                        {availableWeeks.map(([key, data]) => (
                                            <SelectItem key={key} value={key}>
                                                {data.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedWeek && selectedWeek !== "all" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedWeek(null)}
                                        className="h-10 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/40"
                                    >
                                        Fermer
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <TableauCours
                courses={filteredCourses}
                groupCourses={groupCourses}
                groups={groups}
                filtered={isFiltered}
                alphaSorted={false}
            />
        </>
    );
}
