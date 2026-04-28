import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/actions/authentication';
import { teacherQueries } from '@/lib/db/queries/teacher';

/**
 * Guards an API route handler by verifying the caller is an authenticated admin.
 *
 * Returns a 401 `NextResponse` when there is no session, and a 403 when the
 * authenticated teacher is not validated or not an admin. Returns `null` when
 * the caller is allowed to proceed.
 *
 * @returns `null` when the caller is an authenticated admin, or a
 *   `NextResponse` with the appropriate HTTP error status.
 */
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
