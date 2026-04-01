import { NextResponse } from 'next/server';
import { get, type GetBlobResult } from '@vercel/blob';
import { getServerSession } from '@/lib/actions/authentication';
import { getStudentServerSession } from '@/lib/actions/student-auth';
import { studentQueries } from '@/lib/db/queries/student';

async function ensureAuthenticatedSession(): Promise<NextResponse | null> {
    const [teacherSession, studentSession] = await Promise.all([
        getServerSession(),
        getStudentServerSession(),
    ]);

    if (!teacherSession?.teacherEmail && !studentSession?.studentEmail) {
        return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    return null;
}

function normalizeBlobSource(rawSource: string): string {
    if (!rawSource.startsWith('http')) {
        return rawSource;
    }

    try {
        const sourceUrl = new URL(rawSource);

        if (!sourceUrl.hostname.includes('blob.vercel-storage.com')) {
            return rawSource;
        }

        return sourceUrl.pathname.replace(/^\//, '');
    } catch {
        return rawSource;
    }
}

async function ensureStudentCanAccessSource(studentEmail: string, source: string): Promise<NextResponse | null> {
    const studentResult = await studentQueries.getByEmail(studentEmail);

    if ('error' in studentResult) {
        return NextResponse.json({ error: 'Étudiant introuvable.' }, { status: 404 });
    }

    const studentPicture = studentResult.entity.picture;

    if (!studentPicture) {
        return NextResponse.json({ error: 'Aucune image associée à cet étudiant.' }, { status: 403 });
    }

    const normalizedRequestedSource = normalizeBlobSource(source);
    const normalizedStudentPicture = normalizeBlobSource(studentPicture);

    if (normalizedRequestedSource !== normalizedStudentPicture) {
        return NextResponse.json({ error: 'Accès non autorisé à cette image.' }, { status: 403 });
    }

    return null;
}

function buildNotModifiedResponse(result: Extract<GetBlobResult, { statusCode: 304 }>): Response {
    return new Response(null, {
        status: 304,
        headers: {
            ETag: result.blob.etag,
            'Cache-Control': 'private, max-age=60',
        },
    });
}

export async function GET(request: Request) {
    const [teacherSession, studentSession] = await Promise.all([
        getServerSession(),
        getStudentServerSession(),
    ]);

    const isTeacherAuthenticated = Boolean(teacherSession?.teacherEmail);
    const isStudentAuthenticated = Boolean(studentSession?.studentEmail);

    const unauthorizedResponse = await ensureAuthenticatedSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: 'Configuration Blob manquante (BLOB_READ_WRITE_TOKEN).' }, { status: 500 });
    }

    const url = new URL(request.url);
    const source = url.searchParams.get('source');

    if (!source) {
        return NextResponse.json({ error: 'Paramètre source manquant.' }, { status: 400 });
    }

    if (!isTeacherAuthenticated && isStudentAuthenticated) {
        const authorizationError = await ensureStudentCanAccessSource(studentSession!.studentEmail, source);

        if (authorizationError) {
            return authorizationError;
        }
    }

    try {
        const blobResult = await get(source, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
            access: 'private',
            useCache: true,
        });

        if (!blobResult) {
            return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 });
        }

        if (blobResult.statusCode === 304) {
            return buildNotModifiedResponse(blobResult);
        }

        return new Response(blobResult.stream, {
            status: 200,
            headers: {
                'Content-Type': blobResult.blob.contentType,
                'Cache-Control': 'private, max-age=60',
                ETag: blobResult.blob.etag,
            },
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'image Blob privée:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération de l\'image.' }, { status: 500 });
    }
}
