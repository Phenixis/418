import { NextResponse } from 'next/server';
import { ensureAdminApiSession } from '@/lib/actions/admin-auth';
import { del, put } from '@vercel/blob';
import { parseStudentBlobPath } from '@/lib/utils/blob';

const IMAGE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

function isAllowedImageMimeType(mimeType: string): mimeType is keyof typeof IMAGE_EXTENSION_BY_MIME_TYPE {
    return mimeType in IMAGE_EXTENSION_BY_MIME_TYPE;
}

function detectImageMimeTypeFromSignature(fileBytes: Uint8Array): string | null {
    if (fileBytes.length < 12) {
        return null;
    }

    // JPEG: FF D8 FF
    if (fileBytes[0] === 0xff && fileBytes[1] === 0xd8 && fileBytes[2] === 0xff) {
        return 'image/jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        fileBytes[0] === 0x89 && fileBytes[1] === 0x50 && fileBytes[2] === 0x4e && fileBytes[3] === 0x47
        && fileBytes[4] === 0x0d && fileBytes[5] === 0x0a && fileBytes[6] === 0x1a && fileBytes[7] === 0x0a
    ) {
        return 'image/png';
    }

    // GIF: "GIF87a" / "GIF89a"
    if (
        fileBytes[0] === 0x47 && fileBytes[1] === 0x49 && fileBytes[2] === 0x46 && fileBytes[3] === 0x38
        && (fileBytes[4] === 0x37 || fileBytes[4] === 0x39) && fileBytes[5] === 0x61
    ) {
        return 'image/gif';
    }

    // WebP: RIFF....WEBP
    if (
        fileBytes[0] === 0x52 && fileBytes[1] === 0x49 && fileBytes[2] === 0x46 && fileBytes[3] === 0x46
        && fileBytes[8] === 0x57 && fileBytes[9] === 0x45 && fileBytes[10] === 0x42 && fileBytes[11] === 0x50
    ) {
        return 'image/webp';
    }

    return null;
}

export async function POST(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

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
        const normalizedMimeType = file.type.trim().toLowerCase();

        if (!isAllowedImageMimeType(normalizedMimeType)) {
            return NextResponse.json({ error: 'Le fichier doit être une image.' }, { status: 400 });
        }

        // Limite de 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'La taille de l\'image ne doit pas dépasser 5MB.' }, { status: 400 });
        }

        const fileBytes = new Uint8Array(await file.arrayBuffer());
        const signatureMimeType = detectImageMimeTypeFromSignature(fileBytes);

        if (!signatureMimeType || signatureMimeType !== normalizedMimeType) {
            return NextResponse.json({ error: 'Le contenu du fichier ne correspond pas à un format image autorisé.' }, { status: 400 });
        }

        // Générer un nom unique
        const timestamp = Date.now();
        const fileExtension = IMAGE_EXTENSION_BY_MIME_TYPE[normalizedMimeType];
        const uniqueFileName = `student-${timestamp}.${fileExtension}`;

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
    return parseStudentBlobPath(rawPathname);
}

export async function DELETE(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

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
