'use client';

import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';
import { isStudentBlobPath } from '@/lib/utils/blob';
import { useMemo, useState } from 'react';
import {
	deleteTemporaryUploadedPicture,
	uploadStudentPicture,
} from './students-management-api-client';
import {
	ALL_FILTER_VALUE,
	buildGroupLabel,
	createDefaultFormState,
	UNASSIGNED_GROUP_ID,
	type StudentFormState
} from './students-management-utils';

// Hook pour gérer les filtres (recherche, groupes, années)
export function useStudentFilters() {
	const [searchTerm, setSearchTerm] = useState('');
	const [groupFilters, setGroupFilters] = useState<string[]>([]);
	const [yearFilter, setYearFilter] = useState<string>(ALL_FILTER_VALUE);

	return {
		searchTerm,
		setSearchTerm,
		groupFilters,
		setGroupFilters,
		yearFilter,
		setYearFilter,
	};
}

// Hook pour gérer l'état d'ouverture des collapsibles
export function useStudentCollapsible(groups: Group[]) {
	const [openYearKeys, setOpenYearKeys] = useState<Record<string, boolean>>(() => {
		const defaultOpenYearKeys: Record<string, boolean> = {};

		for (const group of groups) {
			defaultOpenYearKeys[group.promo] = false;
		}

		return defaultOpenYearKeys;
	});

	const [openGroupKeys, setOpenGroupKeys] = useState<Record<string, boolean>>(() => {
		const defaultOpenGroupKeys: Record<string, boolean> = {};

		for (const group of groups) {
			defaultOpenGroupKeys[String(group.groupId)] = false;
		}

		defaultOpenGroupKeys[UNASSIGNED_GROUP_ID] = false;

		return defaultOpenGroupKeys;
	});

	function updateGroupOpenState(groupKey: string, isOpen: boolean): void {
		setOpenGroupKeys((previousOpenGroupKeys) => ({
			...previousOpenGroupKeys,
			[groupKey]: isOpen,
		}));
	}

	function updateYearOpenState(year: string, isOpen: boolean): void {
		setOpenYearKeys((previousOpenYearKeys) => ({
			...previousOpenYearKeys,
			[year]: isOpen,
		}));
	}

	function setVisibilityForAllSections(
		isOpen: boolean,
		sortedVisibleYears: string[],
		visibleGroups: Group[],
		shouldShowUnassignedGroup: boolean,
	): void {
		setOpenYearKeys((previousOpenYearKeys) => {
			const nextOpenYearKeys = { ...previousOpenYearKeys };

			for (const year of sortedVisibleYears) {
				nextOpenYearKeys[year] = isOpen;
			}

			return nextOpenYearKeys;
		});

		setOpenGroupKeys((previousOpenGroupKeys) => {
			const nextOpenGroupKeys = { ...previousOpenGroupKeys };

			for (const group of visibleGroups) {
				nextOpenGroupKeys[String(group.groupId)] = isOpen;
			}

			if (shouldShowUnassignedGroup) {
				nextOpenGroupKeys[UNASSIGNED_GROUP_ID] = isOpen;
			}

			return nextOpenGroupKeys;
		});
	}

	return {
		openYearKeys,
		openGroupKeys,
		updateGroupOpenState,
		updateYearOpenState,
		setVisibilityForAllSections,
	};
}

// Hook pour gérer les dialogues
export function useStudentDialogs() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

	return {
		isCreateDialogOpen,
		setIsCreateDialogOpen,
		isEditDialogOpen,
		setIsEditDialogOpen,
		isDeleteDialogOpen,
		setIsDeleteDialogOpen,
		isMoveDialogOpen,
		setIsMoveDialogOpen,
	};
}

// Hook pour gérer l'état des formulaires
export function useStudentForm() {
	const [createFormState, setCreateFormState] = useState<StudentFormState>(createDefaultFormState());
	const [editFormState, setEditFormState] = useState<StudentFormState>(createDefaultFormState());
	const [selectedStudentEmail, setSelectedStudentEmail] = useState<string | null>(null);

	return {
		createFormState,
		setCreateFormState,
		editFormState,
		setEditFormState,
		selectedStudentEmail,
		setSelectedStudentEmail,
	};
}

// Hook pour gérer l'upload d'images
export function useStudentImageUpload() {
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const [uploadingImageField, setUploadingImageField] = useState<'create' | 'edit' | null>(null);
	const [temporaryCreatePicturePath, setTemporaryCreatePicturePath] = useState<string | null>(null);
	const [temporaryEditPicturePath, setTemporaryEditPicturePath] = useState<string | null>(null);

	async function handleImageUpload(
		file: File,
		field: 'create' | 'edit',
		setFormState: (fn: (prev: StudentFormState) => StudentFormState) => void,
	): Promise<void> {
		setIsUploadingImage(true);
		setUploadingImageField(field);

		try {
			const responseData = await uploadStudentPicture(file);

			if (field === 'create') {
				if (temporaryCreatePicturePath && temporaryCreatePicturePath !== responseData.pathname) {
					await deleteTemporaryUploadedPicture(temporaryCreatePicturePath);
				}

				setFormState((previousState) => ({
					...previousState,
					picture: responseData.pathname,
				}));
				setTemporaryCreatePicturePath(responseData.pathname);
			} else {
				if (temporaryEditPicturePath && temporaryEditPicturePath !== responseData.pathname) {
					await deleteTemporaryUploadedPicture(temporaryEditPicturePath);
				}

				setFormState((previousState) => ({
					...previousState,
					picture: responseData.pathname,
				}));
				setTemporaryEditPicturePath(responseData.pathname);
			}

			return;
		} finally {
			setIsUploadingImage(false);
			setUploadingImageField(null);
		}
	}

	async function handleCreateDialogOpenChange(isOpen: boolean): Promise<void> {
		if (isOpen) {
			return;
		}

		if (isStudentBlobPath(temporaryCreatePicturePath)) {
			try {
				await deleteTemporaryUploadedPicture(temporaryCreatePicturePath);
			} catch (error) {
				console.error('Suppression image temporaire impossible:', error);
			}
		}

		setTemporaryCreatePicturePath(null);
	}

	async function handleEditDialogOpenChange(isOpen: boolean): Promise<void> {
		if (isOpen) {
			return;
		}

		if (isStudentBlobPath(temporaryEditPicturePath)) {
			try {
				await deleteTemporaryUploadedPicture(temporaryEditPicturePath);
			} catch (error) {
				console.error('Suppression image temporaire impossible:', error);
			}
		}

		setTemporaryEditPicturePath(null);
	}

	return {
		isUploadingImage,
		uploadingImageField,
		temporaryCreatePicturePath,
		setTemporaryCreatePicturePath,
		temporaryEditPicturePath,
		setTemporaryEditPicturePath,
		handleImageUpload,
		handleCreateDialogOpenChange,
		handleEditDialogOpenChange,
	};
}

// Hook pour gérer la liste et le groupage des étudiants
export function useStudentList(
	students: Student[],
	groups: Group[],
	searchTerm: string,
	groupFilters: string[],
	yearFilter: string,
) {
	const sortedGroups = useMemo(() => {
		return groups.slice().sort((firstGroup, secondGroup) => {
			const firstLabel = buildGroupLabel(firstGroup);
			const secondLabel = buildGroupLabel(secondGroup);
			return firstLabel.localeCompare(secondLabel, 'fr');
		});
	}, [groups]);

	const groupsById = useMemo(() => {
		return new Map(sortedGroups.map((group) => [group.groupId, group]));
	}, [sortedGroups]);

	const availableYears = useMemo(() => {
		const uniqueYears = [...new Set(sortedGroups.map((group) => group.promo))];

		return uniqueYears.sort((firstYear, secondYear) => Number(firstYear) - Number(secondYear));
	}, [sortedGroups]);

	const groupedStudents = useMemo(() => {
		const groupedById = new Map<string, Student[]>();

		for (const group of sortedGroups) {
			groupedById.set(String(group.groupId), []);
		}

		groupedById.set(UNASSIGNED_GROUP_ID, []);

		const normalizedSearchTerm = searchTerm.trim().toLowerCase();

		for (const student of students) {
			const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
			const matchesSearch = normalizedSearchTerm.length === 0
				|| fullName.includes(normalizedSearchTerm)
				|| student.userMail.toLowerCase().includes(normalizedSearchTerm);

			if (!matchesSearch) {
				continue;
			}

			const studentGroupKey = typeof student.groupId === 'number' ? String(student.groupId) : UNASSIGNED_GROUP_ID;

			const currentGroupStudents = groupedById.get(studentGroupKey) ?? [];
			currentGroupStudents.push(student);
			groupedById.set(studentGroupKey, currentGroupStudents);
		}

		for (const [groupKey, groupStudents] of groupedById.entries()) {
			const sortedGroupStudents = [...groupStudents].sort((firstStudent, secondStudent) => {
				const lastNameOrder = firstStudent.lastName.localeCompare(secondStudent.lastName, 'fr');
				if (lastNameOrder !== 0) {
					return lastNameOrder;
				}

				return firstStudent.firstName.localeCompare(secondStudent.firstName, 'fr');
			});

			groupedById.set(groupKey, sortedGroupStudents);
		}

		return groupedById;
	}, [searchTerm, sortedGroups, students]);

	const hasActiveSearch = useMemo(() => {
		return searchTerm.trim().length > 0;
	}, [searchTerm]);

	const visibleGroups = useMemo(() => {
		return sortedGroups.filter((group) => {
			const groupKey = String(group.groupId);
			const matchesGroup = groupFilters.length === 0 || groupFilters.includes(groupKey);
			const matchesYear = yearFilter === ALL_FILTER_VALUE || group.promo === yearFilter;
			const hasMatchingStudents = (groupedStudents.get(groupKey) ?? []).length > 0;

			if (hasActiveSearch) {
				return matchesGroup && matchesYear && hasMatchingStudents;
			}

			return matchesGroup && matchesYear;
		});
	}, [groupFilters, groupedStudents, hasActiveSearch, sortedGroups, yearFilter]);

	const visibleGroupsByYear = useMemo(() => {
		const groupsByYear: Record<string, Group[]> = {};

		for (const group of visibleGroups) {
			if (!groupsByYear[group.promo]) {
				groupsByYear[group.promo] = [];
			}

			groupsByYear[group.promo].push(group);
		}

		return groupsByYear;
	}, [visibleGroups]);

	const sortedVisibleYears = useMemo(() => {
		return Object.keys(visibleGroupsByYear).sort((firstYear, secondYear) => Number(firstYear) - Number(secondYear));
	}, [visibleGroupsByYear]);

	const shouldShowUnassignedGroup = useMemo(() => {
		if (groupFilters.length !== 0) {
			return false;
		}

		if (!hasActiveSearch) {
			return true;
		}

		return (groupedStudents.get(UNASSIGNED_GROUP_ID) ?? []).length > 0;
	}, [groupFilters, groupedStudents, hasActiveSearch]);

	return {
		sortedGroups,
		groupsById,
		availableYears,
		groupedStudents,
		visibleGroups,
		visibleGroupsByYear,
		sortedVisibleYears,
		shouldShowUnassignedGroup,
	};
}

// Hook pour gérer la sélection de l'étudiant et les groupes de déplacement
export function useSelectedStudent(students: Student[], selectedStudentEmail: string | null, groupsById: Map<number, Group>, sortedGroups: Group[]) {
	const selectedStudent = useMemo(() => {
		if (!selectedStudentEmail) {
			return null;
		}

		return students.find((student) => student.userMail === selectedStudentEmail) ?? null;
	}, [selectedStudentEmail, students]);

	const moveCandidateGroups = useMemo(() => {
		if (selectedStudent?.groupId == null) {
			return [] as Group[];
		}

		const selectedStudentGroup = groupsById.get(selectedStudent.groupId);

		if (!selectedStudentGroup) {
			return [] as Group[];
		}

		return sortedGroups.filter((group) => {
			return group.promo === selectedStudentGroup.promo && group.groupId !== selectedStudentGroup.groupId;
		});
	}, [groupsById, selectedStudent, sortedGroups]);

	return {
		selectedStudent,
		moveCandidateGroups,
	};
}
