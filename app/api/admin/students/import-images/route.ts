import { NextResponse } from 'next/server';
import { del, put } from '@vercel/blob';
import { ensureAdminApiSession } from '@/lib/actions/admin-auth';
import { studentQueries } from '@/lib/db/queries/student';
import { isBlobReference } from '@/lib/utils/blob';
import { normalizeStudentEmail } from '@/lib/utils/student-email';
import type { Select as Student } from '@/lib/db/schema/student';

type ImageImportItemStatus = 'updated' | 'skipped';

type ImageImportItem = {
    fileName: string;
    status: ImageImportItemStatus;
    matchedEmail: string | null;
    reason: string | null;
};

const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

function isAllowedImageMimeType(mimeType: string): mimeType is keyof typeof IMAGE_EXTENSION_BY_MIME_TYPE {
    return mimeType in IMAGE_EXTENSION_BY_MIME_TYPE;
}

function detectImageMimeTypeFromSignature(fileBytes: Uint8Array): string | null {
    if (fileBytes.length < 12) {
        return null;
    }

    if (fileBytes[0] === 0xff && fileBytes[1] === 0xd8 && fileBytes[2] === 0xff) {
        return 'image/jpeg';
    }

    if (
        fileBytes[0] === 0x89 && fileBytes[1] === 0x50 && fileBytes[2] === 0x4e && fileBytes[3] === 0x47
        && fileBytes[4] === 0x0d && fileBytes[5] === 0x0a && fileBytes[6] === 0x1a && fileBytes[7] === 0x0a
    ) {
        return 'image/png';
    }

    if (
        fileBytes[0] === 0x47 && fileBytes[1] === 0x49 && fileBytes[2] === 0x46 && fileBytes[3] === 0x38
        && (fileBytes[4] === 0x37 || fileBytes[4] === 0x39) && fileBytes[5] === 0x61
    ) {
        return 'image/gif';
    }

    if (
        fileBytes[0] === 0x52 && fileBytes[1] === 0x49 && fileBytes[2] === 0x46 && fileBytes[3] === 0x46
        && fileBytes[8] === 0x57 && fileBytes[9] === 0x45 && fileBytes[10] === 0x42 && fileBytes[11] === 0x50
    ) {
        return 'image/webp';
    }

    return null;
}

function normalizeToken(value: string): string {
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
    const firstNameToken = normalizeToken(firstName);
    const lastNameToken = normalizeToken(lastName);

    if (!firstNameToken || !lastNameToken) {
        return [];
    }

    return [`${firstNameToken}.${lastNameToken}`, `${lastNameToken}.${firstNameToken}`];
}

function parseCandidateKeysFromFileName(fileName: string): string[] {
    const baseName = removeFileExtension(fileName);
    const normalizedBaseName = normalizeToken(baseName);

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

    const normalizedToken = normalizeToken(baseName);

    if (!normalizedToken) {
        return null;
    }

    return normalizeStudentEmail(normalizedToken);
}

async function deleteStudentPictureIfNeeded(picture: string | null): Promise<void> {
    if (!isBlobReference(picture)) {
        return;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return;
    }

    try {
        await del(picture, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (error) {
        console.error('Impossible de supprimer l\'ancienne image Blob:', error);
    }
}

function createSkippedItem(fileName: string, reason: string, matchedEmail: string | null = null): ImageImportItem {
    return {
        fileName,
        status: 'skipped',
        matchedEmail,
        reason,
    };
}

function isFileEntry(entry: FormDataEntryValue): entry is File {
    return entry instanceof File;
}

function buildStudentLookup(students: Student[]): {
    studentsByEmail: Map<string, Student>;
    studentsByNameKey: Map<string, Student[]>;
} {
    const studentsByEmail = new Map(students.map((student) => [student.userMail, student]));
    const studentsByNameKey = new Map<string, Student[]>();

    for (const student of students) {
        const nameKeys = buildStudentNameKeys(student.firstName, student.lastName);

        for (const nameKey of nameKeys) {
            const existingStudents = studentsByNameKey.get(nameKey) ?? [];
            existingStudents.push(student);
            studentsByNameKey.set(nameKey, existingStudents);
        }
    }

    return { studentsByEmail, studentsByNameKey };
}

type ResolvedStudent = {
    student: Student | null;
    errorReason: string | null;
};

function resolveStudentForFileName(
    fileName: string,
    studentsByEmail: Map<string, Student>,
    studentsByNameKey: Map<string, Student[]>
): ResolvedStudent {
    const candidateEmail = parseCandidateEmailFromFileName(fileName);

    if (candidateEmail) {
        const studentFromEmail = studentsByEmail.get(candidateEmail) ?? null;

        if (studentFromEmail) {
            return { student: studentFromEmail, errorReason: null };
        }
    }

    const candidateNameKeys = parseCandidateKeysFromFileName(fileName);

    for (const candidateNameKey of candidateNameKeys) {
        const matchingStudents = studentsByNameKey.get(candidateNameKey) ?? [];

        if (matchingStudents.length === 1) {
            return { student: matchingStudents[0], errorReason: null };
        }

        if (matchingStudents.length > 1) {
            return {
                student: null,
                errorReason: 'Correspondance ambiguë (plusieurs étudiants). Renomme le fichier avec l\'email.',
            };
        }
    }

    return {
        student: null,
        errorReason: 'Aucun étudiant trouvé depuis le nom du fichier.',
    };
}

async function validateImageFile(file: File): Promise<{ mimeType: keyof typeof IMAGE_EXTENSION_BY_MIME_TYPE | null; reason: string | null }> {
    const normalizedMimeType = file.type.trim().toLowerCase();

    if (!isAllowedImageMimeType(normalizedMimeType)) {
        return { mimeType: null, reason: 'Type de fichier non supporté.' };
    }

    if (file.size > 5 * 1024 * 1024) {
        return { mimeType: null, reason: 'Image > 5MB.' };
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const signatureMimeType = detectImageMimeTypeFromSignature(fileBytes);

    if (!signatureMimeType || signatureMimeType !== normalizedMimeType) {
        return { mimeType: null, reason: 'Signature binaire invalide pour ce type image.' };
    }

    return { mimeType: normalizedMimeType, reason: null };
}

async function applyPictureToStudent(file: File, mimeType: keyof typeof IMAGE_EXTENSION_BY_MIME_TYPE, student: Student): Promise<Student | null> {
    const localPart = student.userMail.split('@')[0] ?? 'student';
    const fileExtension = IMAGE_EXTENSION_BY_MIME_TYPE[mimeType];
    const timestamp = Date.now();
    const uploadedBlob = await put(`students/${localPart}-${timestamp}.${fileExtension}`, file, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
        access: 'private',
        addRandomSuffix: true,
    });

    const updateResult = await studentQueries.updateByEmail(student.userMail, {
        picture: uploadedBlob.pathname,
    });

    if ('error' in updateResult) {
        await del(uploadedBlob.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
        return null;
    }

    await deleteStudentPictureIfNeeded(student.picture);
    return updateResult.entity;
}

export async function POST(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: 'Configuration Blob manquante (BLOB_READ_WRITE_TOKEN).' }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files').filter(isFileEntry);

    if (files.length === 0) {
        return NextResponse.json({ error: 'Aucune image fournie.' }, { status: 400 });
    }

    const studentsResult = await studentQueries.getAll();

    if ('error' in studentsResult) {
        return NextResponse.json({ error: 'Aucun étudiant actif trouvé.' }, { status: 404 });
    }

    const students = studentsResult.entity;
    const { studentsByEmail, studentsByNameKey } = buildStudentLookup(students);

    const items: ImageImportItem[] = [];
    const updatedStudentsByEmail = new Map<string, Student>();
    const alreadyUpdatedEmails = new Set<string>();

    for (const file of files) {
        const validationResult = await validateImageFile(file);

        if (!validationResult.mimeType) {
            items.push(createSkippedItem(file.name, validationResult.reason ?? 'Image invalide.'));
            continue;
        }

        const resolvedStudent = resolveStudentForFileName(file.name, studentsByEmail, studentsByNameKey);

        if (!resolvedStudent.student) {
            items.push(createSkippedItem(file.name, resolvedStudent.errorReason ?? 'Aucun étudiant trouvé.', null));
            continue;
        }

        const matchedStudent = resolvedStudent.student;

        if (alreadyUpdatedEmails.has(matchedStudent.userMail)) {
            items.push(createSkippedItem(file.name, 'Plusieurs images pour le même étudiant dans ce lot.', matchedStudent.userMail));
            continue;
        }

        const updatedStudent = await applyPictureToStudent(file, validationResult.mimeType, matchedStudent);

        if (!updatedStudent) {
            items.push(createSkippedItem(file.name, 'Échec de mise à jour de la photo étudiant.', matchedStudent.userMail));
            continue;
        }

        updatedStudentsByEmail.set(updatedStudent.userMail, updatedStudent);
        alreadyUpdatedEmails.add(matchedStudent.userMail);

        items.push({
            fileName: file.name,
            status: 'updated',
            matchedEmail: updatedStudent.userMail,
            reason: null,
        });
    }

    return NextResponse.json(
        {
            summary: {
                totalFiles: files.length,
                updatedCount: items.filter((item) => item.status === 'updated').length,
                skippedCount: items.filter((item) => item.status === 'skipped').length,
            },
            items,
            updatedStudents: Array.from(updatedStudentsByEmail.values()),
        },
        { status: 200 }
    );
}
