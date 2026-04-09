import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { ensureAdminApiSession } from '@/lib/actions/admin-auth';
import { studentQueries } from '@/lib/db/queries/student';
import { groupQueries } from '@/lib/db/queries/group';
import { isBlobReference } from '@/lib/utils/blob';

type DeleteByGroupBody = {
    groupId: number;
};

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

export async function DELETE(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    let requestBody: DeleteByGroupBody;

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Le corps de la requête doit être un JSON valide.' }, { status: 400 });
    }

    const { groupId } = requestBody;

    if (!Number.isInteger(groupId) || groupId <= 0) {
        return NextResponse.json({ error: 'L\'ID du groupe doit être un nombre entier positif.' }, { status: 400 });
    }

    const studentDeletionResult = await studentQueries.deleteByGroupId(groupId);

    if ('error' in studentDeletionResult) {
        return NextResponse.json({ error: studentDeletionResult.error }, { status: 404 });
    }

    await Promise.all(
        studentDeletionResult.entity.map(async (student) => {
            await deleteStudentPictureIfNeeded(student.picture);
        })
    );

    const groupDeletionResult = await groupQueries.deleteByGroupId(groupId);

    if ('error' in groupDeletionResult) {
        return NextResponse.json({ error: `Étudiants supprimés mais erreur sur le groupe: ${groupDeletionResult.error}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Classe supprimée avec succès', studentsDeleted: studentDeletionResult.entity.length }, { status: 200 });
}
