export function isStudentBlobPath(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.startsWith('students/');
}

export function parseStudentBlobPath(rawPathname: unknown): string | null {
    if (typeof rawPathname !== 'string') {
        return null;
    }

    const pathname = rawPathname.trim();

    return isStudentBlobPath(pathname) ? pathname : null;
}

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

export function isBlobReference(value: string | null | undefined): value is string {
    if (isStudentBlobPath(value)) {
        return true;
    }

    return isBlobStorageUrl(value);
}
