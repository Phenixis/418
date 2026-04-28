import { isBlobStorageUrl, isStudentBlobPath, normalizeBlobSource } from './blob';

/**
 * Resolves a student picture value to a usable `src` string for an `<img>`.
 *
 * Handles three storage strategies transparently:
 * - **Public assets** (`/…`): returned verbatim.
 * - **Non-blob remote URLs** (`http…` without Vercel Blob): returned verbatim.
 * - **Blob references** (relative path or Vercel Blob URL): proxied through
 *   `/api/students/image` so the server can stream the file.
 *
 * Returns `null` for `null`, empty strings, or unrecognised values so the
 * caller can fall back to a placeholder.
 *
 * @param picture - The raw `picture` field value from the database, or `null`.
 * @returns A URL string ready for use in `<img src>`, or `null` if unavailable.
 */
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
