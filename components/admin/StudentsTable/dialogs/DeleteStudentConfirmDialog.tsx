'use client';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Select as Student } from '@/lib/db/schema/student';

export interface DeleteStudentConfirmDialogProps {
	open: boolean;
	onOpenChange: (isOpen: boolean) => void;
	selectedStudent: Student | null;
	isSubmitting: boolean;
	onConfirm: () => Promise<void>;
}

export function DeleteStudentConfirmDialog({
	open,
	onOpenChange,
	selectedStudent,
	isSubmitting,
	onConfirm,
}: Readonly<DeleteStudentConfirmDialogProps>) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Supprimer cet étudiant ?</AlertDialogTitle>
					<AlertDialogDescription>
						Cette action désactivera le compte de {selectedStudent?.firstName} {selectedStudent?.lastName} ({selectedStudent?.userMail}) via une suppression logique.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Annuler</AlertDialogCancel>
					<AlertDialogAction variant="destructive" disabled={isSubmitting} onClick={() => void onConfirm()}>
						Supprimer
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
