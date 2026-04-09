"use client"

import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { createSession, updateSession } from "@/lib/actions/session";
import { ActionResult } from "@/lib/actions/types";
import { useTeacher } from "@/lib/hooks/useTeacher";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import SelectGroupComponent from "./select-group";
import SelectTag from "./select-tag";

interface InitialSession {
    sessionId: string;
    subject: string;
    startAt: Date;
    endAt: Date;
    groups: Array<{ groupId: number }>;
    tags?: Array<{ tagId: number }>;
}

function getPreviousQuarterHour(): Date {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.floor(minutes / 15) * 15;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
}

function getInitialDuration(initSession?: InitialSession): string {
    if (!initSession?.startAt || !initSession?.endAt) {
        return "";
    }

    const startDate = new Date(initSession.startAt);
    const endDate = new Date(initSession.endAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return "";
    }

    const durationInMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    return durationInMinutes > 0 ? `${durationInMinutes}` : "";
}

export default function SessionModal({
    resourceId,
    initSession,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: Readonly<{
    resourceId: string;
    initSession?: InitialSession;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}>) {
    const { teacher } = useTeacher();
    const router = useRouter();

    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const isSessionDialogOpen = isControlled ? controlledOpen : internalOpen;
    const setIsSessionDialogOpen = isControlled
        ? (controlledOnOpenChange ?? setInternalOpen)
        : setInternalOpen;

    const [label, setLabel] = useState(initSession?.subject || "");
    const [date, setDate] = useState(initSession?.startAt || getPreviousQuarterHour());
    const [groupsSelected, setGroupsSelected] = useState<string[]>(initSession?.groups.map((group) => `${group.groupId}`) || []);
    const [tagsSelected, setTagsSelected] = useState<string[]>(initSession?.tags?.map((tag) => `${tag.tagId}`) || []);
    const [duration, setDuration] = useState(getInitialDuration(initSession));
    const [isFormValid, setIsFormValid] = useState(false);

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (previousState, formData) => {
        if (initSession === undefined) {
            return await createSession(previousState, formData);
        }

        return await updateSession(previousState, formData);
    }, { pending: true });

    useEffect(() => {
        if ("success" in state) {
            setIsSessionDialogOpen(false);
            setLabel(initSession?.subject || "");
            setDate(initSession?.startAt || getPreviousQuarterHour());
            setDuration(getInitialDuration(initSession));
            setGroupsSelected(initSession?.groups.map((group) => `${group.groupId}`) || []);
            setTagsSelected(initSession?.tags?.map((tag) => `${tag.tagId}`) || []);
            router.refresh();
        }
    }, [initSession, router, state]);

    useEffect(() => {
        setIsFormValid(
            label.trim().length > 0 &&
            !!date &&
            !!duration &&
            (groupsSelected.length > 0 || tagsSelected.length > 0)
        );
    }, [label, date, duration, groupsSelected, tagsSelected]);

    return (
        <Dialog
            modal={false}
            open={isSessionDialogOpen}
            onOpenChange={setIsSessionDialogOpen}
        >
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="default">
                        {initSession === undefined ? "Créer une séance" : "Modifier la séance"}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent
                className="z-50"
                onInteractOutside={(e) => e.preventDefault()}
                onFocusOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="h2 font-normal">
                        {initSession === undefined ? "Créer une séance" : "Modifier la séance"}
                    </DialogTitle>
                    <DialogDescription hidden>
                        Dialogue de création/modification de séance
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="w-full space-y-4">
                    <input type="hidden" name="resourceId" value={resourceId} className="hidden" readOnly />
                    {initSession !== undefined && (
                        <input type="hidden" name="sessionId" value={initSession.sessionId} className="hidden" readOnly />
                    )}
                    <input type="hidden" name="teacherEmail" value={teacher.userMail} className="hidden" readOnly />

                    <div className="w-full flex flex-col gap-2 mb-2">
                        <Label htmlFor="label">Nom de la séance</Label>
                        <Input
                            id="label"
                            name="label"
                            type="text"
                            placeholder="Nom de la séance"
                            value={label}
                            onChange={(event) => setLabel(event.target.value.slice(0, 50))}
                            maxLength={50}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4 mb-2">
                        <DateTimePicker
                            id="start-date"
                            value={date}
                            onChange={setDate}
                            dateLabel="Date de début"
                            timeLabel="Heure de début"
                            step={60 * 15}
                        />
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
                    <SelectTag tagsSelected={tagsSelected} setTagsSelected={setTagsSelected} />

                    <DialogFooter className="flex-col sm:flex-col">
                        {"error" in state && (
                            <p className="text-sm text-red-500">{state.message}</p>
                        )}
                        <Button type="submit" variant="big" className="w-full" disabled={pending || !isFormValid}>
                            {initSession === undefined ? "Créer la séance" : "Modifier la séance"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
