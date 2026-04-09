export const STUDENT_EMAIL_DOMAIN = 'etudiant.univ-rennes.fr';

const STUDENT_EMAIL_LOCAL_PART_PATTERN = /^[a-z0-9._-]+$/;

function normalizeEmailInput(inputEmail: string): string {
    return inputEmail
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '');
}

export function extractEmailLocalPart(inputEmail: string): string | null {
    const normalizedEmail = normalizeEmailInput(inputEmail);

    if (!normalizedEmail) {
        return null;
    }

    if (!normalizedEmail.includes('@')) {
        return STUDENT_EMAIL_LOCAL_PART_PATTERN.test(normalizedEmail) ? normalizedEmail : null;
    }

    const emailParts = normalizedEmail.split('@');

    if (emailParts.length !== 2) {
        return null;
    }

    const [localPart, domainPart] = emailParts;

    if (!localPart || !domainPart) {
        return null;
    }

    if (!STUDENT_EMAIL_LOCAL_PART_PATTERN.test(localPart) || domainPart !== STUDENT_EMAIL_DOMAIN) {
        return null;
    }

    return localPart;
}

export function normalizeStudentEmail(inputEmail: string): string | null {
    const localPart = extractEmailLocalPart(inputEmail);

    if (!localPart) {
        return null;
    }

    return `${localPart}@${STUDENT_EMAIL_DOMAIN}`;
}

export function stripStudentEmailDomain(inputEmail: string): string {
    const localPart = extractEmailLocalPart(inputEmail);

    if (localPart) {
        return localPart;
    }

    return normalizeEmailInput(inputEmail);
}
