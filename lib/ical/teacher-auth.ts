import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/actions/authentication';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { Select as Teacher } from '@/lib/db/schema/teacher';

export async function getAuthenticatedTeacher(): Promise<
    { teacher: Teacher; errorResponse: null } |
    { teacher: null; errorResponse: NextResponse }
> {
    const session = await getServerSession();

    if (!session?.teacherEmail) {
        return {
            teacher: null,
            errorResponse: NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }),
        };
    }

    const teacherResult = await teacherQueries.getByEmail(session.teacherEmail);

    if ('error' in teacherResult || !teacherResult.entity.isValidated) {
        return {
            teacher: null,
            errorResponse: NextResponse.json({ error: 'Accès refusé.' }, { status: 403 }),
        };
    }

    return { teacher: teacherResult.entity, errorResponse: null };
}
