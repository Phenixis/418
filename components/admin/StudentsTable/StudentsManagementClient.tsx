'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { getStudentPictureSrc } from '@/lib/utils/student-picture';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

type StudentsManagementClientProps = {
    initialStudents: Student[];
    groups: Group[];
};

type StudentFormState = {
    firstName: string;
    lastName: string;
    email: string;
    groupId: string;
    picture: string | null;
};

const STUDENT_EMAIL_DOMAIN = 'etudiant.univ-rennes.fr';
const UNASSIGNED_GROUP_ID = 'unassigned';
const ALL_FILTER_VALUE = 'all';

function isBlobStudentPath(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.startsWith('students/');
}

function buildGroupLabel(group: Group): string {
    return `${group.promo}${group.td}${group.tp}`;
}

function normalizeStudentEmail(inputEmail: string): string {
    const normalizedEmail = inputEmail.trim().toLowerCase();

    if (!normalizedEmail) {
        return '';
    }

    if (normalizedEmail.includes('@')) {
        return normalizedEmail;
    }

    return `${normalizedEmail}@${STUDENT_EMAIL_DOMAIN}`;
}

function stripStudentEmailDomain(inputEmail: string): string {
    const normalizedEmail = inputEmail.trim().toLowerCase();
    const suffix = `@${STUDENT_EMAIL_DOMAIN}`;

    if (normalizedEmail.endsWith(suffix)) {
        return normalizedEmail.slice(0, -suffix.length);
    }

    return normalizedEmail;
}

function toApiGroupId(rawGroupId: string): number | null {
    if (rawGroupId === UNASSIGNED_GROUP_ID) {
        return null;
    }

    return Number.parseInt(rawGroupId, 10);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
    const responseBody = await response.json() as T & { error?: string };

    if (!response.ok) {
        throw new Error(responseBody.error ?? 'Une erreur est survenue.');
    }

    return responseBody;
}

async function deleteTemporaryUploadedPicture(pathname: string): Promise<void> {
    const response = await fetch('/api/admin/students/upload', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pathname }),
    });

    const responseBody = await response.json() as { error?: string };

    if (!response.ok) {
        throw new Error(responseBody.error ?? 'Suppression image temporaire impossible.');
    }
}

function createDefaultFormState(): StudentFormState {
    return {
        firstName: '',
        lastName: '',
        email: '',
        groupId: UNASSIGNED_GROUP_ID,
        picture: null,
    };
}

export default function StudentsManagementClient({ initialStudents, groups }: Readonly<StudentsManagementClientProps>) {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [createFormState, setCreateFormState] = useState<StudentFormState>(createDefaultFormState());
    const [editFormState, setEditFormState] = useState<StudentFormState>(createDefaultFormState());
    const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState<string>(ALL_FILTER_VALUE);
    const [yearFilter, setYearFilter] = useState<string>(ALL_FILTER_VALUE);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [moveTargetGroupId, setMoveTargetGroupId] = useState<string>('');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [uploadingImageField, setUploadingImageField] = useState<'create' | 'edit' | null>(null);
    const [temporaryCreatePicturePath, setTemporaryCreatePicturePath] = useState<string | null>(null);
    const [temporaryEditPicturePath, setTemporaryEditPicturePath] = useState<string | null>(null);
    const [openYearKeys, setOpenYearKeys] = useState<Record<string, boolean>>(() => {
        const defaultOpenYearKeys: Record<string, boolean> = {};

        for (const group of groups) {
            defaultOpenYearKeys[group.promo] = true;
        }

        return defaultOpenYearKeys;
    });
    const [openGroupKeys, setOpenGroupKeys] = useState<Record<string, boolean>>(() => {
        const defaultOpenGroupKeys: Record<string, boolean> = {};

        for (const group of groups) {
            defaultOpenGroupKeys[String(group.groupId)] = true;
        }

        defaultOpenGroupKeys[UNASSIGNED_GROUP_ID] = true;

        return defaultOpenGroupKeys;
    });

    const sortedGroups = useMemo(() => {
        return groups.slice().sort((firstGroup, secondGroup) => {
            const firstLabel = buildGroupLabel(firstGroup);
            const secondLabel = buildGroupLabel(secondGroup);
            return firstLabel.localeCompare(secondLabel, 'fr');
        });
    }, [groups]);

    const groupsById = useMemo(() => {
        return new Map(sortedGroups.map((group) => [group.groupId, group]));
    }, [sortedGroups]);

    const availableYears = useMemo(() => {
        const uniqueYears = [...new Set(sortedGroups.map((group) => group.promo))];

        return uniqueYears.sort((firstYear, secondYear) => Number(firstYear) - Number(secondYear));
    }, [sortedGroups]);

    const groupedStudents = useMemo(() => {
        const groupedById = new Map<string, Student[]>();

        for (const group of sortedGroups) {
            groupedById.set(String(group.groupId), []);
        }

        groupedById.set(UNASSIGNED_GROUP_ID, []);

        const normalizedSearchTerm = searchTerm.trim().toLowerCase();

        for (const student of students) {
            const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
            const matchesSearch = normalizedSearchTerm.length === 0
                || fullName.includes(normalizedSearchTerm)
                || student.userMail.toLowerCase().includes(normalizedSearchTerm);

            if (!matchesSearch) {
                continue;
            }

            const studentGroupKey = typeof student.groupId === 'number' ? String(student.groupId) : UNASSIGNED_GROUP_ID;

            const currentGroupStudents = groupedById.get(studentGroupKey) ?? [];
            currentGroupStudents.push(student);
            groupedById.set(studentGroupKey, currentGroupStudents);
        }

        for (const [groupKey, groupStudents] of groupedById.entries()) {
            const sortedGroupStudents = [...groupStudents].sort((firstStudent, secondStudent) => {
                const lastNameOrder = firstStudent.lastName.localeCompare(secondStudent.lastName, 'fr');
                if (lastNameOrder !== 0) {
                    return lastNameOrder;
                }

                return firstStudent.firstName.localeCompare(secondStudent.firstName, 'fr');
            });

            groupedById.set(groupKey, sortedGroupStudents);
        }

        return groupedById;
    }, [searchTerm, sortedGroups, students]);

    const visibleGroups = useMemo(() => {
        return sortedGroups.filter((group) => {
            const groupKey = String(group.groupId);
            const matchesGroup = groupFilter === ALL_FILTER_VALUE || groupFilter === groupKey;
            const matchesYear = yearFilter === ALL_FILTER_VALUE || group.promo === yearFilter;

            return matchesGroup && matchesYear;
        });
    }, [groupFilter, sortedGroups, yearFilter]);

    const visibleGroupsByYear = useMemo(() => {
        const groupsByYear: Record<string, Group[]> = {};

        for (const group of visibleGroups) {
            if (!groupsByYear[group.promo]) {
                groupsByYear[group.promo] = [];
            }

            groupsByYear[group.promo].push(group);
        }

        return groupsByYear;
    }, [visibleGroups]);

    const sortedVisibleYears = useMemo(() => {
        return Object.keys(visibleGroupsByYear).sort((firstYear, secondYear) => Number(firstYear) - Number(secondYear));
    }, [visibleGroupsByYear]);

    const shouldShowUnassignedGroup = useMemo(() => {
        return groupFilter === ALL_FILTER_VALUE || groupFilter === UNASSIGNED_GROUP_ID;
    }, [groupFilter]);

    const selectedStudent = useMemo(() => {
        if (!selectedStudentEmail) {
            return null;
        }

        return students.find((student) => student.userMail === selectedStudentEmail) ?? null;
    }, [selectedStudentEmail, students]);

    const moveCandidateGroups = useMemo(() => {
        if (selectedStudent?.groupId == null) {
            return [] as Group[];
        }

        const selectedStudentGroup = groupsById.get(selectedStudent.groupId);

        if (!selectedStudentGroup) {
            return [] as Group[];
        }

        return sortedGroups.filter((group) => {
            return group.promo === selectedStudentGroup.promo && group.groupId !== selectedStudentGroup.groupId;
        });
    }, [groupsById, selectedStudent, sortedGroups]);

    function resetStatusMessages(): void {
        setFeedbackMessage(null);
        setErrorMessage(null);
    }

    async function handleImageUpload(file: File, field: 'create' | 'edit'): Promise<void> {
        setIsUploadingImage(true);
        setUploadingImageField(field);
        resetStatusMessages();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/admin/students/upload', {
                method: 'POST',
                body: formData,
            });

            const responseData = await parseJsonResponse<{ url: string; pathname: string; success: boolean }>(response);

            if (field === 'create') {
                if (temporaryCreatePicturePath && temporaryCreatePicturePath !== responseData.pathname) {
                    await deleteTemporaryUploadedPicture(temporaryCreatePicturePath);
                }

                setCreateFormState((previousState) => ({
                    ...previousState,
                    picture: responseData.pathname,
                }));
                setTemporaryCreatePicturePath(responseData.pathname);
            } else {
                if (temporaryEditPicturePath && temporaryEditPicturePath !== responseData.pathname) {
                    await deleteTemporaryUploadedPicture(temporaryEditPicturePath);
                }

                setEditFormState((previousState) => ({
                    ...previousState,
                    picture: responseData.pathname,
                }));
                setTemporaryEditPicturePath(responseData.pathname);
            }

            setFeedbackMessage('Image uploadée avec succès.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload de l\'image.';
            setErrorMessage(errorMessage);
        } finally {
            setIsUploadingImage(false);
            setUploadingImageField(null);
        }
    }

    async function handleCreateDialogOpenChange(isOpen: boolean): Promise<void> {
        if (isOpen) {
            setIsCreateDialogOpen(true);
            return;
        }

        if (isBlobStudentPath(temporaryCreatePicturePath)) {
            try {
                await deleteTemporaryUploadedPicture(temporaryCreatePicturePath);
            } catch (error) {
                console.error('Suppression image temporaire impossible:', error);
            }
        }

        setTemporaryCreatePicturePath(null);
        setCreateFormState(createDefaultFormState());
        setIsCreateDialogOpen(false);
    }

    async function handleEditDialogOpenChange(isOpen: boolean): Promise<void> {
        if (isOpen) {
            setIsEditDialogOpen(true);
            return;
        }

        if (isBlobStudentPath(temporaryEditPicturePath)) {
            try {
                await deleteTemporaryUploadedPicture(temporaryEditPicturePath);
            } catch (error) {
                console.error('Suppression image temporaire impossible:', error);
            }
        }

        setTemporaryEditPicturePath(null);
        setIsEditDialogOpen(false);
    }

    function updateGroupOpenState(groupKey: string, isOpen: boolean): void {
        setOpenGroupKeys((previousOpenGroupKeys) => ({
            ...previousOpenGroupKeys,
            [groupKey]: isOpen,
        }));
    }

    function updateYearOpenState(year: string, isOpen: boolean): void {
        setOpenYearKeys((previousOpenYearKeys) => ({
            ...previousOpenYearKeys,
            [year]: isOpen,
        }));
    }

    function setVisibilityForAllSections(isOpen: boolean): void {
        setOpenYearKeys((previousOpenYearKeys) => {
            const nextOpenYearKeys = { ...previousOpenYearKeys };

            for (const year of sortedVisibleYears) {
                nextOpenYearKeys[year] = isOpen;
            }

            return nextOpenYearKeys;
        });

        setOpenGroupKeys((previousOpenGroupKeys) => {
            const nextOpenGroupKeys = { ...previousOpenGroupKeys };

            for (const group of visibleGroups) {
                nextOpenGroupKeys[String(group.groupId)] = isOpen;
            }

            if (shouldShowUnassignedGroup) {
                nextOpenGroupKeys[UNASSIGNED_GROUP_ID] = isOpen;
            }

            return nextOpenGroupKeys;
        });
    }

    function openCreateDialog(): void {
        resetStatusMessages();
        setCreateFormState(createDefaultFormState());
        setTemporaryCreatePicturePath(null);
        setIsCreateDialogOpen(true);
    }

    function openEditDialog(student: Student): void {
        resetStatusMessages();
        setSelectedStudentEmail(student.userMail);
        setEditFormState({
            firstName: student.firstName,
            lastName: student.lastName,
            email: stripStudentEmailDomain(student.userMail),
            groupId: typeof student.groupId === 'number' ? String(student.groupId) : UNASSIGNED_GROUP_ID,
            picture: student.picture,
        });
        setTemporaryEditPicturePath(null);
        setIsEditDialogOpen(true);
    }

    function openDeleteDialog(student: Student): void {
        resetStatusMessages();
        setSelectedStudentEmail(student.userMail);
        setIsDeleteDialogOpen(true);
    }

    function openMoveDialog(student: Student): void {
        resetStatusMessages();
        setSelectedStudentEmail(student.userMail);

        if (student.groupId === null) {
            setMoveTargetGroupId('');
            setErrorMessage('Cet étudiant n\'a pas de classe actuelle. Utilise Modifier pour lui attribuer une classe.');
            return;
        }

        const selectedStudentGroup = groupsById.get(student.groupId);

        if (!selectedStudentGroup) {
            setMoveTargetGroupId('');
            setErrorMessage('Classe actuelle introuvable.');
            return;
        }

        const availableMoveTargets = sortedGroups.filter((group) => {
            return group.promo === selectedStudentGroup.promo && group.groupId !== selectedStudentGroup.groupId;
        });

        if (availableMoveTargets.length === 0) {
            setMoveTargetGroupId('');
            setErrorMessage('Aucune autre classe disponible dans la même année.');
            return;
        }

        setMoveTargetGroupId(String(availableMoveTargets[0].groupId));
        setIsMoveDialogOpen(true);
    }

    async function handleCreateStudent(): Promise<void> {
        setIsSubmitting(true);
        resetStatusMessages();

        try {
            const response = await fetch('/api/admin/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: createFormState.firstName,
                    lastName: createFormState.lastName,
                    email: normalizeStudentEmail(createFormState.email),
                    groupId: toApiGroupId(createFormState.groupId),
                    picture: createFormState.picture,
                }),
            });

            const responseBody = await parseJsonResponse<{ student: Student }>(response);

            setStudents((previousStudents) => [responseBody.student, ...previousStudents]);
            setTemporaryCreatePicturePath(null);
            setIsCreateDialogOpen(false);
            setFeedbackMessage('Étudiant créé avec succès.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Création impossible.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleUpdateStudent(): Promise<void> {
        if (!selectedStudent) {
            return;
        }

        setIsSubmitting(true);
        resetStatusMessages();

        try {
            const response = await fetch('/api/admin/students', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentEmail: selectedStudent.userMail,
                    firstName: editFormState.firstName,
                    lastName: editFormState.lastName,
                    email: normalizeStudentEmail(editFormState.email),
                    groupId: toApiGroupId(editFormState.groupId),
                    picture: editFormState.picture,
                }),
            });

            const responseBody = await parseJsonResponse<{ student: Student }>(response);

            setStudents((previousStudents) => previousStudents.map((student) => (
                student.userMail === selectedStudent.userMail ? responseBody.student : student
            )));

            setTemporaryEditPicturePath(null);
            setIsEditDialogOpen(false);
            setSelectedStudentEmail(null);
            setFeedbackMessage('Étudiant modifié avec succès.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Mise à jour impossible.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeleteStudent(): Promise<void> {
        if (!selectedStudent) {
            return;
        }

        setIsSubmitting(true);
        resetStatusMessages();

        try {
            const response = await fetch('/api/admin/students', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: selectedStudent.userMail,
                }),
            });

            await parseJsonResponse<{ student: Student }>(response);

            setStudents((previousStudents) => previousStudents.filter((student) => student.userMail !== selectedStudent.userMail));
            setIsDeleteDialogOpen(false);
            setSelectedStudentEmail(null);
            setFeedbackMessage('Étudiant supprimé avec succès.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Suppression impossible.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleMoveStudent(studentEmail: string, targetGroupId: string): Promise<void> {
        const movedStudent = students.find((student) => student.userMail === studentEmail);

        if (!movedStudent) {
            return;
        }

        const parsedTargetGroupId = toApiGroupId(targetGroupId);

        if ((movedStudent.groupId ?? null) === parsedTargetGroupId) {
            return;
        }

        setIsSubmitting(true);
        resetStatusMessages();

        try {
            const response = await fetch('/api/admin/students', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentEmail: movedStudent.userMail,
                    firstName: movedStudent.firstName,
                    lastName: movedStudent.lastName,
                    email: movedStudent.userMail,
                    groupId: parsedTargetGroupId,
                }),
            });

            const responseBody = await parseJsonResponse<{ student: Student }>(response);

            setStudents((previousStudents) => previousStudents.map((student) => (
                student.userMail === movedStudent.userMail ? responseBody.student : student
            )));

            setFeedbackMessage('Affectation de classe mise à jour.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Déplacement impossible.');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleMoveStudentFromDialog(): Promise<void> {
        if (!selectedStudent || !moveTargetGroupId) {
            return;
        }

        await handleMoveStudent(selectedStudent.userMail, moveTargetGroupId);
        setIsMoveDialogOpen(false);
        setSelectedStudentEmail(null);
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end justify-between">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="min-w-64 space-y-1">
                        <Label htmlFor="search-student">Recherche</Label>
                        <Input
                            id="search-student"
                            placeholder="Nom ou email"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Filtre année</Label>
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="Toutes les années" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>Toutes les années</SelectItem>
                                {availableYears.map((year) => (
                                    <SelectItem key={year} value={year}>
                                        Année {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label>Filtre classe</Label>
                        <Select value={groupFilter} onValueChange={setGroupFilter}>
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="Toutes les classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_FILTER_VALUE}>Toutes les classes</SelectItem>
                                {sortedGroups.map((group) => (
                                    <SelectItem key={group.groupId} value={String(group.groupId)}>
                                        {buildGroupLabel(group)}
                                    </SelectItem>
                                ))}
                                <SelectItem value={UNASSIGNED_GROUP_ID}>Non assigné</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled title="L'import CSV sera branché dans une prochaine étape.">
                        <FileUploadIcon /> Importer des étudiants
                    </Button>
                    <Button variant="outline" onClick={() => setVisibilityForAllSections(true)}>
                        Tout déplier
                    </Button>
                    <Button variant="outline" onClick={() => setVisibilityForAllSections(false)}>
                        Tout replier
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <AddIcon /> Ajouter un étudiant
                    </Button>
                </div>
            </div>

            {feedbackMessage && (
                <p className="text-sm text-green-700">{feedbackMessage}</p>
            )}

            {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <div className="space-y-4">
                {sortedVisibleYears.map((year) => {
                    const yearGroups = visibleGroupsByYear[year] ?? [];
                    const yearStudentsCount = yearGroups.reduce((totalStudents, group) => {
                        return totalStudents + (groupedStudents.get(String(group.groupId)) ?? []).length;
                    }, 0);

                    return (
                        <Collapsible
                            key={`year-${year}`}
                            className="rounded-xl border bg-white/80 p-4 space-y-3"
                            open={openYearKeys[year] ?? true}
                            onOpenChange={(isOpen) => updateYearOpenState(year, isOpen)}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h2>
                                    <CollapsibleTrigger className="h2">
                                        Année {year}
                                    </CollapsibleTrigger>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{yearGroups.length} classes</Badge>
                                    <Badge variant="outline">{yearStudentsCount} étudiants</Badge>
                                </div>
                            </div>
                            <CollapsibleContent className="space-y-3">
                                {yearGroups.map((group) => {
                                    const groupKey = String(group.groupId);
                                    const groupStudents = groupedStudents.get(groupKey) ?? [];

                                    return (
                                        <Collapsible
                                            key={group.groupId}
                                            className="rounded-lg border bg-white/70 p-4 space-y-3"
                                            open={openGroupKeys[groupKey] ?? true}
                                            onOpenChange={(isOpen) => updateGroupOpenState(groupKey, isOpen)}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <h3>
                                                    <CollapsibleTrigger className="h2">
                                                        Classe {buildGroupLabel(group)}
                                                    </CollapsibleTrigger>
                                                </h3>
                                                <Badge variant="outline">{groupStudents.length}</Badge>
                                            </div>
                                            <CollapsibleContent className="space-y-3">
                                                <div className="space-y-2 min-h-14">
                                                    {groupStudents.map((student) => (
                                                        <article
                                                            key={student.userMail}
                                                            className="rounded-md border p-3 bg-white flex items-center justify-between gap-2"
                                                        >
                                                            <div>
                                                                <p className="font-medium">{student.firstName} {student.lastName}</p>
                                                                <p className="text-sm text-black/70">{student.userMail}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    size="icon-xs"
                                                                    variant="ghost"
                                                                    title="Modifier"
                                                                    onClick={openEditDialog.bind(null, student)}
                                                                >
                                                                    <EditIcon />
                                                                </Button>
                                                                <Button
                                                                    size="icon-xs"
                                                                    variant="ghost"
                                                                    title="Déplacer vers une autre classe de la même année"
                                                                    onClick={openMoveDialog.bind(null, student)}
                                                                >
                                                                    <SwapHorizIcon />
                                                                </Button>
                                                                <Button
                                                                    size="icon-xs"
                                                                    variant="ghost"
                                                                    title="Supprimer"
                                                                    onClick={openDeleteDialog.bind(null, student)}
                                                                >
                                                                    <DeleteIcon />
                                                                </Button>
                                                            </div>
                                                        </article>
                                                    ))}
                                                    {groupStudents.length === 0 && (
                                                        <p className="text-sm text-black/60">Aucun étudiant dans cette classe.</p>
                                                    )}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    );
                                })}
                            </CollapsibleContent>
                        </Collapsible>
                    );
                })}

                {shouldShowUnassignedGroup && (
                    <Collapsible
                        className="rounded-lg border border-dashed bg-white/50 p-4 space-y-3"
                        open={openGroupKeys[UNASSIGNED_GROUP_ID] ?? true}
                        onOpenChange={(isOpen) => updateGroupOpenState(UNASSIGNED_GROUP_ID, isOpen)}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <h2>
                                <CollapsibleTrigger className="h2">Non assigné</CollapsibleTrigger>
                            </h2>
                            <Badge variant="outline">{(groupedStudents.get(UNASSIGNED_GROUP_ID) ?? []).length}</Badge>
                        </div>
                        <CollapsibleContent className="space-y-3">
                            <div className="space-y-2 min-h-14">
                                {(groupedStudents.get(UNASSIGNED_GROUP_ID) ?? []).map((student) => (
                                    <article
                                        key={student.userMail}
                                        className="rounded-md border p-3 bg-white flex items-center justify-between gap-2"
                                    >
                                        <div>
                                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                                            <p className="text-sm text-black/70">{student.userMail}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon-xs"
                                                variant="ghost"
                                                title="Modifier"
                                                onClick={openEditDialog.bind(null, student)}
                                            >
                                                <EditIcon />
                                            </Button>
                                            <Button
                                                size="icon-xs"
                                                variant="ghost"
                                                title="Déplacer vers une autre classe de la même année"
                                                onClick={openMoveDialog.bind(null, student)}
                                            >
                                                <SwapHorizIcon />
                                            </Button>
                                            <Button
                                                size="icon-xs"
                                                variant="ghost"
                                                title="Supprimer"
                                                onClick={openDeleteDialog.bind(null, student)}
                                            >
                                                <DeleteIcon />
                                            </Button>
                                        </div>
                                    </article>
                                ))}
                                {(groupedStudents.get(UNASSIGNED_GROUP_ID) ?? []).length === 0 && (
                                    <p className="text-sm text-black/60">Aucun étudiant non assigné.</p>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>

            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent className="min-w-[min(90vw,36rem)]">
                    <DialogHeader>
                        <DialogTitle>Déplacer un étudiant</DialogTitle>
                        <DialogDescription>
                            Déplacement limité aux classes de la même année.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <p className="text-sm text-black/70">
                            {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
                        </p>
                        <Label>Nouvelle classe</Label>
                        <Select value={moveTargetGroupId} onValueChange={setMoveTargetGroupId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionner une classe" />
                            </SelectTrigger>
                            <SelectContent>
                                {moveCandidateGroups.map((group) => (
                                    <SelectItem key={group.groupId} value={String(group.groupId)}>
                                        {buildGroupLabel(group)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Annuler</Button>
                        <Button disabled={isSubmitting || !moveTargetGroupId} onClick={() => void handleMoveStudentFromDialog()}>
                            Déplacer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => { void handleCreateDialogOpenChange(isOpen); }}>
                <DialogContent className="min-w-[min(90vw,36rem)]">
                    <DialogHeader>
                        <DialogTitle>Ajouter un étudiant</DialogTitle>
                        <DialogDescription>
                            Crée un compte étudiant. Le mot de passe sera initialisé lors de la première connexion.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="grid gap-1">
                            <Label htmlFor="create-first-name">Prénom</Label>
                            <Input
                                id="create-first-name"
                                value={createFormState.firstName}
                                onChange={(event) => setCreateFormState((previousFormState) => ({
                                    ...previousFormState,
                                    firstName: event.target.value,
                                }))}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="create-last-name">Nom</Label>
                            <Input
                                id="create-last-name"
                                value={createFormState.lastName}
                                onChange={(event) => setCreateFormState((previousFormState) => ({
                                    ...previousFormState,
                                    lastName: event.target.value,
                                }))}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="create-email">Email étudiant</Label>
                            <InputGroup>
                                <InputGroupInput
                                    id="create-email"
                                    placeholder="nom"
                                    value={createFormState.email}
                                    onChange={(event) => setCreateFormState((previousFormState) => ({
                                        ...previousFormState,
                                        email: event.target.value,
                                    }))}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText>@{STUDENT_EMAIL_DOMAIN}</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="create-picture">Photo (optionnel)</Label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <input
                                        id="create-picture"
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploadingImage && uploadingImageField === 'create'}
                                        onChange={(event) => {
                                            const file = event.currentTarget.files?.[0];
                                            if (file) {
                                                void handleImageUpload(file, 'create');
                                            }
                                        }}
                                        className="block w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                {createFormState.picture && (
                                    <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                                        <Image
                                            src={getStudentPictureSrc(createFormState.picture) ?? '/icons/silhouette.svg'}
                                            alt="Photo étudiant"
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <Label>Classe</Label>
                            <Select
                                value={createFormState.groupId}
                                onValueChange={(value) => setCreateFormState((previousFormState) => ({
                                    ...previousFormState,
                                    groupId: value,
                                }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une classe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UNASSIGNED_GROUP_ID}>Non assigné</SelectItem>
                                    {sortedGroups.map((group) => (
                                        <SelectItem key={group.groupId} value={String(group.groupId)}>
                                            {buildGroupLabel(group)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { void handleCreateDialogOpenChange(false); }}>Annuler</Button>
                        <Button disabled={isSubmitting} onClick={() => void handleCreateStudent()}>
                            Créer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { void handleEditDialogOpenChange(isOpen); }}>
                <DialogContent className="min-w-[min(90vw,36rem)]">
                    <DialogHeader>
                        <DialogTitle>Modifier un étudiant</DialogTitle>
                        <DialogDescription>
                            Modifie les informations et la classe de l&apos;étudiant.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="grid gap-1">
                            <Label htmlFor="edit-first-name">Prénom</Label>
                            <Input
                                id="edit-first-name"
                                value={editFormState.firstName}
                                onChange={(event) => setEditFormState((previousFormState) => ({
                                    ...previousFormState,
                                    firstName: event.target.value,
                                }))}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-last-name">Nom</Label>
                            <Input
                                id="edit-last-name"
                                value={editFormState.lastName}
                                onChange={(event) => setEditFormState((previousFormState) => ({
                                    ...previousFormState,
                                    lastName: event.target.value,
                                }))}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-email">Email étudiant</Label>
                            <InputGroup>
                                <InputGroupInput
                                    id="edit-email"
                                    placeholder="nom"
                                    value={editFormState.email}
                                    onChange={(event) => setEditFormState((previousFormState) => ({
                                        ...previousFormState,
                                        email: event.target.value,
                                    }))}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText>@{STUDENT_EMAIL_DOMAIN}</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="edit-picture">Photo (optionnel)</Label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <input
                                        id="edit-picture"
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploadingImage && uploadingImageField === 'edit'}
                                        onChange={(event) => {
                                            const file = event.currentTarget.files?.[0];
                                            if (file) {
                                                void handleImageUpload(file, 'edit');
                                            }
                                        }}
                                        className="block w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                {editFormState.picture && (
                                    <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                                        <Image
                                            src={getStudentPictureSrc(editFormState.picture) ?? '/icons/silhouette.svg'}
                                            alt="Photo étudiant"
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <Label>Classe</Label>
                            <Select
                                value={editFormState.groupId}
                                onValueChange={(value) => setEditFormState((previousFormState) => ({
                                    ...previousFormState,
                                    groupId: value,
                                }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une classe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={UNASSIGNED_GROUP_ID}>Non assigné</SelectItem>
                                    {sortedGroups.map((group) => (
                                        <SelectItem key={group.groupId} value={String(group.groupId)}>
                                            {buildGroupLabel(group)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { void handleEditDialogOpenChange(false); }}>Annuler</Button>
                        <Button disabled={isSubmitting} onClick={() => void handleUpdateStudent()}>
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet étudiant ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement le compte de {selectedStudent?.firstName} {selectedStudent?.lastName} ({selectedStudent?.userMail}).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void handleDeleteStudent()}>
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
