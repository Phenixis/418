import { normalizeStudentEmail } from '@/lib/utils/student-email';
import type { Select as Group } from '@/lib/db/schema/group';

export const UNASSIGNED_GROUP_ID = 'unassigned';
export const ALL_FILTER_VALUE = 'all';

export type StudentFormState = {
	firstName: string;
	lastName: string;
	email: string;
	groupId: string;
	picture: string | null;
};

export function buildGroupLabel(group: Group): string {
	return `${group.promo}${group.td}${group.tp}`;
}

export function normalizeStudentEmailForRequest(inputEmail: string): string {
	const normalizedEmail = normalizeStudentEmail(inputEmail);

	if (normalizedEmail) {
		return normalizedEmail;
	}

	return inputEmail.trim().toLowerCase();
}

export function toApiGroupId(rawGroupId: string): number | null {
	if (rawGroupId === UNASSIGNED_GROUP_ID) {
		return null;
	}

	return Number.parseInt(rawGroupId, 10);
}

export function createDefaultFormState(): StudentFormState {
	return {
		firstName: '',
		lastName: '',
		email: '',
		groupId: UNASSIGNED_GROUP_ID,
		picture: null,
	};
}
