"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useActionState, useRef, useState } from "react";
import { Button } from "../ui/button";
import { DatePicker } from "../ui/date-picker";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList,
    ComboboxSeparator,
    ComboboxValue,
    useComboboxAnchor,
} from "@/components/ui/combobox"
import { ActionResult } from "@/lib/actions/types";
import { creerCours } from "@/lib/actions/cours";

const groups = [
    {
        value: "1ère année",
        groups: ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"],
    },
    {
        value: "2ème année",
        groups: ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"],
    },
    {
        value: "3ème année",
        groups: ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2"],
    },
]

const groupsFlat = groups.flatMap(({ value: yearValue, groups: yearGroups }) =>
    yearGroups.map((groupValue) => `${yearValue.charAt(0)}${groupValue}`)
)

export default function CreerCours() {
    const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);
    const [date, setDate] = useState(new Date());
    const [groupsSelected, setGroupsSelected] = useState<string[]>([]);
    const [heureDebut, setHeureDebut] = useState("");
    const [duration, setDuration] = useState("");
    const chipsAnchor = useComboboxAnchor();
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        return await creerCours(prevState, formData)
    }, { pending: true })

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
                <form action={formAction} className="w-full" ref={formRef}>
                    <div className="w-full flex flex-col gap-2 mb-2">
                        <Label htmlFor="label">Nom du cours</Label>
                        <Input id="label" name="label" type="text" placeholder="Nom du cours" required />
                    </div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex-1 flex flex-col gap-1">
                            <Label htmlFor="start-date">Date de début</Label>
                            <DatePicker
                                id="start-date"
                                value={date}
                                onChange={setDate}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <input type="text" id="start-time-hidden" name="start-time" className="hidden" value={heureDebut} readOnly required />
                            <Label htmlFor="start-time">Heure de début</Label>
                            <Select value={heureDebut} onValueChange={setHeureDebut}>
                                <SelectTrigger>
                                    <SelectValue id="start-time" placeholder="Heure de début" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="0815">8h15</SelectItem>
                                        <SelectItem value="0915">9h15</SelectItem>
                                        <SelectItem value="1030">10h30</SelectItem>
                                        <SelectItem value="1130">11h30</SelectItem>
                                        <SelectItem value="1330">13h30</SelectItem>
                                        <SelectItem value="1430">14h30</SelectItem>
                                        <SelectItem value="1545">15h45</SelectItem>
                                        <SelectItem value="1645">16h45</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <input type="text" id="duration-hidden" name="duration" className="hidden" value={duration} readOnly required />
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
                    <div className="w-full flex flex-col gap-2 mb-2">
                        <input type="text" id="groups-hidden" name="groups" className="hidden" value={groupsSelected.join(",")} readOnly required />
                        <Label htmlFor="groups">Groupes</Label>
                        <Combobox
                            items={groupsFlat}
                            multiple
                            value={groupsSelected}
                            onValueChange={setGroupsSelected}
                        >
                            <ComboboxChips ref={chipsAnchor} className="items-start">
                                <ComboboxValue>
                                    <div className="flex w-full flex-wrap gap-1.5">
                                        {groupsSelected.map((item) => (
                                            <ComboboxChip key={item}>{item}</ComboboxChip>
                                        ))}
                                    </div>
                                </ComboboxValue>
                                <ComboboxChipsInput
                                    className="mt-1 w-full min-w-0 basis-full"
                                    placeholder="Choisir les groupes"
                                />
                            </ComboboxChips>
                            <ComboboxContent anchor={chipsAnchor}>
                                <ComboboxEmpty>Aucune classe trouvée.</ComboboxEmpty>
                                <ComboboxList>
                                    {groups.map(({ value: yearValue, groups: yearGroups }, index) => (
                                        <div key={yearValue}>
                                            <ComboboxGroup>
                                                <ComboboxLabel>{yearValue}</ComboboxLabel>
                                                {yearGroups.map((groupValue) => {
                                                    const fullGroupValue = `${yearValue} - ${groupValue}`

                                                    return (
                                                        <ComboboxItem key={fullGroupValue} value={fullGroupValue}>
                                                            {fullGroupValue}
                                                        </ComboboxItem>
                                                    )
                                                })}
                                            </ComboboxGroup>
                                            {index < groups.length - 1 && <ComboboxSeparator />}
                                        </div>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                </form>

                <DialogFooter>
                    <Button type="submit" variant="big" className="w-full" disabled={pending || formRef.current?.checkValidity() === false} onClick={() => formRef.current?.requestSubmit()}>
                        Créer le cours
                    </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </>
    );
}