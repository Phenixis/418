'use client';

import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';
import { StudentCard } from './StudentCard';
import { StudentsGroupSection } from './StudentsGroupSection';

interface StudentsYearSectionProps {
	year: string;
	yearGroups: Group[];
	groupedStudents: Map<string, Student[]>;
	openYearKeys: Record<string, boolean>;
	openGroupKeys: Record<string, boolean>;
	onYearOpenChange: (year: string, isOpen: boolean) => void;
	onGroupOpenChange: (groupKey: string, isOpen: boolean) => void;
	onEdit: (student: Student) => void;
	onMove: (student: Student) => void;
	onDelete: (student: Student) => void;
	shouldShowUnassignedGroup: boolean;
	groupLabel: (group: Group) => string;
}

export function StudentsYearSection({
	year,
	yearGroups,
	groupedStudents,
	openYearKeys,
	openGroupKeys,
	onYearOpenChange,
	onGroupOpenChange,
	onEdit,
	onMove,
	onDelete,
	shouldShowUnassignedGroup,
	groupLabel,
}: Readonly<StudentsYearSectionProps>) {
	const yearStudentsCount = yearGroups.reduce((totalStudents, group) => {
		return totalStudents + (groupedStudents.get(String(group.groupId)) ?? []).length;
	}, 0);

	return (
		<Collapsible
			className="bg-transparent"
			open={openYearKeys[year] ?? true}
			onOpenChange={(isOpen) => onYearOpenChange(year, isOpen)}
		>
			<div className="flex items-center justify-between gap-2">
				<CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
					<h2>
						Année {year}
					</h2>
				</CollapsibleTrigger>
				<div className="flex items-center gap-2">
					<Badge variant="outline">{yearGroups.length} classes</Badge>
					<Badge variant="outline">{yearStudentsCount} étudiants</Badge>
				</div>
			</div>
			<CollapsibleContent className="space-y-3">
				{yearGroups.map((group) => {
					const groupKey = String(group.groupId);
					const groupStudents = groupedStudents.get(groupKey) ?? [];

					return (
						<StudentsGroupSection
							key={group.groupId}
							group={group}
							students={groupStudents}
							isOpen={openGroupKeys[groupKey] ?? true}
							onOpenChange={(isOpen) => onGroupOpenChange(groupKey, isOpen)}
							onEdit={onEdit}
							onMove={onMove}
							onDelete={onDelete}
							groupLabel={groupLabel}
						/>
					);
				})}
			</CollapsibleContent>
		</Collapsible>
	);
}

interface UnassignedGroupSectionProps {
	students: Student[];
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onEdit: (student: Student) => void;
	onMove: (student: Student) => void;
	onDelete: (student: Student) => void;
}

export function UnassignedGroupSection({
	students,
	isOpen,
	onOpenChange,
	onEdit,
	onMove,
	onDelete,
}: Readonly<UnassignedGroupSectionProps>) {
	return (
		<Collapsible
			className="bg-transparent"
			open={isOpen}
			onOpenChange={onOpenChange}
		>
			<div className="flex items-center justify-between gap-2">
				<CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
					<h2>
						Non assigné
					</h2>
				</CollapsibleTrigger>
				<Badge variant="outline">{students.length}</Badge>
			</div>
			<CollapsibleContent className="pl-3 space-y-3">
				{students.length === 0 ? (
					<p className="text-sm text-black/60">Aucun étudiant non assigné.</p>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
						{students.map((student) => (
							<StudentCard
								key={student.userMail}
								student={student}
								onEdit={onEdit}
								onMove={onMove}
								onDelete={onDelete}
								showMoveButton={false}
							/>
						))}
					</div>
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}
