import { NextResponse } from 'next/server';
import { get, type GetBlobResult } from '@vercel/blob';
import { getServerSession } from '@/lib/actions/authentication';
import { getStudentServerSession } from '@/lib/actions/student-auth';

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
