"use client"

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { creerCours, modifierCours } from "@/lib/actions/cours";
import { ActionResult } from "@/lib/actions/types";
import { useTeacher } from "@/lib/hooks/useTeacher";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import SelectGroupComponent from "./select-group";
import type { Select as Course } from "@/lib/db/schema/course";
import type { Select as Group } from "@/lib/db/schema/group";
import { DateTimePicker } from "@/components/ui/date-time-picker";

export default function CoursModal({
    initCourse,
}: Readonly<{
    initCourse?: Course & { groups: Group[] };
}>) {
    const { teacher } = useTeacher();
    const router = useRouter();

    const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);

    // Valeurs du formulaire
    const [label, setLabel] = useState(initCourse?.subject || "");
    const getPreviousQuarterHour = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        now.setMinutes(roundedMinutes);
        now.setSeconds(0);
        return now;
    };

    const getInitialDuration = () => {
        if (!initCourse?.startAt || !initCourse?.endAt) {
            return "";
        }

        const startDate = new Date(initCourse.startAt);
        const endDate = new Date(initCourse.endAt);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return "";
        }

        const durationInMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
        return durationInMinutes > 0 ? `${durationInMinutes}` : "";
    };

    const [date, setDate] = useState(initCourse?.startAt || getPreviousQuarterHour());
    const [groupsSelected, setGroupsSelected] = useState<string[]>(initCourse?.groups.map((g) => "" + g.groupId) || []);
    const [duration, setDuration] = useState(getInitialDuration());
    const [isFormValid, setIsFormValid] = useState(false);

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        if (initCourse === undefined) {
            return await creerCours(prevState, formData)
        }
        return await modifierCours(prevState, formData)
    }, { pending: true })

    useEffect(() => {
        if ("success" in state) {
            router.push("/professeur/cours/" + state.course.id);
            setIsCreateCourseDialogOpen(false);
            setLabel(initCourse?.subject || "");
            setDate(initCourse?.startAt || getPreviousQuarterHour());
            setDuration(getInitialDuration());
            setGroupsSelected(initCourse?.groups.map((g) => "" + g.groupId) || []);
        }
    }, [state]);

    useEffect(() => {
        setIsFormValid(
            label !== "" &&
            !!date &&
            !!duration &&
            groupsSelected.length > 0
        );
    }, [label, date, duration, groupsSelected]);

    return (
        <>
            {isCreateCourseDialogOpen && (
                <button
                    type="button"
                    aria-label="Fermer le dialogue de création de cours"
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsCreateCourseDialogOpen(false)}
                />
            )}
            <Dialog
                modal={false}
                open={isCreateCourseDialogOpen}
                onOpenChange={setIsCreateCourseDialogOpen}
            >
                <DialogTrigger asChild>
                    <Button variant="default">
                        {
                            initCourse === undefined ? "Créer un cours" : "Modifier le cours"
                        }
                    </Button>
                </DialogTrigger>
                <DialogContent className="z-50">
                    <DialogHeader>
                        <DialogTitle className="h2 font-normal">
                            {
                                initCourse === undefined ? "Créer un cours" : "Modifier le cours"
                            }
                        </DialogTitle>
                        <DialogDescription hidden>
                            Dialogue de création de cours
                        </DialogDescription>
                    </DialogHeader>
                    <form action={formAction} className="w-full">
                        {
                            initCourse !== undefined && (
                                <input type="hidden" name="courseId" value={initCourse.courseId} className="hidden" readOnly />
                            )
                        }
                        <input type="hidden" name="teacherEmail" value={teacher.userMail} className="hidden" readOnly />
                        <div className="w-full flex flex-col gap-2 mb-2">
                            <Label htmlFor="label">Nom du cours</Label>
                            <Input
                                id="label"
                                name="label"
                                type="text"
                                placeholder="Nom du cours"
                                value={label}
                                onChange={(e) => setLabel(e.target.value.slice(0, 50))}
                                maxLength={50}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <DateTimePicker
                                id="start-date"
                                aria-labelledby="start-date-label"
                                value={date}
                                onChange={setDate}
                                dateLabel="Date de début"
                                timeLabel="Heure de début"
                                step={60 * 15}
                            />
                            {/* <div className="flex flex-col gap-2">
                                <input type="text" id="start-time-hidden" name="start-time" className="hidden" value={heureDebut} readOnly />
                                <Label htmlFor="start-time">Heure de début</Label>
                                <Select value={heureDebut} onValueChange={setHeureDebut}>
                                    <SelectTrigger>
                                        <SelectValue id="start-time" placeholder="Heure de début" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="08:15">8h15</SelectItem>
                                            <SelectItem value="09:15">9h15</SelectItem>
                                            <SelectItem value="10:30">10h30</SelectItem>
                                            <SelectItem value="11:30">11h30</SelectItem>
                                            <SelectItem value="13:30">13h30</SelectItem>
                                            <SelectItem value="14:30">14h30</SelectItem>
                                            <SelectItem value="15:45">15h45</SelectItem>
                                            <SelectItem value="16:45">16h45</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div> */}
                            <div className="flex flex-col gap-2">
                                <input type="text" id="duration-hidden" name="duration" className="hidden" value={duration} readOnly />
                                <Label htmlFor="duration">Durée</Label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger>
                                        <SelectValue id="duration" placeholder="Durée" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {duration !== "" && duration !== "60" && duration !== "120" && (
                                                <SelectItem value={duration}>{duration} minutes</SelectItem>
                                            )}
                                            <SelectItem value="60">1 heure</SelectItem>
                                            <SelectItem value="120">2 heures</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <SelectGroupComponent groupsSelected={groupsSelected} setGroupsSelected={setGroupsSelected} />

                        <DialogFooter className="flex-col sm:flex-col">
                            {
                                "error" in state && (
                                    <p className="text-sm text-red-500">
                                        {state.message}
                                    </p>
                                )
                            }
                            <Button type="submit" variant="big" className="w-full" disabled={pending || !isFormValid}>
                                {
                                    initCourse === undefined ? "Créer le cours" : "Modifier le cours"
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}