'use client';

import { useState } from 'react';
import { stripStudentEmailDomain } from '@/lib/utils/student-email';
import {
	createStudent,
	deleteStudentByEmail,
	updateStudent,
} from './students-management-api-client';
import {
	buildGroupLabel,
	createDefaultFormState,
	normalizeStudentEmailForRequest,
	toApiGroupId,
	UNASSIGNED_GROUP_ID,
} from './students-management-utils';
import {
	useStudentCollapsible,
	useStudentDialogs,
	useStudentFilters,
	useStudentForm,
	useStudentImageUpload,
	useStudentList,
	useSelectedStudent,
} from './use-students-management-state';
import { CreateStudentDialog } from './dialogs/CreateStudentDialog';
import { EditStudentDialog } from './dialogs/EditStudentDialog';
import { MoveStudentDialog } from './dialogs/MoveStudentDialog';
import { DeleteStudentConfirmDialog } from './dialogs/DeleteStudentConfirmDialog';
import { StudentsListHeader } from './list/StudentsListHeader';
import { StudentsYearSection, UnassignedGroupSection } from './list/StudentsYearSection';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';

type StudentsManagementClientProps = {
	initialStudents: Student[];
	groups: Group[];
};

export default function StudentsManagementClient({ initialStudents, groups }: Readonly<StudentsManagementClientProps>) {
	const [students, setStudents] = useState<Student[]>(initialStudents);
	const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [moveTargetGroupId, setMoveTargetGroupId] = useState<string>('');

	const filters = useStudentFilters();
	const dialogs = useStudentDialogs();
	const forms = useStudentForm();
	const imageUpload = useStudentImageUpload();

	const listData = useStudentList(
		students,
		groups,
		filters.searchTerm,
		filters.groupFilters,
		filters.yearFilter,
	);

	const collapsible = useStudentCollapsible(groups);
	const { selectedStudent, moveCandidateGroups } = useSelectedStudent(
		students,
		forms.selectedStudentEmail,
		listData.groupsById,
		listData.sortedGroups,
	);

	function resetStatusMessages(): void {
		setFeedbackMessage(null);
		setErrorMessage(null);
	}

	function openCreateDialog(): void {
		resetStatusMessages();
		forms.setCreateFormState(createDefaultFormState());
		imageUpload.setTemporaryCreatePicturePath(null);
		dialogs.setIsCreateDialogOpen(true);
	}

	function openEditDialog(student: Student): void {
		resetStatusMessages();
		forms.setSelectedStudentEmail(student.userMail);
		forms.setEditFormState({
			firstName: student.firstName,
			lastName: student.lastName,
			email: stripStudentEmailDomain(student.userMail),
			groupId: typeof student.groupId === 'number' ? String(student.groupId) : UNASSIGNED_GROUP_ID,
			picture: student.picture,
		});
		imageUpload.setTemporaryEditPicturePath(null);
		dialogs.setIsEditDialogOpen(true);
	}

	function openDeleteDialog(student: Student): void {
		resetStatusMessages();
		forms.setSelectedStudentEmail(student.userMail);
		dialogs.setIsDeleteDialogOpen(true);
	}

	function openMoveDialog(student: Student): void {
		resetStatusMessages();
		forms.setSelectedStudentEmail(student.userMail);

		if (student.groupId === null) {
			setMoveTargetGroupId('');
			setErrorMessage('Cet étudiant n\'a pas de classe actuelle. Utilise Modifier pour lui attribuer une classe.');
			return;
		}

		const selectedStudentGroup = listData.groupsById.get(student.groupId);

		if (!selectedStudentGroup) {
			setMoveTargetGroupId('');
			setErrorMessage('Classe actuelle introuvable.');
			return;
		}

		const availableMoveTargets = listData.sortedGroups.filter((group) => {
			return group.promo === selectedStudentGroup.promo && group.groupId !== selectedStudentGroup.groupId;
		});

		if (availableMoveTargets.length === 0) {
			setMoveTargetGroupId('');
			setErrorMessage('Aucune autre classe disponible dans la même année.');
			return;
		}

		setMoveTargetGroupId(String(availableMoveTargets[0].groupId));
		dialogs.setIsMoveDialogOpen(true);
	}

	async function handleImageUpload(file: File): Promise<void> {
		const field = dialogs.isEditDialogOpen ? 'edit' : 'create';
		const setFormState = field === 'create' ? forms.setCreateFormState : forms.setEditFormState;

		resetStatusMessages();  

        try {  
            await imageUpload.handleImageUpload(file, field, setFormState);  
        } catch (error) {  
            setErrorMessage(error instanceof Error ? error.message : 'Téléversement de l\'image impossible.');  
        }  
	}

	async function handleCreateStudent(): Promise<void> {
		setIsSubmitting(true);
		resetStatusMessages();

		try {
			const createdStudent = await createStudent({
				firstName: forms.createFormState.firstName,
				lastName: forms.createFormState.lastName,
				email: normalizeStudentEmailForRequest(forms.createFormState.email),
				groupId: toApiGroupId(forms.createFormState.groupId),
				picture: forms.createFormState.picture,
			});

			setStudents((previousStudents) => [createdStudent, ...previousStudents]);
			imageUpload.setTemporaryCreatePicturePath(null);
			dialogs.setIsCreateDialogOpen(false);
			setFeedbackMessage('Étudiant créé avec succès.');
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Création impossible.');
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleUpdateStudent(): Promise<void> {
		if (!selectedStudent) {
			return;
		}

		setIsSubmitting(true);
		resetStatusMessages();

		try {
			const updatedStudent = await updateStudent({
				currentEmail: selectedStudent.userMail,
				firstName: forms.editFormState.firstName,
				lastName: forms.editFormState.lastName,
				email: normalizeStudentEmailForRequest(forms.editFormState.email),
				groupId: toApiGroupId(forms.editFormState.groupId),
				picture: forms.editFormState.picture,
			});

			setStudents((previousStudents) => previousStudents.map((student) => (
				student.userMail === selectedStudent.userMail ? updatedStudent : student
			)));

			imageUpload.setTemporaryEditPicturePath(null);
			dialogs.setIsEditDialogOpen(false);
			forms.setSelectedStudentEmail(null);
			setFeedbackMessage('Étudiant modifié avec succès.');
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Mise à jour impossible.');
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleDeleteStudent(): Promise<void> {
		if (!selectedStudent) {
			return;
		}

		setIsSubmitting(true);
		resetStatusMessages();

		try {
			await deleteStudentByEmail(selectedStudent.userMail);

			setStudents((previousStudents) => previousStudents.filter((student) => student.userMail !== selectedStudent.userMail));
			dialogs.setIsDeleteDialogOpen(false);
			forms.setSelectedStudentEmail(null);
			setFeedbackMessage('Étudiant supprimé avec succès.');
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Suppression impossible.');
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleMoveStudent(studentEmail: string, targetGroupId: string): Promise<void> {
		const movedStudent = students.find((student) => student.userMail === studentEmail);

		if (!movedStudent) {
			return;
		}

		const parsedTargetGroupId = toApiGroupId(targetGroupId);

		if ((movedStudent.groupId ?? null) === parsedTargetGroupId) {
			return;
		}

		setIsSubmitting(true);
		resetStatusMessages();

		try {
			const updatedStudent = await updateStudent({
				currentEmail: movedStudent.userMail,
				firstName: movedStudent.firstName,
				lastName: movedStudent.lastName,
				email: movedStudent.userMail,
				groupId: parsedTargetGroupId,
			});

			setStudents((previousStudents) => previousStudents.map((student) => (
				student.userMail === movedStudent.userMail ? updatedStudent : student
			)));

			setFeedbackMessage('Affectation de classe mise à jour.');
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Déplacement impossible.');
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleMoveStudentFromDialog(): Promise<void> {
		if (!selectedStudent || !moveTargetGroupId) {
			return;
		}

		await handleMoveStudent(selectedStudent.userMail, moveTargetGroupId);
		dialogs.setIsMoveDialogOpen(false);
		forms.setSelectedStudentEmail(null);
	}

	async function handleCreateDialogOpenChange(isOpen: boolean): Promise<void> {
		if (isOpen) {
			dialogs.setIsCreateDialogOpen(true);
			return;
		}

		await imageUpload.handleCreateDialogOpenChange(isOpen);
		forms.setCreateFormState(createDefaultFormState());
		dialogs.setIsCreateDialogOpen(false);
	}

	async function handleEditDialogOpenChange(isOpen: boolean): Promise<void> {
		if (isOpen) {
			dialogs.setIsEditDialogOpen(true);
			return;
		}

		await imageUpload.handleEditDialogOpenChange(isOpen);
		dialogs.setIsEditDialogOpen(false);
	}

	function expandAllSections(): void {
		collapsible.setVisibilityForAllSections(
			true,
			listData.sortedVisibleYears,
			listData.visibleGroups,
			listData.shouldShowUnassignedGroup,
		);
	}

	function collapseAllSections(): void {
		collapsible.setVisibilityForAllSections(
			false,
			listData.sortedVisibleYears,
			listData.visibleGroups,
			listData.shouldShowUnassignedGroup,
		);
	}

	return (
		<section className="space-y-4">
			<StudentsListHeader
				searchTerm={filters.searchTerm}
				onSearchChange={filters.setSearchTerm}
				yearFilter={filters.yearFilter}
				onYearFilterChange={filters.setYearFilter}
				groupFilters={filters.groupFilters}
				onGroupFiltersChange={filters.setGroupFilters}
				groups={listData.sortedGroups}
				availableYears={listData.availableYears}
				onCreateClick={openCreateDialog}
				onExpandAll={expandAllSections}
				onCollapseAll={collapseAllSections}
				feedbackMessage={feedbackMessage}
				errorMessage={errorMessage}
			/>

			<div className="space-y-4">
				{listData.sortedVisibleYears.map((year) => {
					const yearGroups = listData.visibleGroupsByYear[year] ?? [];

					return (
						<StudentsYearSection
							key={`year-${year}`}
							year={year}
							yearGroups={yearGroups}
							groupedStudents={listData.groupedStudents}
							openYearKeys={collapsible.openYearKeys}
							openGroupKeys={collapsible.openGroupKeys}
							onYearOpenChange={collapsible.updateYearOpenState}
							onGroupOpenChange={collapsible.updateGroupOpenState}
							onEdit={openEditDialog}
							onMove={openMoveDialog}
							onDelete={openDeleteDialog}
							shouldShowUnassignedGroup={listData.shouldShowUnassignedGroup && year === listData.sortedVisibleYears.at(-1)}
							groupLabel={buildGroupLabel}
						/>
					);
				})}
			</div>

			<CreateStudentDialog
				open={dialogs.isCreateDialogOpen}
				onOpenChange={handleCreateDialogOpenChange}
				groups={listData.sortedGroups}
				formState={forms.createFormState}
				setFormState={forms.setCreateFormState}
				isSubmitting={isSubmitting}
				isUploadingImage={imageUpload.isUploadingImage}
				uploadingImageField={imageUpload.uploadingImageField}
				onSubmit={handleCreateStudent}
				onImageUpload={handleImageUpload}
				groupLabel={buildGroupLabel}
			/>

			<EditStudentDialog
				open={dialogs.isEditDialogOpen}
				onOpenChange={handleEditDialogOpenChange}
				groups={listData.sortedGroups}
				formState={forms.editFormState}
				setFormState={forms.setEditFormState}
				isSubmitting={isSubmitting}
				isUploadingImage={imageUpload.isUploadingImage}
				uploadingImageField={imageUpload.uploadingImageField}
				onSubmit={handleUpdateStudent}
				onImageUpload={handleImageUpload}
				groupLabel={buildGroupLabel}
			/>

			<MoveStudentDialog
				open={dialogs.isMoveDialogOpen}
				onOpenChange={dialogs.setIsMoveDialogOpen}
				selectedStudent={selectedStudent}
				moveCandidateGroups={moveCandidateGroups}
				moveTargetGroupId={moveTargetGroupId}
				setMoveTargetGroupId={setMoveTargetGroupId}
				isSubmitting={isSubmitting}
				onSubmit={handleMoveStudentFromDialog}
				groupLabel={buildGroupLabel}
			/>

			<DeleteStudentConfirmDialog
				open={dialogs.isDeleteDialogOpen}
				onOpenChange={dialogs.setIsDeleteDialogOpen}
				selectedStudent={selectedStudent}
				isSubmitting={isSubmitting}
				onConfirm={handleDeleteStudent}
			/>
		</section>
	);
}
