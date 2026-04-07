import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/actions/authentication';
import { teacherQueries } from '@/lib/db/queries/teacher';

export async function ensureAdminApiSession(): Promise<NextResponse | null> {
    const session = await getServerSession();

    if (!session?.teacherEmail) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const teacherResult = await teacherQueries.getByEmail(session.teacherEmail);

    if ('error' in teacherResult || !teacherResult.entity.isValidated || !teacherResult.entity.isAdmin) {
        return NextResponse.json({ error: 'Action réservée aux administrateurs.' }, { status: 403 });
    }

    return null;
}
