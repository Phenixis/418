export function getStudentPictureSrc(picture: string | null): string | null {
    if (!picture) {
        return null;
    }

    // Keep non-blob remote images directly accessible.
    if (picture.startsWith('http') && !picture.includes('blob.vercel-storage.com')) {
        return picture;
    }

    return `/api/students/image?source=${encodeURIComponent(picture)}`;
}
