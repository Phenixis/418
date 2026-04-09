'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { StudentCard } from './StudentCard';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';

interface StudentsGroupSectionProps {
	group: Group;
	students: Student[];
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onEdit: (student: Student) => void;
	onMove: (student: Student) => void;
	onDelete: (student: Student) => void;
	groupLabel: (group: Group) => string;
}

export function StudentsGroupSection({
	group,
	students,
	isOpen,
	onOpenChange,
	onEdit,
	onMove,
	onDelete,
	groupLabel,
}: Readonly<StudentsGroupSectionProps>) {
	return (
		<Collapsible
			className="bg-transparent pl-4 space-y-2"
			open={isOpen}
			onOpenChange={onOpenChange}
		>
			<div className="flex items-center justify-between gap-2">
				<CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
					<h3>
						Classe {groupLabel(group)}
					</h3>
				</CollapsibleTrigger>
				<Badge variant="outline">{students.length}</Badge>
			</div>
			<CollapsibleContent className="space-y-3">
				{students.length === 0 ? (
					<p className="text-sm text-black/60">Aucun étudiant dans cette classe.</p>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{students.map((student) => (
							<StudentCard
								key={student.userMail}
								student={student}
								onEdit={onEdit}
								onMove={onMove}
								onDelete={onDelete}
							/>
						))}
					</div>
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}
