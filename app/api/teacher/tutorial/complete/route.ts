import { getServerSession } from '@/lib/actions/authentication';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { NextResponse } from 'next/server';

export async function POST() {
    const session = await getServerSession();

    if (!session?.teacherEmail) {
        return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const completionResult = await teacherQueries.markFirstConnectionAsCompleted(session.teacherEmail);

    if ('error' in completionResult) {
        return NextResponse.json({ error: completionResult.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}