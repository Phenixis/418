import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/actions/authentication';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { del, put } from '@vercel/blob';

async function ensureAdminSession(): Promise<NextResponse | null> {
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

export async function POST(request: Request) {
    const unauthorizedResponse = await ensureAdminSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json({ error: 'Configuration Blob manquante (BLOB_READ_WRITE_TOKEN).' }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
        }

        // Valider que c'est une image
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Le fichier doit être une image.' }, { status: 400 });
        }

        // Limite de 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'La taille de l\'image ne doit pas dépasser 5MB.' }, { status: 400 });
        }

        // Générer un nom unique
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueFileName = `student-${timestamp}-${randomId}.${fileExtension}`;

        // Upload vers Vercel Blob
        const blob = await put(`students/${uniqueFileName}`, file, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
            access: 'private',
            addRandomSuffix: true,
        });

        return NextResponse.json({
            url: blob.url,
            pathname: blob.pathname,
            success: true,
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'upload de l\'image.' },
            { status: 500 }
        );
    }
}

type UploadDeleteBody = {
    pathname?: string;
};

function parseBlobPathname(rawPathname: unknown): string | null {
    if (typeof rawPathname !== 'string') {
        return null;
    }

    const pathname = rawPathname.trim();

    if (!pathname.startsWith('students/')) {
        return null;
    }

    return pathname;
}

export async function DELETE(request: Request) {
    const unauthorizedResponse = await ensureAdminSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return NextResponse.json({ error: 'Configuration Blob manquante (BLOB_READ_WRITE_TOKEN).' }, { status: 500 });
    }

    let requestBody: UploadDeleteBody;

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: 'Le corps de la requête doit être un JSON valide.' }, { status: 400 });
    }

    const pathname = parseBlobPathname(requestBody.pathname);

    if (!pathname) {
        return NextResponse.json({ error: 'Chemin image invalide.' }, { status: 400 });
    }

    try {
        await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image Blob:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression de l\'image.' }, { status: 500 });
    }
}
