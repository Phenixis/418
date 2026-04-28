'use client';

import { Button } from '@/components/ui/button';
import EtudiantPhoto from '@/components/etudiant/etudiant-photo';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { Select as Student } from '@/lib/db/schema/student';

export interface StudentCardProps {
	student: Student;
	onEdit: (student: Student) => void;
	onMove: (student: Student) => void;
	onDelete: (student: Student) => void;
	showMoveButton?: boolean;
}

export function StudentCard({
	student,
	onEdit,
	onMove,
	onDelete,
	showMoveButton = true,
}: Readonly<StudentCardProps>) {
	return (
		<article className="flex flex-col items-center gap-3 p-3 bg-background-alternative border border-faded rounded-[6px]">
			{/* Photo carrée */}
			<EtudiantPhoto photoUrl={student.picture} prenom={student.firstName} nom={student.lastName} />

			{/* Zone noms : encadré avec bordure propre */}
			<div className="w-full flex flex-col gap-1 border border-faded rounded-[6px] py-1 px-2">
				<p className="text-center truncate">{student.firstName}</p>
				<p className="text-center truncate">{student.lastName.toUpperCase()}</p>
			</div>

			{/* Zone email */}
			<p className="text-xs text-center text-black/60 truncate w-full">
				{student.userMail}
			</p>

			{/* Actions */}
			<div className="flex gap-1 justify-center">
				<Button size="icon-xs" variant="ghost" title="Modifier"
					onClick={() => onEdit(student)}>
					<EditIcon />
				</Button>

				{showMoveButton && (
					<Button size="icon-xs" variant="ghost" title="Déplacer"
						onClick={() => onMove(student)}>
						<SwapHorizIcon />
					</Button>
				)}

				<Button size="icon-xs" variant="ghost" title="Supprimer"
					onClick={() => onDelete(student)}>
					<DeleteIcon />
				</Button>
			</div>
		</article>
	);
}
