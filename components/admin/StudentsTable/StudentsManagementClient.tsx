'use client';

import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
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
import SelectGroup from '@/components/cours/creation/select-group';
import {
    createStudent,
    deleteStudentByEmail,
    deleteStudentsByGroup,
    deleteStudentsByPromo,
    deleteTemporaryUploadedPicture,
    importStudentsFromSpreadsheet,
    updateStudent,
    uploadStudentPicture,
} from '@/components/admin/StudentsTable/students-management-api-client';
import { getStudentPictureSrc } from '@/lib/utils/student-picture';
import { isStudentBlobPath } from '@/lib/utils/blob';
import { normalizeStudentEmail, stripStudentEmailDomain, STUDENT_EMAIL_DOMAIN } from '@/lib/utils/student-email';
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
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

export type StudentsManagementClientProps = {
    initialStudents: Student[];
    groups: Group[];
};

export type StudentFormState = {
    firstName: string;
    lastName: string;
    email: string;
    groupId: string;
    picture: string | null;
};

export type InitializationStudentDraft = Student & {
    groupCode?: string;
};

const UNASSIGNED_GROUP_ID = 'unassigned';
const ALL_FILTER_VALUE = 'all';

function buildGroupLabel(group: Group): string {
    return `${group.promo}${group.td}${group.tp}`;
}


function normalizeStudentEmailForRequest(inputEmail: string): string {
    const normalizedEmail = normalizeStudentEmail(inputEmail);

    if (normalizedEmail) {
        return normalizedEmail;
    }

    return inputEmail.trim().toLowerCase();
}

function toApiGroupId(rawGroupId: string): number | null {
    if (rawGroupId === UNASSIGNED_GROUP_ID) {
        return null;
    }

    return Number.parseInt(rawGroupId, 10);
}

function getImportLogEntryType(entry: string): 'success' | 'warning' | 'error' | 'info' {
    const lowerEntry = entry.toLowerCase();
    if (lowerEntry.includes('✓') || lowerEntry.includes('success') || lowerEntry.includes('matchée') || lowerEntry.includes('importée')) {
        return 'success';
    }
    if (lowerEntry.includes('erreur') || lowerEntry.includes('error') || lowerEntry.includes('impossible') || lowerEntry.includes('invalide')) {
        return 'error';
    }
    if (lowerEntry.includes('attention') || lowerEntry.includes('warning') || lowerEntry.includes('aucune correspondance') || lowerEntry.includes('non trouvée')) {
        return 'warning';
    }
    return 'info';
}

function getImportLogEntryColors(entryType: 'success' | 'warning' | 'error' | 'info'): { iconColor: string; bgColor: string } {
    switch (entryType) {
        case 'success':
            return { iconColor: 'text-green-600', bgColor: 'bg-green-50' };
        case 'error':
            return { iconColor: 'text-red-600', bgColor: 'bg-red-50' };
        case 'warning':
            return { iconColor: 'text-yellow-600', bgColor: 'bg-yellow-50' };
        case 'info':
        default:
            return { iconColor: 'text-blue-600', bgColor: 'bg-blue-50' };
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

function isSpreadsheetFile(file: File): boolean {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
}

function isImageFile(file: File): boolean {
    if (file.type.startsWith('image/')) {
        return true;
    }

    const fileName = file.name.toLowerCase();
    return fileName.endsWith('.jpg')
        || fileName.endsWith('.jpeg')
        || fileName.endsWith('.png')
        || fileName.endsWith('.webp')
        || fileName.endsWith('.gif');
}

function normalizeImportToken(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .replaceAll(/[^a-z0-9]+/g, '.')
        .replaceAll(/^\.+|\.+$/g, '')
        .replaceAll(/\.{2,}/g, '.');
}

function removeFileExtension(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, '');
}

function buildStudentNameKeys(firstName: string, lastName: string): string[] {
    const firstNameToken = normalizeImportToken(firstName);
    const lastNameToken = normalizeImportToken(lastName);

    if (!firstNameToken || !lastNameToken) {
        return [];
    }

    return [`${firstNameToken}.${lastNameToken}`, `${lastNameToken}.${firstNameToken}`];
}

function parseCandidateKeysFromFileName(fileName: string): string[] {
    const baseName = removeFileExtension(fileName);
    const normalizedBaseName = normalizeImportToken(baseName);

    if (!normalizedBaseName) {
        return [];
    }

    const candidateKeys = new Set<string>();
    candidateKeys.add(normalizedBaseName);

    const splitTokens = normalizedBaseName.split('.').filter(Boolean);

    if (splitTokens.length >= 2) {
        candidateKeys.add(`${splitTokens[0]}.${splitTokens[1]}`);
        candidateKeys.add(`${splitTokens[1]}.${splitTokens[0]}`);
    }

    return Array.from(candidateKeys);
}

function parseCandidateEmailFromFileName(fileName: string): string | null {
    const baseName = removeFileExtension(fileName).trim();

    if (!baseName) {
        return null;
    }

    const directEmail = normalizeStudentEmail(baseName);

    if (directEmail) {
        return directEmail;
    }

    const normalizedToken = normalizeImportToken(baseName);

    if (!normalizedToken) {
        return null;
    }

    return normalizeStudentEmail(normalizedToken);
}

function getCandidateLocalPartsFromFileName(fileName: string): string[] {
    const baseName = removeFileExtension(fileName);
    const normalizedBaseName = normalizeImportToken(baseName);

    if (!normalizedBaseName) {
        return [];
    }

    const tokens = normalizedBaseName.split('.').filter(Boolean);
    const candidateLocalParts = new Set<string>();

    candidateLocalParts.add(normalizedBaseName);

    if (tokens.length >= 2) {
        candidateLocalParts.add(`${tokens[0]}.${tokens[1]}`);
    }

    if (tokens.length >= 3) {
        candidateLocalParts.add(`${tokens[0]}.${tokens[1]}.${tokens[2]}`);
    }

    const tokensWithoutNumericSuffix = tokens.filter((token) => !/\d/.test(token));

    if (tokensWithoutNumericSuffix.length >= 2) {
        candidateLocalParts.add(`${tokensWithoutNumericSuffix[0]}.${tokensWithoutNumericSuffix[1]}`);
    }

    if (tokensWithoutNumericSuffix.length >= 3) {
        candidateLocalParts.add(`${tokensWithoutNumericSuffix[0]}.${tokensWithoutNumericSuffix[1]}.${tokensWithoutNumericSuffix[2]}`);
    }

    return Array.from(candidateLocalParts);
}

function normalizeNameForGeneratedFile(value: string): string {
    return String(value ?? '')
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/^-+|-+$/g, '');
}

function buildGeneratedBaseFileName(student: Student): string {
    const normalizedLastName = normalizeNameForGeneratedFile(student.lastName);
    const normalizedFirstName = normalizeNameForGeneratedFile(student.firstName);
    return `${normalizedLastName}-${normalizedFirstName}`;
}

function getGeneratedBaseNameFromFileName(fileName: string): string {
    const baseName = removeFileExtension(fileName)
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replaceAll(/[^a-z0-9-]+/g, '-')
        .replaceAll(/-+/g, '-')
        .replaceAll(/^-+|-+$/g, '')
        .replace(/-\d+$/, '');

    return baseName;
}

function buildLocalPartVariants(localPart: string): string[] {
    const normalizedLocalPart = normalizeImportToken(localPart);

    if (!normalizedLocalPart) {
        return [];
    }

    const variants = new Set<string>([normalizedLocalPart]);
    const splitTokens = normalizedLocalPart.split('.').filter(Boolean);

    if (splitTokens.length >= 2) {
        variants.add(`${splitTokens[1]}.${splitTokens[0]}`);
    }

    return Array.from(variants);
}

function getNormalizedWordTokensFromFileName(fileName: string): string[] {
    return removeFileExtension(fileName)
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length > 0 && !/^\d+$/.test(token));
}

function getNormalizedStudentWordTokens(student: Student): string[] {
    const firstNameTokens = String(student.firstName)
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length > 0);

    const lastNameTokens = String(student.lastName)
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter((token) => token.length > 0);

    return [
        ...(firstNameTokens.length > 0 ? [firstNameTokens[0]] : []),
        ...(lastNameTokens.length > 0 ? [lastNameTokens[0]] : []),
    ];
}

type ImageImportLookups = {
    initializationStudentsByEmail: Map<string, Student>;
    initializationStudentsByLocalPart: Map<string, Student>;
    initializationStudentsByGeneratedBaseName: Map<string, Student[]>;
    initializationStudentsByNameKey: Map<string, Student[]>;
    initializationStudentsByFullName: Map<string, Student[]>;
    allStudentsByEmail: Map<string, Student>;
    allStudentsByLocalPart: Map<string, Student>;
    allStudentsByNameKey: Map<string, Student[]>;
    allStudentsByFullName: Map<string, Student[]>;
};

type ImageImportDraftResult = {
    pendingImageFileByEmail: Record<string, File>;
    pendingImagePreviewUrlByEmail: Record<string, string>;
    draftedCount: number;
    matchedByGeneratedNameCount: number;
    matchedByEmailCount: number;
    matchedByLocalPartCount: number;
    matchedByNameKeyCount: number;
    matchedByTokenFallbackCount: number;
    skippedMessages: string[];
    outsidePreviewMessages: string[];
    unmatchedMessages: string[];
};

type ImageImportMatchResult =
    | { status: 'drafted'; matchedStudent: Student; matchSource: 'generated' | 'email' | 'local-part' | 'name-key' | 'tokens' }
    | { status: 'ambiguous'; reason: string }
    | { status: 'outside-preview'; reason: string }
    | { status: 'unmatched'; reason: string };

function createImageImportLookups(initializationStudents: Student[], students: Student[]): ImageImportLookups {
    const initializationStudentsByEmail = new Map(initializationStudents.map((student) => [student.userMail, student]));
    const initializationStudentsByLocalPart = new Map(
        initializationStudents.map((student) => [normalizeImportToken(stripStudentEmailDomain(student.userMail)), student])
    );
    const initializationStudentsByGeneratedBaseName = new Map<string, Student[]>();
    const initializationStudentsByNameKey = new Map<string, Student[]>();
    const allStudentsByEmail = new Map(students.map((student) => [student.userMail, student]));
    const allStudentsByLocalPart = new Map(students.map((student) => [normalizeImportToken(stripStudentEmailDomain(student.userMail)), student]));
    const allStudentsByNameKey = new Map<string, Student[]>();

    for (const student of initializationStudents) {
        const generatedBaseName = buildGeneratedBaseFileName(student);
        const existingGeneratedStudents = initializationStudentsByGeneratedBaseName.get(generatedBaseName) ?? [];
        existingGeneratedStudents.push(student);
        initializationStudentsByGeneratedBaseName.set(generatedBaseName, existingGeneratedStudents);

        const nameKeys = buildStudentNameKeys(student.firstName, student.lastName);
        for (const nameKey of nameKeys) {
            const existingStudents = initializationStudentsByNameKey.get(nameKey) ?? [];
            existingStudents.push(student);
            initializationStudentsByNameKey.set(nameKey, existingStudents);
        }
    }

    const initializationStudentsByFullName = new Map<string, Student[]>();
    for (const student of initializationStudents) {
        const normalizedFirstName = String(student.firstName)
            .toLowerCase()
            .normalize('NFD')
            .replaceAll(/[\u0300-\u036f]/g, '');
        const normalizedLastName = String(student.lastName)
            .toLowerCase()
            .normalize('NFD')
            .replaceAll(/[\u0300-\u036f]/g, '');
        
        const fullNameKey = `${normalizedFirstName}.${normalizedLastName}`;
        const existingStudents = initializationStudentsByFullName.get(fullNameKey) ?? [];
        existingStudents.push(student);
        initializationStudentsByFullName.set(fullNameKey, existingStudents);
    }

    for (const student of students) {
        const nameKeys = buildStudentNameKeys(student.firstName, student.lastName);
        for (const nameKey of nameKeys) {
            const existingStudents = allStudentsByNameKey.get(nameKey) ?? [];
            existingStudents.push(student);
            allStudentsByNameKey.set(nameKey, existingStudents);
        }
    }

    const allStudentsByFullName = new Map<string, Student[]>();
    for (const student of students) {
        const normalizedFirstName = String(student.firstName)
            .toLowerCase()
            .normalize('NFD')
            .replaceAll(/[\u0300-\u036f]/g, '');
        const normalizedLastName = String(student.lastName)
            .toLowerCase()
            .normalize('NFD')
            .replaceAll(/[\u0300-\u036f]/g, '');
        
        const fullNameKey = `${normalizedFirstName}.${normalizedLastName}`;
        const existingStudents = allStudentsByFullName.get(fullNameKey) ?? [];
        existingStudents.push(student);
        allStudentsByFullName.set(fullNameKey, existingStudents);
    }

    return {
        initializationStudentsByEmail,
        initializationStudentsByLocalPart,
        initializationStudentsByGeneratedBaseName,
        initializationStudentsByNameKey,
        initializationStudentsByFullName,
        allStudentsByEmail,
        allStudentsByLocalPart,
        allStudentsByNameKey,
        allStudentsByFullName,
    };
}

function getStudentPhotoStatusLabel(hasPendingPicture: boolean, hasStudentPicture: boolean): string {
    if (hasPendingPicture) {
        return 'Photo prête à valider';
    }

    if (hasStudentPicture) {
        return 'Photo enregistrée';
    }

    return 'Photo manquante';
}

function buildPreviewStudentExamples(initializationStudents: Student[]): string {
    return initializationStudents
        .slice(0, 3)
        .map((student) => [student.lastName, student.firstName].join('-'))
        .join(' | ');
}

function extractCandidateNamesFromFileName(fileName: string): Array<{ firstName: string; lastName: string }> {
    const baseName = removeFileExtension(fileName);
    const tokens = baseName
        .split(/[_\-\s.]+/)
        .map((token) => token.trim().toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, ''))
        .filter((token) => token.length > 1 && !/^\d+$/.test(token));

    if (tokens.length < 2) {
        return [];
    }

    const candidates: Array<{ firstName: string; lastName: string }> = [];

    for (let i = 0; i < tokens.length - 1; i++) {
        for (let j = i + 1; j < tokens.length; j++) {
            candidates.push(
                { firstName: tokens[i], lastName: tokens[j] },
                { firstName: tokens[j], lastName: tokens[i] }
            );
        }
    }

    return candidates;
}

function resolveImageImportMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult {
    return resolveGeneratedImageMatch(file, lookups)
        ?? resolveEmailImageMatch(file, lookups)
        ?? resolveLocalPartImageMatch(file, lookups)
        ?? resolveNameKeyImageMatch(file, lookups)
        ?? resolveFullNameImageMatch(file, lookups)
        ?? resolveTokenImageMatch(file, lookups)
        ?? resolveContainsLocalPartImageMatch(file, lookups)
        ?? resolveOutsidePreviewImageMatch(file, lookups)
        ?? { status: 'unmatched', reason: `${file.name}: aucun étudiant correspondant.` };
}

function draftImageForStudent(
    student: Student,
    file: File,
    nextPendingImageFileByEmail: Record<string, File>,
    nextPendingPreviewUrlByEmail: Record<string, string>
): void {
    nextPendingImageFileByEmail[student.userMail] = file;

    const previousPreviewUrl = nextPendingPreviewUrlByEmail[student.userMail];
    if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl);
    }

    nextPendingPreviewUrlByEmail[student.userMail] = URL.createObjectURL(file);
}

function createInitialImageImportDraftResult(): ImageImportDraftResult {
    return {
        pendingImageFileByEmail: {},
        pendingImagePreviewUrlByEmail: {},
        draftedCount: 0,
        matchedByGeneratedNameCount: 0,
        matchedByEmailCount: 0,
        matchedByLocalPartCount: 0,
        matchedByNameKeyCount: 0,
        matchedByTokenFallbackCount: 0,
        skippedMessages: [],
        outsidePreviewMessages: [],
        unmatchedMessages: [],
    };
}

function resolveGeneratedImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const generatedBaseName = getGeneratedBaseNameFromFileName(file.name);

    if (!generatedBaseName) {
        return null;
    }

    const generatedMatches = lookups.initializationStudentsByGeneratedBaseName.get(generatedBaseName) ?? [];

    if (generatedMatches.length > 1) {
        return { status: 'ambiguous', reason: `${file.name}: correspondance ambiguë (nom généré).` };
    }

    if (generatedMatches.length === 1) {
        return { status: 'drafted', matchedStudent: generatedMatches[0], matchSource: 'generated' };
    }

    return null;
}

function resolveEmailImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const candidateEmail = parseCandidateEmailFromFileName(file.name);

    if (!candidateEmail) {
        return null;
    }

    const matchedStudent = lookups.initializationStudentsByEmail.get(candidateEmail) ?? null;

    if (!matchedStudent) {
        return null;
    }

    return { status: 'drafted', matchedStudent, matchSource: 'email' };
}

function resolveLocalPartImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const candidateLocalParts = getCandidateLocalPartsFromFileName(file.name);

    for (const candidateLocalPart of candidateLocalParts) {
        const matchedStudent = lookups.initializationStudentsByLocalPart.get(candidateLocalPart) ?? null;

        if (matchedStudent) {
            return { status: 'drafted', matchedStudent, matchSource: 'local-part' };
        }
    }

    return null;
}

function resolveNameKeyImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const candidateNameKeys = parseCandidateKeysFromFileName(file.name);

    for (const candidateNameKey of candidateNameKeys) {
        const matches = lookups.initializationStudentsByNameKey.get(candidateNameKey) ?? [];

        if (matches.length > 1) {
            return { status: 'ambiguous', reason: `${file.name}: correspondance ambiguë.` };
        }

        if (matches.length === 1) {
            return { status: 'drafted', matchedStudent: matches[0], matchSource: 'name-key' };
        }
    }

    return null;
}

function resolveTokenImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const fileWordTokens = getNormalizedWordTokensFromFileName(file.name);
    const tokenMatches = [...lookups.initializationStudentsByEmail.values()].filter((student) => {
        const studentWordTokens = getNormalizedStudentWordTokens(student);

        if (studentWordTokens.length < 2 || fileWordTokens.length < 2) {
            return false;
        }

        return studentWordTokens.every((studentToken) => fileWordTokens.includes(studentToken));
    });

    if (tokenMatches.length > 1) {
        return { status: 'ambiguous', reason: `${file.name}: correspondance ambiguë (tokens nom/prénom).` };
    }

    if (tokenMatches.length === 1) {
        return { status: 'drafted', matchedStudent: tokenMatches[0], matchSource: 'tokens' };
    }

    return null;
}

function resolveContainsLocalPartImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const normalizedFileToken = normalizeImportToken(removeFileExtension(file.name));
    const containsMatches = [...lookups.initializationStudentsByEmail.values()].filter((student) => {
        const localPart = stripStudentEmailDomain(student.userMail);
        const localPartVariants = buildLocalPartVariants(localPart);

        return localPartVariants.some((variant) => normalizedFileToken.includes(variant));
    });

    if (containsMatches.length > 1) {
        return { status: 'ambiguous', reason: `${file.name}: correspondance ambiguë (local-part).` };
    }

    if (containsMatches.length === 1) {
        return { status: 'drafted', matchedStudent: containsMatches[0], matchSource: 'local-part' };
    }

    return null;
}

function resolveFullNameImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const candidateNames = extractCandidateNamesFromFileName(file.name);

    for (const candidate of candidateNames) {
        const normalizedFirstName = candidate.firstName
            .toLowerCase()
            .normalize('NFD')
            .replaceAll(/[\u0300-\u036f]/g, '');
        const normalizedLastName = candidate.lastName
            .toLowerCase()
            .normalize('NFD')
            .replaceAll(/[\u0300-\u036f]/g, '');
        
        const fullNameKey = `${normalizedFirstName}.${normalizedLastName}`;
        
        // Chercher d'abord dans la liste à valider
        const initMatches = lookups.initializationStudentsByFullName.get(fullNameKey) ?? [];
        if (initMatches.length > 1) {
            return { status: 'ambiguous', reason: `${file.name}: correspondance ambiguë (nom ${normalizedFirstName} ${normalizedLastName}).` };
        }
        if (initMatches.length === 1) {
            return { status: 'drafted', matchedStudent: initMatches[0], matchSource: 'name-key' };
        }

        // Chercher ensuite dans la base complète
        const allMatches = lookups.allStudentsByFullName.get(fullNameKey) ?? [];
        if (allMatches.length > 1) {
            return { status: 'ambiguous', reason: `${file.name}: correspondance ambiguë (nom ${normalizedFirstName} ${normalizedLastName}).` };
        }
        if (allMatches.length === 1) {
            return { status: 'outside-preview', reason: `${file.name}: étudiant trouvé mais hors liste à valider.` };
        }
    }

    return null;
}

function resolveOutsidePreviewImageMatch(file: File, lookups: ImageImportLookups): ImageImportMatchResult | null {
    const candidateEmail = parseCandidateEmailFromFileName(file.name);
    const candidateLocalParts = getCandidateLocalPartsFromFileName(file.name);
    const candidateNameKeys = parseCandidateKeysFromFileName(file.name);

    if (candidateEmail && lookups.allStudentsByEmail.has(candidateEmail)) {
        return { status: 'outside-preview', reason: `${file.name}: étudiant trouvé mais hors liste à valider.` };
    }

    for (const candidateLocalPart of candidateLocalParts) {
        if (lookups.allStudentsByLocalPart.has(candidateLocalPart)) {
            return { status: 'outside-preview', reason: `${file.name}: étudiant trouvé mais hors liste à valider.` };
        }
    }

    for (const candidateNameKey of candidateNameKeys) {
        if ((lookups.allStudentsByNameKey.get(candidateNameKey) ?? []).length > 0) {
            return { status: 'outside-preview', reason: `${file.name}: étudiant trouvé mais hors liste à valider.` };
        }
    }

    return null;
}

function applyImageImportMatch(
    draftResult: ImageImportDraftResult,
    file: File,
    matchResult: ImageImportMatchResult
): void {
    if (matchResult.status === 'drafted') {
        draftImageForStudent(matchResult.matchedStudent, file, draftResult.pendingImageFileByEmail, draftResult.pendingImagePreviewUrlByEmail);
        draftResult.draftedCount += 1;

        if (matchResult.matchSource === 'generated') {
            draftResult.matchedByGeneratedNameCount += 1;
        } else if (matchResult.matchSource === 'email') {
            draftResult.matchedByEmailCount += 1;
        } else if (matchResult.matchSource === 'local-part') {
            draftResult.matchedByLocalPartCount += 1;
        } else if (matchResult.matchSource === 'name-key') {
            draftResult.matchedByNameKeyCount += 1;
        } else {
            draftResult.matchedByTokenFallbackCount += 1;
        }

        return;
    }

    if (matchResult.status === 'ambiguous') {
        draftResult.skippedMessages.push(matchResult.reason);
        return;
    }

    if (matchResult.status === 'outside-preview') {
        draftResult.outsidePreviewMessages.push(matchResult.reason);
        return;
    }

    draftResult.unmatchedMessages.push(matchResult.reason);
}

export default function StudentsManagementClient({ initialStudents, groups: initialGroups }: Readonly<StudentsManagementClientProps>) {
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [createFormState, setCreateFormState] = useState<StudentFormState>(createDefaultFormState());
    const [editFormState, setEditFormState] = useState<StudentFormState>(createDefaultFormState());
    const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilters, setGroupFilters] = useState<string[]>([]);
    const [yearFilter, setYearFilter] = useState<string>(ALL_FILTER_VALUE);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [moveTargetGroupId, setMoveTargetGroupId] = useState<string>('');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImportingStudents, setIsImportingStudents] = useState(false);
    const [isImportDropZoneActive, setIsImportDropZoneActive] = useState(false);
    const [isImportImagesDropZoneActive, setIsImportImagesDropZoneActive] = useState(false);
    const [isImportPanelOpen, setIsImportPanelOpen] = useState(false);
    const [pendingStudentImportFile, setPendingStudentImportFile] = useState<File | null>(null);
    const [initializationStudents, setInitializationStudents] = useState<InitializationStudentDraft[]>([]);
    const [previewGroupCodeByEmail, setPreviewGroupCodeByEmail] = useState<Record<string, string>>({});
    const [pendingImageFileByEmail, setPendingImageFileByEmail] = useState<Record<string, File>>({});
    const [pendingImagePreviewUrlByEmail, setPendingImagePreviewUrlByEmail] = useState<Record<string, string>>({});
    const [importLogEntries, setImportLogEntries] = useState<string[]>([]);
    const [isImportLogOpen, setIsImportLogOpen] = useState(true);
    const [isImportingImagesByFileName, setIsImportingImagesByFileName] = useState(false);
    const [isFinalizingImageImportValidation, setIsFinalizingImageImportValidation] = useState(false);
    const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
    const [selectedDeleteGroupId, setSelectedDeleteGroupId] = useState<number | null>(null);
    const [isDeletePromoDialogOpen, setIsDeletePromoDialogOpen] = useState(false);
    const [selectedDeletePromo, setSelectedDeletePromo] = useState<string | null>(null);
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
    const importFileInputRef = useRef<HTMLInputElement | null>(null);
    const importImagesInputRef = useRef<HTMLInputElement | null>(null);
    const pendingImagePreviewUrlByEmailRef = useRef<Record<string, string>>({});

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
            const matchesGroup = groupFilters.length === 0 || groupFilters.includes(groupKey);
            const matchesYear = yearFilter === ALL_FILTER_VALUE || group.promo === yearFilter;
            const hasStudents = (groupedStudents.get(groupKey) ?? []).length > 0;

            return matchesGroup && matchesYear && hasStudents;
        });
    }, [groupFilters, sortedGroups, yearFilter, groupedStudents]);

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
        const hasFilters = groupFilters.length > 0;
        if (hasFilters) {
            return false;
        }

        const unassignedStudents = groupedStudents.get(UNASSIGNED_GROUP_ID) ?? [];
        return unassignedStudents.length > 0;
    }, [groupFilters, groupedStudents]);

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

    function appendImportLogEntry(message: string): void {
        const timestampLabel = new Date().toLocaleTimeString('fr-FR');
        setImportLogEntries((previousEntries) => {
            const nextEntries = [...previousEntries, `[${timestampLabel}] ${message}`];
            return nextEntries.slice(-12);
        });
    }

    function clearPendingImageDrafts(): void {
        setPendingImageFileByEmail({});
        setPendingImagePreviewUrlByEmail((previousPreviewsByEmail) => {
            for (const previewUrl of Object.values(previousPreviewsByEmail)) {
                URL.revokeObjectURL(previewUrl);
            }

            return {};
        });
    }

    async function copyImportLogToClipboard(): Promise<void> {
        const logText = importLogEntries.join('\n');
        try {
            await navigator.clipboard.writeText(logText);
            setFeedbackMessage('Journal copié dans le presse-papiers');
            setTimeout(() => setFeedbackMessage(null), 2000);
        } catch {
            setErrorMessage('Impossible de copier le journal');
            setTimeout(() => setErrorMessage(null), 2000);
        }
    }

    function clearImportLog(): void {
        setImportLogEntries([]);
    }

    function setPendingImageDraft(studentEmail: string, file: File): void {
        setPendingImageFileByEmail((previousFilesByEmail) => ({
            ...previousFilesByEmail,
            [studentEmail]: file,
        }));

        setPendingImagePreviewUrlByEmail((previousPreviewsByEmail) => {
            const nextPreviewsByEmail = { ...previousPreviewsByEmail };
            const previousPreviewUrl = nextPreviewsByEmail[studentEmail];

            if (previousPreviewUrl) {
                URL.revokeObjectURL(previousPreviewUrl);
            }

            nextPreviewsByEmail[studentEmail] = URL.createObjectURL(file);
            return nextPreviewsByEmail;
        });
    }

    function handleRemoveInitializationStudent(studentEmail: string): void {
        setInitializationStudents((previousStudents) => (
            previousStudents.filter((student) => student.userMail !== studentEmail)
        ));

        setPendingImageFileByEmail((previousFilesByEmail) => {
            const nextFilesByEmail = { ...previousFilesByEmail };
            delete nextFilesByEmail[studentEmail];
            return nextFilesByEmail;
        });

        setPendingImagePreviewUrlByEmail((previousPreviewsByEmail) => {
            const nextPreviewsByEmail = { ...previousPreviewsByEmail };
            const previewUrl = nextPreviewsByEmail[studentEmail];

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            delete nextPreviewsByEmail[studentEmail];
            return nextPreviewsByEmail;
        });

        appendImportLogEntry(`Ligne retirée de la validation: ${studentEmail}`);
    }

    useEffect(() => {
        pendingImagePreviewUrlByEmailRef.current = pendingImagePreviewUrlByEmail;
    }, [pendingImagePreviewUrlByEmail]);

    useEffect(() => {
        return () => {
            for (const previewUrl of Object.values(pendingImagePreviewUrlByEmailRef.current)) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, []);

    async function handleImportStudentsFile(fileToImport: File): Promise<void> {
        setIsImportingStudents(true);
        resetStatusMessages();
        appendImportLogEntry(`📁 Début de l'import du fichier étudiants: ${fileToImport.name}`);

        try {
            const previewResult = await importStudentsFromSpreadsheet(fileToImport, true);
            const initializationStudentsDraft = previewResult.initializationStudents as InitializationStudentDraft[];
            setPendingStudentImportFile(fileToImport);
            setGroups(previewResult.groups);
            setInitializationStudents(initializationStudentsDraft);
            clearPendingImageDrafts();
            setPreviewGroupCodeByEmail(() => {
                const nextPreviewGroupCodeByEmail: Record<string, string> = {};

                for (const student of initializationStudentsDraft) {
                    if (typeof student.groupCode === 'string' && student.groupCode.length > 0) {
                        nextPreviewGroupCodeByEmail[student.userMail] = student.groupCode;
                    }
                }

                return nextPreviewGroupCodeByEmail;
            });

            setOpenYearKeys((previousOpenYearKeys) => {
                const nextOpenYearKeys = { ...previousOpenYearKeys };

                for (const group of previewResult.groups) {
                    if (!(group.promo in nextOpenYearKeys)) {
                        nextOpenYearKeys[group.promo] = true;
                    }
                }

                return nextOpenYearKeys;
            });

            setOpenGroupKeys((previousOpenGroupKeys) => {
                const nextOpenGroupKeys = { ...previousOpenGroupKeys };

                for (const group of previewResult.groups) {
                    const groupKey = String(group.groupId);
                    if (!(groupKey in nextOpenGroupKeys)) {
                        nextOpenGroupKeys[groupKey] = true;
                    }
                }

                if (!(UNASSIGNED_GROUP_ID in nextOpenGroupKeys)) {
                    nextOpenGroupKeys[UNASSIGNED_GROUP_ID] = true;
                }

                return nextOpenGroupKeys;
            });

            appendImportLogEntry(`✓ ${initializationStudentsDraft.length} étudiant(s) prêt(s) à valider`);
            
            let summaryMessage = `Prévisualisation prête: ${initializationStudentsDraft.length} étudiant(s) à valider.`;

            if (previewResult.summary.errors.length > 0) {
                const firstError = previewResult.summary.errors[0];
                summaryMessage += ` ${previewResult.summary.errors.length} erreur(s). Première erreur ligne ${firstError.line}: ${firstError.reason}`;
                appendImportLogEntry(`⚠ ${previewResult.summary.errors.length} erreur(s) importation détectée(s)`);
            }

            summaryMessage += ' Aucune écriture en base tant que vous ne cliquez pas sur "Valider l\'import".';
            setFeedbackMessage(summaryMessage);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Import impossible.';
            appendImportLogEntry(`✗ Erreur import: ${errorMsg}`);
            setErrorMessage(errorMsg);
        } finally {
            setIsImportingStudents(false);
        }
    }

    async function handleImageUpload(file: File, field: 'create' | 'edit'): Promise<void> {
        setIsUploadingImage(true);
        setUploadingImageField(field);
        resetStatusMessages();

        try {
            const responseData = await uploadStudentPicture(file);

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

        if (isStudentBlobPath(temporaryCreatePicturePath)) {
            try {
                await deleteTemporaryUploadedPicture(temporaryCreatePicturePath);
            } catch {
                // Suppression d'image temporaire non critique
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

        if (isStudentBlobPath(temporaryEditPicturePath)) {
            try {
                await deleteTemporaryUploadedPicture(temporaryEditPicturePath);
            } catch {
                // Suppression d'image temporaire non critique
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
            const createdStudent = await createStudent({
                firstName: createFormState.firstName,
                lastName: createFormState.lastName,
                email: normalizeStudentEmailForRequest(createFormState.email),
                groupId: toApiGroupId(createFormState.groupId),
                picture: createFormState.picture,
            });

            setStudents((previousStudents) => [createdStudent, ...previousStudents]);
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
            const updatedStudent = await updateStudent({
                currentEmail: selectedStudent.userMail,
                firstName: editFormState.firstName,
                lastName: editFormState.lastName,
                email: normalizeStudentEmailForRequest(editFormState.email),
                groupId: toApiGroupId(editFormState.groupId),
                picture: editFormState.picture,
            });

            setStudents((previousStudents) => previousStudents.map((student) => (
                student.userMail === selectedStudent.userMail ? updatedStudent : student
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
            await deleteStudentByEmail(selectedStudent.userMail);

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
            const updatedStudent = await updateStudent({
                currentEmail: movedStudent.userMail,
                firstName: movedStudent.firstName,
                lastName: movedStudent.lastName,
                email: movedStudent.userMail,
                groupId: parsedTargetGroupId,
            });

            setStudents((previousStudents) => previousStudents.map((student) => (
                student.userMail === movedStudent.userMail ? updatedStudent : student
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

    async function handleImportStudents(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        const fileToImport = event.currentTarget.files?.[0] ?? null;
        event.currentTarget.value = '';

        if (!fileToImport) {
            return;
        }

        if (!isSpreadsheetFile(fileToImport)) {
            setErrorMessage('Format de fichier non supporté. Utilise un fichier .xlsx, .xls ou .csv.');
            return;
        }

        await handleImportStudentsFile(fileToImport);
    }

    function handleImportDragOver(event: DragEvent<HTMLButtonElement>): void {
        event.preventDefault();
        if (!isImportingStudents) {
            setIsImportDropZoneActive(true);
        }
    }

    function handleImportDragLeave(event: DragEvent<HTMLButtonElement>): void {
        event.preventDefault();
        setIsImportDropZoneActive(false);
    }

    async function handleImportDrop(event: DragEvent<HTMLButtonElement>): Promise<void> {
        event.preventDefault();
        setIsImportDropZoneActive(false);

        if (isImportingStudents) {
            return;
        }

        const droppedFile = event.dataTransfer.files?.[0] ?? null;

        if (!droppedFile) {
            return;
        }

        if (!isSpreadsheetFile(droppedFile)) {
            setErrorMessage('Format de fichier non supporté. Utilise un fichier .xlsx, .xls ou .csv.');
            return;
        }

        await handleImportStudentsFile(droppedFile);
    }

    async function handleInitializationImageUpload(studentEmail: string, file: File): Promise<void> {
        resetStatusMessages();
        
        // Chercher dans les étudiants en attente de validation
        const existingStudent = initializationStudents.find(
            (student) => normalizeStudentEmail(student.userMail) === normalizeStudentEmail(studentEmail)
        );
        
        if (existingStudent) {
            setPendingImageDraft(studentEmail, file);
            appendImportLogEntry(`✓ Image sélectionnée pour ${studentEmail}: ${file.name}`);
            setFeedbackMessage('Photo ajoutée en brouillon. Clique sur "Valider l\'import" pour finaliser.');
            return;
        }
        
        // Chercher en base de données
        const databaseStudent = students.find(
            (student) => normalizeStudentEmail(student.userMail) === normalizeStudentEmail(studentEmail)
        );
        
        if (databaseStudent) {
            appendImportLogEntry(`✓ Étudiant trouvé en base de données pour ${studentEmail}`);
            // Créer un brouillon pour cet étudiant existant
            const draftStudent: InitializationStudentDraft = {
                ...databaseStudent,
                groupCode: typeof databaseStudent.groupId === 'number' 
                    ? groupsById.get(databaseStudent.groupId)?.promo ?? 'N/A'
                    : 'Non assigné'
            };
            setInitializationStudents((previousStudents) => [...previousStudents, draftStudent]);
            setPendingImageDraft(studentEmail, file);
            appendImportLogEntry(`✓ Image sélectionnée pour ${studentEmail}: ${file.name}`);
            appendImportLogEntry(`ℹ Étudiant existant ajouté à la liste de validation pour définir son image.`);
            setFeedbackMessage('Photo ajoutée pour étudiant existant. Clique sur "Valider l\'import" pour finaliser.');
            return;
        }
        
        // Pas trouvé
        appendImportLogEntry(`✗ Erreur : Étudiant ${studentEmail} introuvable`);
        setErrorMessage(`L'étudiant ${studentEmail} n'existe pas. Crée-le d'abord ou importe-le via le fichier étudiants.`);
    }

    async function handleBulkImageImport(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        const files = event.currentTarget.files ? Array.from(event.currentTarget.files) : [];
        event.currentTarget.value = '';

        appendImportLogEntry(`${files.length} fichier(s) reçu(s) depuis le sélecteur.`);

        await handleBulkImageImportFromFiles(files);
    }

    async function handleBulkImageImportFromFiles(files: File[]): Promise<void> {
        if (files.length === 0) {
            appendImportLogEntry('Aucun fichier transmis.');
            return;
        }

        const validImageFiles = files.filter(isImageFile);
        const invalidImageCount = files.length - validImageFiles.length;

        appendImportLogEntry(`${validImageFiles.length} image(s) valide(s) détectée(s), ${invalidImageCount} rejetée(s).`);

        if (validImageFiles.length === 0) {
            setErrorMessage('Aucune image valide détectée. Formats supportés: JPG, JPEG, PNG, WEBP, GIF.');
            return;
        }

        setIsImportingImagesByFileName(true);
        resetStatusMessages();

        try {
            const studentsForImageDraft = initializationStudents.length > 0
                ? [
                    ...initializationStudents,
                    ...students.filter((student) => !initializationStudents.some((initializationStudent) => initializationStudent.userMail === student.userMail)),
                ]
                : students;

            if (initializationStudents.length === 0) {
                appendImportLogEntry('Aucun étudiant en attente: matching des images sur toute la base étudiants.');
            } else {
                appendImportLogEntry(`${initializationStudents.length} étudiant(s) présent(s) dans la liste à valider.`);
                appendImportLogEntry('Les images non trouvées dans la liste sont aussi recherchées dans la base complète.');
            }

            const lookups = createImageImportLookups(studentsForImageDraft, students);
            const draftResult = createInitialImageImportDraftResult();

            for (const file of validImageFiles) {
                const matchResult = resolveImageImportMatch(file, lookups);
                applyImageImportMatch(draftResult, file, matchResult);
            }

            setPendingImageFileByEmail(draftResult.pendingImageFileByEmail);
            setPendingImagePreviewUrlByEmail(draftResult.pendingImagePreviewUrlByEmail);

            const draftedStudentEmails = Object.keys(draftResult.pendingImageFileByEmail);

            if (draftedStudentEmails.length > 0) {
                const draftedStudentsByEmail = new Map(studentsForImageDraft.map((student) => [student.userMail, student]));

                setInitializationStudents((previousStudents) => {
                    const existingEmails = new Set(previousStudents.map((student) => student.userMail));
                    const nextStudents = [...previousStudents];

                    for (const studentEmail of draftedStudentEmails) {
                        if (existingEmails.has(studentEmail)) {
                            continue;
                        }

                        const draftedStudent = draftedStudentsByEmail.get(studentEmail);

                        if (!draftedStudent) {
                            continue;
                        }

                        nextStudents.push(draftedStudent);
                        existingEmails.add(studentEmail);
                    }

                    return nextStudents;
                });
            }

            appendImportLogEntry(`${draftResult.draftedCount} image(s) liée(s) à des étudiants.`);
            appendImportLogEntry(
                `Sources de matching -> généré: ${draftResult.matchedByGeneratedNameCount}, email: ${draftResult.matchedByEmailCount}, local-part: ${draftResult.matchedByLocalPartCount}, nom: ${draftResult.matchedByNameKeyCount}, tokens: ${draftResult.matchedByTokenFallbackCount}.`
            );

            const ambiguousCount = draftResult.skippedMessages.length;
            const outsidePreviewCount = draftResult.outsidePreviewMessages.length;
            const unmatchedCount = draftResult.unmatchedMessages.length;
            const notPreparedCount = ambiguousCount + outsidePreviewCount + unmatchedCount;

            appendImportLogEntry(`${ambiguousCount} image(s) ambiguë(s) (plusieurs étudiants possibles).`);

            if (initializationStudents.length === 0) {
                appendImportLogEntry(`${outsidePreviewCount} image(s) trouvée(s) hors base active.`);
            } else {
                appendImportLogEntry(`${outsidePreviewCount} image(s) correspondent à un étudiant hors liste à valider.`);
            }

            appendImportLogEntry(`${unmatchedCount} image(s) sans correspondance.`);
            appendImportLogEntry(`Total non préparées: ${notPreparedCount} image(s).`);

            if (draftResult.draftedCount === 0) {
                appendImportLogEntry('Aucune image liée. Vérifie que les noms de fichiers contiennent bien nom/prénom des étudiants.');
                appendImportLogEntry(`Exemples fichiers: ${validImageFiles.slice(0, 3).map((file) => file.name).join(' | ')}`);

                const previewStudents = studentsForImageDraft.length > 0
                    ? studentsForImageDraft
                    : initializationStudents;
                appendImportLogEntry(`Exemples étudiants: ${buildPreviewStudentExamples(previewStudents)}`);
            }
        } finally {
            setIsImportingImagesByFileName(false);
        }
    }

    function handleImportImagesDragOver(event: DragEvent<HTMLButtonElement>): void {
        event.preventDefault();
        if (!isImportingImagesByFileName) {
            setIsImportImagesDropZoneActive(true);
        }
    }

    function handleImportImagesDragLeave(event: DragEvent<HTMLButtonElement>): void {
        event.preventDefault();
        setIsImportImagesDropZoneActive(false);
    }

    async function handleImportImagesDrop(event: DragEvent<HTMLButtonElement>): Promise<void> {
        event.preventDefault();
        setIsImportImagesDropZoneActive(false);

        if (isImportingImagesByFileName) {
            return;
        }

        const droppedFiles = event.dataTransfer.files ? Array.from(event.dataTransfer.files) : [];
        appendImportLogEntry(`${droppedFiles.length} fichier(s) déposé(s) via glisser-déposer.`);
        await handleBulkImageImportFromFiles(droppedFiles);
    }

    async function handleFinalizeStudentImportValidation(): Promise<void> {
        const pendingImageEntries = Object.entries(pendingImageFileByEmail);

        if (!pendingStudentImportFile && pendingImageEntries.length === 0) {
            setErrorMessage('Ajoute d\'abord un fichier étudiant ou des images avant de valider.');
            return;
        }

        setIsFinalizingImageImportValidation(true);
        resetStatusMessages();
        appendImportLogEntry('Début de la validation finale de l\'import.');

        try {
            let studentsAfterImport = students;
            let importSummaryMessage = 'Import images uniquement (sans fichier étudiant).';

            if (pendingStudentImportFile) {
                const importResult = await importStudentsFromSpreadsheet(pendingStudentImportFile);
                appendImportLogEntry(`✓ Étudiants importés en base: ${importResult.summary.createdCount} créés, ${importResult.summary.updatedCount} mis à jour`);
                setStudents(importResult.students);
                setGroups(importResult.groups);
                studentsAfterImport = importResult.students;
                importSummaryMessage = `Import validé: ${importResult.summary.createdCount} créés, ${importResult.summary.updatedCount} mis à jour, ${importResult.summary.restoredCount} restaurés, ${importResult.summary.skippedCount} ignorés.`;
            }

            const studentsByEmail = new Map(studentsAfterImport.map((student) => [student.userMail, student]));
            const updatedStudentsByEmail = new Map<string, Student>();
            let updatedCount = 0;
            let skippedImageCount = 0;

            for (const [studentEmail, pendingImageFile] of pendingImageEntries) {
                const student = studentsByEmail.get(studentEmail);

                if (!student) {
                    skippedImageCount += 1;
                    appendImportLogEntry(`Image ignorée pour ${studentEmail}: étudiant introuvable après import.`);
                    continue;
                }

                const uploadResult = await uploadStudentPicture(pendingImageFile);
                const updatedStudent = await updateStudent({
                    currentEmail: studentEmail,
                    email: studentEmail,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    groupId: student.groupId,
                    picture: uploadResult.pathname,
                });

                updatedStudentsByEmail.set(updatedStudent.userMail, updatedStudent);
                updatedCount += 1;
                appendImportLogEntry(`Image enregistrée pour ${studentEmail}.`);
            }

            if (updatedStudentsByEmail.size > 0) {
                setStudents((previousStudents) => previousStudents.map((student) => (
                    updatedStudentsByEmail.get(student.userMail) ?? student
                )));
            }

            clearPendingImageDrafts();
            setPendingStudentImportFile(null);
            setInitializationStudents([]);
            setPreviewGroupCodeByEmail({});

            let summaryMessage = importSummaryMessage;
            summaryMessage += ` ${updatedCount} photo(s) enregistrée(s).`;

            if (skippedImageCount > 0) {
                summaryMessage += ` ${skippedImageCount} image(s) ignorée(s) (étudiant non trouvé).`;
            }

            appendImportLogEntry(`Validation terminée: ${updatedCount} image(s) enregistrée(s), ${skippedImageCount} ignorée(s).`);

            if (pendingStudentImportFile) {
                appendImportLogEntry(`✓ Import complet: étudiants + images finalisé (${updatedCount} images liées).`);
            } else {
                appendImportLogEntry(`✓ Import complet: images mises à jour (${updatedCount} images liées).`);
            }

            setFeedbackMessage(summaryMessage);
        } catch (error) {
            appendImportLogEntry('Échec de la validation finale de l\'import.');
            setErrorMessage(error instanceof Error ? error.message : 'Validation de l\'import impossible.');
        } finally {
            setIsFinalizingImageImportValidation(false);
        }
    }

    async function handleDeleteGroup(): Promise<void> {
        if (selectedDeleteGroupId === null) {
            return;
        }

        setIsSubmitting(true);
        resetStatusMessages();

        try {
            const result = await deleteStudentsByGroup(selectedDeleteGroupId);
            setStudents((previousStudents) => previousStudents.filter((student) => student.groupId !== selectedDeleteGroupId));
            setGroups((previousGroups) => previousGroups.filter((group) => group.groupId !== selectedDeleteGroupId));
            setIsDeleteGroupDialogOpen(false);
            setSelectedDeleteGroupId(null);
            setFeedbackMessage(`${result.studentsDeleted} étudiant(s) et la classe supprimé(s) avec succès.`);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Suppression de classe impossible.');
        } finally {
            setIsSubmitting(false);
        }
    }

    function filterStudentsByPromo(promo: string | null, groupsList: Group[]): (student: Student) => boolean {
        return (student: Student) => {
            const studentGroup = groupsList.find((g) => g.groupId === student.groupId);
            return studentGroup?.promo !== promo;
        };
    }

    function filterGroupsByPromo(promo: string | null): (group: Group) => boolean {
        return (group: Group) => group.promo !== promo;
    }

    function countStudentsByPromo(promo: string | null, studentList: Student[], groupsList: Group[]): number {
        return studentList.filter((student) => {
            const studentGroup = groupsList.find((g) => g.groupId === student.groupId);
            return studentGroup?.promo === promo;
        }).length;
    }

    async function handleDeletePromo(): Promise<void> {
        if (selectedDeletePromo === null) {
            return;
        }

        setIsSubmitting(true);
        resetStatusMessages();

        try {
            const result = await deleteStudentsByPromo(selectedDeletePromo);
            const filterStudentsFn = filterStudentsByPromo(selectedDeletePromo, groups);
            const filterGroupsFn = filterGroupsByPromo(selectedDeletePromo);
            setStudents((previousStudents) => previousStudents.filter(filterStudentsFn));
            setGroups((previousGroups) => previousGroups.filter(filterGroupsFn));
            setIsDeletePromoDialogOpen(false);
            setSelectedDeletePromo(null);
            setFeedbackMessage(`${result.studentsDeleted} étudiant(s) et tous les groupes de l'année supprimé(s) avec succès.`);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Suppression d\'année impossible.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="space-y-4">
            <div className="rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    <Input
                        id="search-student"
                        placeholder="Recherche (nom ou email)"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="h-10 w-full text-sm"
                    />

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="h-10 w-full text-sm data-[size=default]:h-10 data-[placeholder]:text-black/70">
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

                    <SelectGroup
                        groups={sortedGroups}
                        groupsSelected={groupFilters}
                        setGroupsSelected={setGroupFilters}
                        hideLabel
                        displayMode="summary"
                        placeholder="Toutes les classes"
                        className="mb-0"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Button
                        className="h-10 whitespace-nowrap px-3 text-sm"
                        variant="outline"
                        disabled={isImportingStudents}
                        onClick={() => {
                            setIsImportPanelOpen((previousValue) => !previousValue);
                            setIsImportDropZoneActive(false);
                            setIsImportImagesDropZoneActive(false);
                        }}
                    >
                        <FileUploadIcon /> {isImportPanelOpen ? 'Fermer import' : 'Importer des étudiants'}
                    </Button>
                    <Button className="h-10 whitespace-nowrap px-3 text-sm" variant="outline" onClick={() => setVisibilityForAllSections(true)}>
                        Tout déplier
                    </Button>
                    <Button className="h-10 whitespace-nowrap px-3 text-sm" variant="outline" onClick={() => setVisibilityForAllSections(false)}>
                        Tout replier
                    </Button>
                    <Button className="h-10 whitespace-nowrap px-3 text-sm" onClick={openCreateDialog}>
                        <AddIcon /> Ajouter un étudiant
                    </Button>
                </div>

                {isImportPanelOpen && (
                    <div className="space-y-3 rounded-lg border border-faded/80 p-3">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">Import des étudiants</p>
                                {initializationStudents.length > 0 ? (
                                    <Badge variant="outline">{initializationStudents.length} étudiant(s) en attente</Badge>
                                ) : (
                                    <p className="text-xs text-black/60">Aucun étudiant en attente de validation.</p>
                                )}
                            </div>
                            <input
                                ref={importFileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={(event) => { void handleImportStudents(event); }}
                            />

                            <button
                                type="button"
                                className={`w-full rounded-lg border border-dashed p-3 text-left text-sm transition-colors ${
                                    isImportDropZoneActive
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-faded/80 bg-transparent text-black/70'
                                } ${isImportingStudents ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                onDragOver={handleImportDragOver}
                                onDragLeave={handleImportDragLeave}
                                onDrop={(event) => { void handleImportDrop(event); }}
                                onClick={() => {
                                    if (!isImportingStudents) {
                                        importFileInputRef.current?.click();
                                    }
                                }}
                                disabled={isImportingStudents}
                            >
                                <p className="font-medium">Glisse-dépose ton fichier d&apos;import ici</p>
                                <p className="text-xs text-black/60">Formats acceptés: .xlsx, .xls, .csv</p>
                            </button>
                        </div>

                        <div className="space-y-2 border-t border-faded/70 pt-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">Import des images</p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <input
                                    ref={importImagesInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => { void handleBulkImageImport(event); }}
                                />
                                <button
                                    type="button"
                                    className={`w-full rounded-lg border border-dashed p-3 text-left text-sm transition-colors ${
                                        isImportImagesDropZoneActive
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-faded/80 bg-transparent text-black/70'
                                    } ${isImportingImagesByFileName ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                    onDragOver={handleImportImagesDragOver}
                                    onDragLeave={handleImportImagesDragLeave}
                                    onDrop={(event) => { void handleImportImagesDrop(event); }}
                                    onClick={() => {
                                        if (!isImportingImagesByFileName) {
                                            importImagesInputRef.current?.click();
                                        }
                                    }}
                                    disabled={isImportingImagesByFileName || isFinalizingImageImportValidation}
                                >
                                    <p className="font-medium">Glisse-dépose tes images ici</p>
                                    <p className="text-xs text-black/60">Formats acceptés: .jpg, .jpeg, .png, .webp, .gif</p>
                                </button>
                            </div>
                            {importLogEntries.length > 0 && (
                                <div className="rounded-md border border-faded/70 bg-black/[0.02]">
                                    <div className="flex w-full items-center justify-between px-3 py-2 hover:bg-black/[0.05]">
                                        <Collapsible open={isImportLogOpen} onOpenChange={setIsImportLogOpen} className="flex-1">
                                            <CollapsibleTrigger className="flex items-center justify-start flex-1">
                                                <p className="text-xs font-medium text-black/80">Journal import ({importLogEntries.length})</p>
                                            </CollapsibleTrigger>
                                        </Collapsible>
                                        <div className="flex items-center gap-1 ml-2">
                                            <button
                                                type="button"
                                                title="Copier le journal"
                                                className="rounded p-1 text-black/60 hover:bg-white hover:text-black transition-colors"
                                                onClick={() => {
                                                    void copyImportLogToClipboard();
                                                }}
                                            >
                                                <ContentCopyIcon style={{ fontSize: '16px' }} />
                                            </button>
                                            <button
                                                type="button"
                                                title="Effacer le journal"
                                                className="rounded p-1 text-black/60 hover:bg-white hover:text-black transition-colors"
                                                onClick={() => {
                                                    clearImportLog();
                                                }}
                                            >
                                                <ClearAllIcon style={{ fontSize: '16px' }} />
                                            </button>
                                        </div>
                                    </div>
                                    {isImportLogOpen && (
                                        <div className="border-t border-faded/70 px-3 py-2">
                                            <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                                                {importLogEntries.map((entry, index) => {
                                                    const entryType = getImportLogEntryType(entry);
                                                    const { iconColor, bgColor } = getImportLogEntryColors(entryType);
                                                    
                                                    return (
                                                        <div key={`${entry}-${index}`} className={`flex items-start gap-2 rounded px-2 py-1 text-xs ${bgColor}`}>
                                                            <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                                                                {entryType === 'success' && <CheckCircleIcon style={{ fontSize: '14px' }} />}
                                                                {entryType === 'error' && <WarningIcon style={{ fontSize: '14px' }} />}
                                                                {entryType === 'warning' && <WarningIcon style={{ fontSize: '14px' }} />}
                                                            </div>
                                                            <p className="text-black/65 flex-1">{entry}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {initializationStudents.length > 0 && (
                                <div className="space-y-2">
                                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                    {initializationStudents.map((student) => {
                                        const studentGroup = typeof student.groupId === 'number' ? groupsById.get(student.groupId) : null;
                                        const groupLabel = studentGroup
                                            ? buildGroupLabel(studentGroup)
                                            : previewGroupCodeByEmail[student.userMail] ?? 'Non assigné';
                                        const hasPendingPicture = Boolean(pendingImageFileByEmail[student.userMail]);
                                        const pendingPreviewUrl = pendingImagePreviewUrlByEmail[student.userMail] ?? null;
                                        const hasStudentPicture = Boolean(student.picture);
                                        const photoStatusLabel = getStudentPhotoStatusLabel(hasPendingPicture, hasStudentPicture);
                                        const pendingImageName = pendingImageFileByEmail[student.userMail]?.name ?? null;
                                        const photoActionLabel = pendingImageName ?? 'Choisir une image';

                                        return (
                                            <article
                                                key={`init-${student.userMail}`}
                                                className="flex items-center gap-3 rounded-md border border-faded/70 p-2"
                                            >
                                                <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                                                    <Image
                                                        src={pendingPreviewUrl ?? getStudentPictureSrc(student.picture) ?? '/icons/silhouette.svg'}
                                                        alt={`Photo ${student.firstName} ${student.lastName}`}
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{student.firstName} {student.lastName}</p>
                                                    <p className="truncate text-xs text-black/70">{student.userMail} • {groupLabel}</p>
                                                    <p className="text-xs text-black/60">{photoStatusLabel}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="max-w-36 truncate text-right text-xs text-black/55">
                                                        {pendingImageName ? photoActionLabel : ''}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100"
                                                        title="Retirer cette ligne"
                                                        onClick={() => {
                                                            handleRemoveInitializationStudent(student.userMail);
                                                        }}
                                                    >
                                                        <CloseIcon style={{ fontSize: '16px' }} />
                                                    </button>
                                                    <label className="inline-flex shrink-0 cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
                                                        <span>{pendingImageName ? 'Changer l\'image' : 'Choisir une image'}</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            disabled={isFinalizingImageImportValidation}
                                                            onChange={(event) => {
                                                                const file = event.currentTarget.files?.[0];
                                                                event.currentTarget.value = '';

                                                                if (file) {
                                                                    void handleInitializationImageUpload(student.userMail, file);
                                                                }
                                                            }}
                                                            className="sr-only"
                                                        />
                                                    </label>
                                                </div>
                                            </article>
                                        );
                                    })}
                                    </div>
                                    <Button
                                        type="button"
                                        className="h-9 px-3 text-sm"
                                        disabled={isImportingImagesByFileName || isFinalizingImageImportValidation}
                                        onClick={() => { void handleFinalizeStudentImportValidation(); }}
                                    >
                                        {isFinalizingImageImportValidation ? 'Validation en cours...' : 'Valider l\'import'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {feedbackMessage && (
                <p className="rounded-md border border-green-300/80 bg-green-50 px-3 py-2 text-sm text-green-800">{feedbackMessage}</p>
            )}

            {errorMessage && (
                <p className="rounded-md border border-red-300/80 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
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
                            className="rounded-xl border border-faded/80 bg-transparent p-4 space-y-3"
                            open={openYearKeys[year] ?? true}
                            onOpenChange={(isOpen) => updateYearOpenState(year, isOpen)}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h2>
                                    <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
                                        Année {year}
                                    </CollapsibleTrigger>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{yearGroups.length} classes</Badge>
                                    <Badge variant="outline">{yearStudentsCount} étudiants</Badge>
                                    <Button
                                        size="icon-xs"
                                        variant="ghost"
                                        title="Supprimer tous les étudiants de cette année"
                                        onClick={() => {
                                            setSelectedDeletePromo(year);
                                            setIsDeletePromoDialogOpen(true);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </Button>
                                </div>
                            </div>
                            <CollapsibleContent className="space-y-3">
                                {yearGroups.map((group) => {
                                    const groupKey = String(group.groupId);
                                    const groupStudents = groupedStudents.get(groupKey) ?? [];

                                    return (
                                        <Collapsible
                                            key={group.groupId}
                                            className="rounded-lg border border-faded/70 bg-transparent p-3 space-y-2"
                                            open={openGroupKeys[groupKey] ?? true}
                                            onOpenChange={(isOpen) => updateGroupOpenState(groupKey, isOpen)}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <h3>
                                                    <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
                                                        Classe {buildGroupLabel(group)}
                                                    </CollapsibleTrigger>
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{groupStudents.length}</Badge>
                                                    <Button
                                                        size="icon-xs"
                                                        variant="ghost"
                                                        title="Supprimer tous les étudiants de cette classe"
                                                        onClick={() => {
                                                            setSelectedDeleteGroupId(group.groupId);
                                                            setIsDeleteGroupDialogOpen(true);
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CollapsibleContent className="space-y-3">
                                                <div className="space-y-2 min-h-14">
                                                    {groupStudents.map((student) => (
                                                        <article
                                                            key={student.userMail}
                                                            className="rounded-md border border-faded/70 bg-transparent p-3 flex items-center gap-3"
                                                        >
                                                            {/* Infos */}
                                                            <div className="flex flex-col justify-center min-w-0">
                                                                <p className="font-medium truncate">
                                                                    {student.firstName} {student.lastName}
                                                                </p>
                                                                <p className="text-sm text-black/70 truncate">
                                                                    {student.userMail}
                                                                </p>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-wrap gap-2 ml-auto">
                                                                <Button size="icon-xs" variant="ghost" title="Modifier"
                                                                    onClick={openEditDialog.bind(null, student)}>
                                                                    <EditIcon />
                                                                </Button>

                                                                <Button size="icon-xs" variant="ghost" title="Déplacer"
                                                                    onClick={openMoveDialog.bind(null, student)}>
                                                                    <SwapHorizIcon />
                                                                </Button>

                                                                <Button size="icon-xs" variant="ghost" title="Supprimer"
                                                                    onClick={openDeleteDialog.bind(null, student)}>
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
                        className="rounded-lg border border-dashed border-faded/70 bg-transparent p-3 space-y-2"
                        open={openGroupKeys[UNASSIGNED_GROUP_ID] ?? true}
                        onOpenChange={(isOpen) => updateGroupOpenState(UNASSIGNED_GROUP_ID, isOpen)}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <h2>
                                <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
                                    Non assigné
                                </CollapsibleTrigger>
                            </h2>
                            <Badge variant="outline">{(groupedStudents.get(UNASSIGNED_GROUP_ID) ?? []).length}</Badge>
                        </div>
                        <CollapsibleContent className="space-y-3">
                            <div className="space-y-2 min-h-14">
                                {(groupedStudents.get(UNASSIGNED_GROUP_ID) ?? []).map((student) => (
                                    <article
                                        key={student.userMail}
                                        className="rounded-md border border-faded/70 p-3 bg-transparent flex items-center justify-between gap-2"
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
                            <Label htmlFor="create-picture">Photo </Label>
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
                                        className="block h-9 w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <Label htmlFor="edit-picture">Photo </Label>
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
                                        className="block h-9 w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            Cette action désactivera le compte de {selectedStudent?.firstName} {selectedStudent?.lastName} ({selectedStudent?.userMail}) via une suppression logique.
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

            <AlertDialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer tous les étudiants de cette classe ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous allez désactiver {students.filter((student) => student.groupId === selectedDeleteGroupId).length} étudiant(s) de cette classe via une suppression logique. Cette action peut être annulée lors d&apos;un import ultérieur.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void handleDeleteGroup()}>
                            Supprimer cette classe
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeletePromoDialogOpen} onOpenChange={setIsDeletePromoDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer tous les étudiants de cette année ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous allez désactiver {countStudentsByPromo(selectedDeletePromo, students, groups)} étudiant(s) de l&apos;année {selectedDeletePromo} via une suppression logique. Cette action peut être annulée lors d&apos;un import ultérieur.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => void handleDeletePromo()}>
                            Supprimer cette année
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
