/**
 * Narrows a value to a student blob storage path (`students/…`).
 *
 * @param value - The value to test.
 * @returns `true` when `value` is a non-null string starting with `"students/"`.
 */
export function isStudentBlobPath(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.startsWith('students/');
}

/**
 * Parses and validates a raw pathname as a student blob storage path.
 *
 * Trims the input and delegates to {@link isStudentBlobPath} for the actual
 * check. Use this when the caller holds an `unknown` value from an external
 * source (e.g. a query parameter or database field).
 *
 * @param rawPathname - Untrusted input to validate.
 * @returns The trimmed pathname if valid, or `null` otherwise.
 */
export function parseStudentBlobPath(rawPathname: unknown): string | null {
    if (typeof rawPathname !== 'string') {
        return null;
    }

    const pathname = rawPathname.trim();

    return isStudentBlobPath(pathname) ? pathname : null;
}

/**
 * Converts a full Vercel Blob Storage URL into its relative pathname.
 *
 * When `rawSource` is a full `https://…blob.vercel-storage.com/…` URL the
 * function strips the origin and leading slash, returning a path suitable for
 * use with the internal image proxy. Non-blob URLs and non-URL strings are
 * returned unchanged.
 *
 * @param rawSource - A blob storage URL or any other image source string.
 * @returns The relative pathname for blob URLs, or `rawSource` as-is.
 */
export function normalizeBlobSource(rawSource: string): string {
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

/**
 * Narrows a value to a full Vercel Blob Storage URL.
 *
 * @param value - The value to test.
 * @returns `true` when `value` is a parseable URL whose hostname contains
 *   `"blob.vercel-storage.com"`.
 */
export function isBlobStorageUrl(value: string | null | undefined): value is string {
    if (typeof value !== 'string') {
        return false;
    }

    try {
        const parsedUrl = new URL(value);
        return parsedUrl.hostname.includes('blob.vercel-storage.com');
    } catch {
        return false;
    }
}

/**
 * Narrows a value to any supported blob reference — either a relative student
 * path or a full Vercel Blob Storage URL.
 *
 * Combines {@link isStudentBlobPath} and {@link isBlobStorageUrl}.
 *
 * @param value - The value to test.
 * @returns `true` when `value` is a student blob path or a blob storage URL.
 */
export function isBlobReference(value: string | null | undefined): value is string {
    if (isStudentBlobPath(value)) {
        return true;
    }

    return isBlobStorageUrl(value);
}
