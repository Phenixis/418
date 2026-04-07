import { isBlobStorageUrl, isStudentBlobPath, normalizeBlobSource } from './blob';

export function getStudentPictureSrc(picture: string | null): string | null {
    if (!picture) {
        return null;
    }

    const normalizedPicture = picture.trim();

    if (!normalizedPicture) {
        return null;
    }

    // Keep local public assets directly accessible.
    if (normalizedPicture.startsWith('/')) {
        return normalizedPicture;
    }

    // Keep non-blob remote images directly accessible.
    if (normalizedPicture.startsWith('http') && !isBlobStorageUrl(normalizedPicture)) {
        return normalizedPicture;
    }

    if (!isStudentBlobPath(normalizedPicture) && !isBlobStorageUrl(normalizedPicture)) {
        return null;
    }

    return `/api/students/image?source=${encodeURIComponent(normalizeBlobSource(normalizedPicture))}`;
}
