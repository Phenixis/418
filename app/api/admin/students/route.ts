import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { ensureAdminApiSession } from '@/lib/actions/admin-auth';
import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import { normalizeStudentEmail } from '@/lib/utils/student-email';
import { isBlobReference } from '@/lib/utils/blob';

type StudentWriteBody = {
    currentEmail?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    groupId?: number | null;
    picture?: string | null;
};

const DEFAULT_EMPTY_PASSWORD_VALUE: null = null;
const INVALID_PICTURE = Symbol('invalidPicture');

function parseTrimmedValue(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : null;
}

function parseNormalizedStudentEmail(rawEmail: unknown): string | null {
    const trimmedEmail = parseTrimmedValue(rawEmail);

    if (!trimmedEmail) {
        return null;
    }

    return normalizeStudentEmail(trimmedEmail);
}

function parseOptionalGroupId(rawGroupId: unknown): number | null | 'invalid' {
    if (rawGroupId === null || rawGroupId === undefined || rawGroupId === '') {
        return null;
    }

    if (typeof rawGroupId !== 'number' || !Number.isInteger(rawGroupId) || rawGroupId <= 0) {
        return 'invalid';
    }

    return rawGroupId;
}

function parseOptionalPicture(rawPicture: unknown): string | null | undefined | typeof INVALID_PICTURE {
    if (rawPicture === undefined) {
        return undefined;
    }

    if (rawPicture === null) {
        return null;
    }

    if (typeof rawPicture !== 'string') {
        return INVALID_PICTURE;
    }

    const trimmedPicture = rawPicture.trim();

    return trimmedPicture.length > 0 ? trimmedPicture : null;
}

function hasPictureChanged(previousPicture: string | null, nextPicture: string | null | undefined): boolean {
    if (nextPicture === undefined) {
        return false;
    }

    return previousPicture !== nextPicture;
}

async function deleteStudentPictureIfNeeded(picture: string | null): Promise<void> {
    if (!isBlobReference(picture)) {
        return;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.warn('Suppression Blob ignorée: BLOB_READ_WRITE_TOKEN manquant.');
        return;
    }

    try {
        await del(picture, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (error) {
        console.error('Impossible de supprimer l\'image Blob privée:', error);
    }
}

async function ensureGroupExists(groupId: number | null): Promise<boolean> {
    if (groupId === null) {
        return true;
    }

    const groupResult = await groupQueries.getById(groupId);

    return 'success' in groupResult;
}

export async function POST(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    let requestBody: StudentWriteBody;

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Le corps de la requête doit être un JSON valide.' }, { status: 400 });
    }

    const firstName = parseTrimmedValue(requestBody.firstName);
    const lastName = parseTrimmedValue(requestBody.lastName);
    const studentEmail = parseNormalizedStudentEmail(requestBody.email);
    const groupId = parseOptionalGroupId(requestBody.groupId);
    const picture = parseOptionalPicture(requestBody.picture);

    if (!firstName || !lastName || !studentEmail || groupId === null || groupId === 'invalid' || picture === INVALID_PICTURE) {
        return NextResponse.json({ error: 'Les données étudiant sont invalides.' }, { status: 400 });
    }

    const isGroupValid = await ensureGroupExists(groupId);

    if (!isGroupValid) {
        return NextResponse.json({ error: 'Le groupe sélectionné est introuvable.' }, { status: 400 });
    }

    const existingStudent = await studentQueries.getByEmail(studentEmail);

    if ('success' in existingStudent) {
        return NextResponse.json({ error: 'Un étudiant existe déjà avec cet email.' }, { status: 409 });
    }

    const existingStudentIncludingDeleted = await studentQueries.getByEmailIncludingDeleted(studentEmail);

    if ('success' in existingStudentIncludingDeleted && existingStudentIncludingDeleted.entity.deletedAt !== null) {
        return NextResponse.json(
            { error: 'Un compte supprimé existe déjà avec cet email. Restaure ce compte au lieu d\'en créer un nouveau.' },
            { status: 409 }
        );
    }

    const creationResult = await studentQueries.create({
        userMail: studentEmail,
        firstName,
        lastName,
        password: DEFAULT_EMPTY_PASSWORD_VALUE,
        isTeacher: false,
        groupId,
        picture: picture ?? null,
    });

    if ('error' in creationResult) {
        return NextResponse.json({ error: creationResult.error }, { status: 500 });
    }

    return NextResponse.json({ student: creationResult.entity }, { status: 201 });
}

export async function PATCH(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    let requestBody: StudentWriteBody;

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Le corps de la requête doit être un JSON valide.' }, { status: 400 });
    }

    const currentEmail = parseNormalizedStudentEmail(requestBody.currentEmail);
    const nextEmail = parseNormalizedStudentEmail(requestBody.email);
    const firstName = parseTrimmedValue(requestBody.firstName);
    const lastName = parseTrimmedValue(requestBody.lastName);
    const groupId = parseOptionalGroupId(requestBody.groupId);
    const picture = parseOptionalPicture(requestBody.picture);

    if (!currentEmail || !nextEmail || !firstName || !lastName || groupId === null || groupId === 'invalid' || picture === INVALID_PICTURE) {
        return NextResponse.json({ error: 'Les données étudiant sont invalides.' }, { status: 400 });
    }

    const isGroupValid = await ensureGroupExists(groupId);

    if (!isGroupValid) {
        return NextResponse.json({ error: 'Le groupe sélectionné est introuvable.' }, { status: 400 });
    }

    if (currentEmail !== nextEmail) {
        const existingStudent = await studentQueries.getByEmail(nextEmail);
        if ('success' in existingStudent) {
            return NextResponse.json({ error: 'Un étudiant existe déjà avec cet email.' }, { status: 409 });
        }
    }

    const currentStudentResult = await studentQueries.getByEmail(currentEmail);

    if ('error' in currentStudentResult) {
        return NextResponse.json({ error: currentStudentResult.error }, { status: 404 });
    }

    const previousPicture = currentStudentResult.entity.picture;

    const updateResult = await studentQueries.updateByEmail(currentEmail, {
        userMail: nextEmail,
        firstName,
        lastName,
        groupId,
        isTeacher: false,
        ...(picture !== undefined && { picture }),
    });

    if ('error' in updateResult) {
        return NextResponse.json({ error: updateResult.error }, { status: 404 });
    }

    if (hasPictureChanged(previousPicture, picture)) {
        await deleteStudentPictureIfNeeded(previousPicture);
    }

    return NextResponse.json({ student: updateResult.entity }, { status: 200 });
}

export async function DELETE(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    let requestBody: StudentWriteBody;

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Le corps de la requête doit être un JSON valide.' }, { status: 400 });
    }

    const studentEmail = parseNormalizedStudentEmail(requestBody.email);

    if (!studentEmail) {
        return NextResponse.json({ error: 'Email étudiant invalide.' }, { status: 400 });
    }

    const deletionResult = await studentQueries.deleteByEmail(studentEmail);

    if ('error' in deletionResult) {
        return NextResponse.json({ error: deletionResult.error }, { status: 404 });
    }

    await deleteStudentPictureIfNeeded(deletionResult.entity.picture);

    return NextResponse.json({ student: deletionResult.entity }, { status: 200 });
}
