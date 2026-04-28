/** Official email domain for students at Université de Rennes. */
export const STUDENT_EMAIL_DOMAIN = 'etudiant.univ-rennes.fr';

const STUDENT_EMAIL_LOCAL_PART_PATTERN = /^[a-z0-9._-]+$/;

function normalizeEmailInput(inputEmail: string): string {
    return inputEmail
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '');
}

/**
 * Extracts and validates the local part of a student email address.
 *
 * Accepts both a bare local part (e.g. `"john.doe"`) and a full address
 * (e.g. `"john.doe@etudiant.univ-rennes.fr"`). The input is lowercased, trimmed,
 * and accent-stripped before validation. Returns `null` when the input does
 * not match the expected pattern or domain.
 *
 * @param inputEmail - Raw email or local part supplied by the user.
 * @returns The validated, normalised local part, or `null` if invalid.
 */
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

/**
 * Returns the canonical student email address for a given input.
 *
 * Delegates to {@link extractEmailLocalPart} and appends
 * `@etudiant.univ-rennes.fr`. Returns `null` when the input cannot be
 * resolved to a valid local part.
 *
 * @param inputEmail - Raw email or local part supplied by the user.
 * @returns The fully-qualified student email, or `null` if the input is invalid.
 */
export function normalizeStudentEmail(inputEmail: string): string | null {
    const localPart = extractEmailLocalPart(inputEmail);

    if (!localPart) {
        return null;
    }

    return `${localPart}@${STUDENT_EMAIL_DOMAIN}`;
}

/**
 * Returns just the local part of a student email, stripping the domain.
 *
 * When the input is a valid student email the domain is removed. When it is
 * not a recognised address the string is normalised (trimmed and lowercased)
 * and returned as-is so the caller always gets a usable display value.
 *
 * @param inputEmail - Raw email or local part supplied by the user.
 * @returns The local part of the email, or the normalised input if the domain
 *   cannot be stripped.
 */
export function stripStudentEmailDomain(inputEmail: string): string {
    const localPart = extractEmailLocalPart(inputEmail);

    if (localPart) {
        return localPart;
    }

    return normalizeEmailInput(inputEmail);
}
