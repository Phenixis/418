'use client';

import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudentPictureSrc } from '@/lib/utils/student-picture';
import { STUDENT_EMAIL_DOMAIN } from '@/lib/utils/student-email';
import { UNASSIGNED_GROUP_ID, type StudentFormState } from '../students-management-utils';
import type { Select as Group } from '@/lib/db/schema/group';

export interface EditStudentDialogProps {
	open: boolean;
	onOpenChange: (isOpen: boolean) => Promise<void>;
	groups: Group[];
	formState: StudentFormState;
	setFormState: (fn: (prev: StudentFormState) => StudentFormState) => void;
	isSubmitting: boolean;
	isUploadingImage: boolean;
	uploadingImageField: 'create' | 'edit' | null;
	onSubmit: () => Promise<void>;
	onImageUpload: (file: File) => Promise<void>;
	groupLabel: (group: Group) => string;
}

export function EditStudentDialog({
	open,
	onOpenChange,
	groups,
	formState,
	setFormState,
	isSubmitting,
	isUploadingImage,
	uploadingImageField,
	onSubmit,
	onImageUpload,
	groupLabel,
}: Readonly<EditStudentDialogProps>) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="min-w-[min(90vw,36rem)]">
				<DialogHeader>
					<DialogTitle>Modifier un étudiant</DialogTitle>
					<DialogDescription>
						Modifie les informations et la classe de l&apos;étudiant.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-3">
					<div className="grid gap-1">
						<Label htmlFor="edit-first-name">Prénom</Label>
						<Input
							id="edit-first-name"
							value={formState.firstName}
							onChange={(event) => setFormState((previousFormState) => ({
								...previousFormState,
								firstName: event.target.value,
							}))}
						/>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="edit-last-name">Nom</Label>
						<Input
							id="edit-last-name"
							value={formState.lastName}
							onChange={(event) => setFormState((previousFormState) => ({
								...previousFormState,
								lastName: event.target.value,
							}))}
						/>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="edit-email">Email étudiant</Label>
						<InputGroup>
							<InputGroupInput
								id="edit-email"
								placeholder="nom"
								value={formState.email}
								onChange={(event) => setFormState((previousFormState) => ({
									...previousFormState,
									email: event.target.value,
								}))}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>@{STUDENT_EMAIL_DOMAIN}</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="edit-picture">Photo (optionnel)</Label>
						<div className="flex gap-3">
							<div className="flex-1">
								<input
									id="edit-picture"
									type="file"
									accept="image/*"
									disabled={isUploadingImage && uploadingImageField === 'edit'}
									onChange={(event) => {
										const file = event.currentTarget.files?.[0];
										if (file) {
											void onImageUpload(file);
										}
									}}
									className="block h-9 w-full text-sm text-black/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
								/>
							</div>
							{formState.picture && (
								<div className="relative w-20 h-20 rounded-md overflow-hidden border">
									<Image
										src={getStudentPictureSrc(formState.picture) ?? '/icons/silhouette.svg'}
										alt="Photo étudiant"
										fill
										unoptimized
										className="object-cover"
									/>
								</div>
							)}
						</div>
					</div>
					<div className="grid gap-1">
						<Label>Classe</Label>
						<Select
							value={formState.groupId}
							onValueChange={(value) => setFormState((previousFormState) => ({
								...previousFormState,
								groupId: value,
							}))}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Sélectionner une classe" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={UNASSIGNED_GROUP_ID}>Non assigné</SelectItem>
								{groups.map((group) => (
									<SelectItem key={group.groupId} value={String(group.groupId)}>
										{groupLabel(group)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => { void onOpenChange(false); }}>Annuler</Button>
					<Button disabled={isSubmitting} onClick={() => void onSubmit()}>
						Enregistrer
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
