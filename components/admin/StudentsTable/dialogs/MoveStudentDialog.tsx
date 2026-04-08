'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';

interface MoveStudentDialogProps {
	open: boolean;
	onOpenChange: (isOpen: boolean) => void;
	selectedStudent: Student | null;
	moveCandidateGroups: Group[];
	moveTargetGroupId: string;
	setMoveTargetGroupId: (id: string) => void;
	isSubmitting: boolean;
	onSubmit: () => Promise<void>;
	groupLabel: (group: Group) => string;
}

export function MoveStudentDialog({
	open,
	onOpenChange,
	selectedStudent,
	moveCandidateGroups,
	moveTargetGroupId,
	setMoveTargetGroupId,
	isSubmitting,
	onSubmit,
	groupLabel,
}: Readonly<MoveStudentDialogProps>) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-[min(90vw,36rem)]">
				<DialogHeader>
					<DialogTitle>Déplacer un étudiant</DialogTitle>
					<DialogDescription>
						Déplacement limité aux classes de la même année.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-2">
					<p className="text-sm text-black/70">
						{selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
					</p>
					<Label>Nouvelle classe</Label>
					<Select value={moveTargetGroupId} onValueChange={setMoveTargetGroupId}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Sélectionner une classe" />
						</SelectTrigger>
						<SelectContent>
							{moveCandidateGroups.map((group) => (
								<SelectItem key={group.groupId} value={String(group.groupId)}>
									{groupLabel(group)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
					<Button disabled={isSubmitting || !moveTargetGroupId} onClick={() => void onSubmit()}>
						Déplacer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
