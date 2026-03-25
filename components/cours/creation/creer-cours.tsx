"use client"

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { creerCours } from "@/lib/actions/cours";
import { ActionResult } from "@/lib/actions/types";
import { useActionState, useEffect, useState } from "react";
import SelectGroupComponent from "./select-group";

export default function CreerCours() {
    const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);

    const [date, setDate] = useState(new Date());
    const [groupsSelected, setGroupsSelected] = useState<string[]>([]);
    const [heureDebut, setHeureDebut] = useState("");
    const [duration, setDuration] = useState("");
    const [label, setLabel] = useState("");

    const [isFormValid, setIsFormValid] = useState(false);

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        return await creerCours(prevState, formData)
    }, { pending: true })

    useEffect(() => {
        if ("success" in state) {
            globalThis.location.href = "/professeur/cours/" + state.course.id
            setLabel("");
            setDate(new Date());
            setHeureDebut("");
            setDuration("");
            setGroupsSelected([]);
        }
    }, [state]);

    useEffect(() => {
        setIsFormValid(
            label !== "" &&
            !!heureDebut &&
            !!duration &&
            groupsSelected.length > 0
        );
    }, [label, heureDebut, duration, groupsSelected]);

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
                    <Button variant="default">Créer un cours</Button>
                </DialogTrigger>
                <DialogContent className="z-50">
                    <DialogHeader>
                        <DialogTitle className="h2 font-normal">Créer un cours</DialogTitle>
                        <DialogDescription hidden>
                            Dialogue de création de cours
                        </DialogDescription>
                    </DialogHeader>
                    <form action={formAction} className="w-full">
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
                            <div className="flex-1 flex flex-col gap-1">
                                <Label id="start-date-label">Date de début</Label>
                                <DatePicker
                                    id="start-date"
                                    aria-labelledby="start-date-label"
                                    value={date}
                                    onChange={setDate}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
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
                            </div>
                            <div className="flex flex-col gap-2">
                                <input type="text" id="duration-hidden" name="duration" className="hidden" value={duration} readOnly />
                                <Label htmlFor="duration">Durée</Label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger>
                                        <SelectValue id="duration" placeholder="Durée" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
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
                                Créer le cours
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}