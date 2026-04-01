"use client";

import { PortalToBreadcrumb } from "@/app/professeur/(app)/dashboard/breadcrumb-context";
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';
import { useMemo, useState } from "react";
import FiltresCours, { CourseFilter } from "./FiltresCours";
import TableauCours, { CourseWithStatus } from "./TableauCours";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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


interface CoursContainerProps {
    courses: CourseWithStatus[];
    groupCourses: CourseGroup[];
    groups: Group[];
}

export default function CoursContainer({ courses, groupCourses, groups }: Readonly<CoursContainerProps>) {
    const [selectedFilters, setSelectedFilters] = useState<CourseFilter[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
    const [selectedPromo, setSelectedPromo] = useState<string | null>(null);

    const togglePromo = (promo: string) => {
        if (selectedPromo === promo) {
            setSelectedPromo(null);
            setSelectedGroupIds([]);
        } else {
            setSelectedPromo(promo);
            setSelectedGroupIds([]);
        }
    };

    const toggleGroup = (groupId: number) => {
        setSelectedGroupIds(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    // Calcul des promotions et groupes visibles
    const availablePromos = useMemo(() => {
        return [...new Set(groups.map((g) => g.promo))].sort();
    }, [groups]);

    const visibleGroups = useMemo(() => {
        if (!selectedPromo) return [];
        return groups.filter((g) => g.promo === selectedPromo);
    }, [groups, selectedPromo]);

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
                selectedGroupIds.includes(gc.groupId)
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
                    {/* Filtres par statut */}
                    <FiltresCours
                        selectedFilters={selectedFilters}
                        onFilterChange={setSelectedFilters}
                    />
                </div>
            </PortalToBreadcrumb>

            <div className="flex flex-col gap-6 mt-10 mb-5 bg-white/40 p-5 rounded-xl border border-white/60 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-8">
                    {/* Section Promotion */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Promotion :</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {availablePromos.map((promo) => {
                                const isSelected = selectedPromo === promo;
                                return (
                                    <Button
                                        key={promo}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => togglePromo(promo)}
                                        className={cn(
                                            "h-9 px-5 text-sm font-bold transition-all duration-150 ease-out border uppercase",
                                            isSelected
                                                ? "translate-y-[3px] shadow-none"
                                                : "shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:translate-y-[3px] active:shadow-none"
                                        )}
                                    >
                                        Promo {promo}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filtre par semaine */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Période :</span>
                        {availableWeeks.length > 0 && (
                            <div className="flex items-center gap-2">
                                <CalendarTodayIcon className="!size-4 text-muted-foreground" />
                                <Select
                                    value={selectedWeek ?? "all"}
                                    onValueChange={(value) => setSelectedWeek(value === "all" ? null : value)}
                                >
                                    <SelectTrigger size="default" className="w-[280px] bg-white/80 h-10 font-medium">
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
                                        className="h-10 px-3 text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        Fermer
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Section Groupes - Affichée dynamiquement */}
                {selectedPromo && (
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/40 animate-in fade-in duration-300">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Groupes :</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {visibleGroups.map((group) => {
                                const label = `${group.td}${group.tp}`;
                                const isSelected = selectedGroupIds.includes(group.groupId);
                                return (
                                    <Button
                                        key={group.groupId}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleGroup(group.groupId)}
                                        className={cn(
                                            "h-9 px-4 text-sm font-medium transition-all duration-150 ease-out border uppercase",
                                            isSelected
                                                ? "translate-y-[3px] shadow-none"
                                                : "shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:translate-y-[3px] active:shadow-none"
                                        )}
                                    >
                                        {label}
                                    </Button>
                                );
                            })}
                            {selectedGroupIds.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedGroupIds([])}
                                    className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Effacer
                                </Button>
                            )}
                        </div>
                    </div>
                )}
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
