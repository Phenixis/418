import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { ensureAdminApiSession } from '@/lib/actions/admin-auth';
import { studentQueries } from '@/lib/db/queries/student';
import { groupQueries } from '@/lib/db/queries/group';
import { isBlobReference } from '@/lib/utils/blob';

type DeleteByPromoBody = {
    promo: string;
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

    let requestBody: DeleteByPromoBody;

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Le corps de la requête doit être un JSON valide.' }, { status: 400 });
    }

    const { promo } = requestBody;

    if (typeof promo !== 'string' || promo.length !== 1) {
        return NextResponse.json({ error: 'L\'année doit être un caractère valide.' }, { status: 400 });
    }

    let studentsDeleted = 0;
    const studentDeletionResult = await studentQueries.deleteByPromo(promo);

    if ('success' in studentDeletionResult) {
        studentsDeleted = studentDeletionResult.entity.length;
        await Promise.all(
            studentDeletionResult.entity.map(async (student) => {
                await deleteStudentPictureIfNeeded(student.picture);
            })
        );
    }

    const groupDeletionResult = await groupQueries.deleteByPromo(promo);

    if ('error' in groupDeletionResult) {
        return NextResponse.json({ error: groupDeletionResult.error }, { status: 404 });
    }

    if (groupDeletionResult.entity.length === 0) {
        return NextResponse.json({ error: 'Aucun groupe trouvé pour cette année.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Année supprimée avec succès', studentsDeleted, groupsDeleted: groupDeletionResult.entity.length }, { status: 200 });
}
