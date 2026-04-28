'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SelectGroup from '@/components/cours/creation/select-group';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { ALL_FILTER_VALUE } from '../students-management-utils';
import type { Select as Group } from '@/lib/db/schema/group';

export interface StudentsListHeaderProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	yearFilter: string;
	onYearFilterChange: (value: string) => void;
	groupFilters: string[];
	onGroupFiltersChange: (values: string[]) => void;
	groups: Group[];
	availableYears: string[];
	onCreateClick: () => void;
	onExpandAll: () => void;
	onCollapseAll: () => void;
	feedbackMessage: string | null;
	errorMessage: string | null;
}

export function StudentsListHeader({
	searchTerm,
	onSearchChange,
	yearFilter,
	onYearFilterChange,
	groupFilters,
	onGroupFiltersChange,
	groups,
	availableYears,
	onCreateClick,
	onExpandAll,
	onCollapseAll,
	feedbackMessage,
	errorMessage,
}: Readonly<StudentsListHeaderProps>) {
	return (
		<>
			<div className="rounded-lg p-3 space-y-2">
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
					<Input
						id="search-student"
						placeholder="Recherche (nom ou email)"
						value={searchTerm}
						onChange={(event) => onSearchChange(event.target.value)}
						className="h-10 w-full text-sm"
					/>

					<Select value={yearFilter} onValueChange={onYearFilterChange}>
						<SelectTrigger className="h-10 w-full text-sm data-[size=default]:h-10 data-[placeholder]:text-black/70">
							<SelectValue placeholder="Toutes les années" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_FILTER_VALUE}>Toutes les années</SelectItem>
							{availableYears.map((year) => (
								<SelectItem key={year} value={year}>
									Année {year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<SelectGroup
						groups={groups}
						groupsSelected={groupFilters}
						setGroupsSelected={onGroupFiltersChange}
						hideLabel
						displayMode="summary"
						placeholder="Toutes les classes"
						className="mb-0"
					/>
				</div>

				<div className="flex flex-wrap items-center justify-end gap-1.5">
					<Button className="h-10 whitespace-nowrap px-3 text-sm" variant="outline" disabled title="L'import CSV sera branché dans une prochaine étape.">
						<FileUploadIcon /> Importer des étudiants
					</Button>
					<Button className="h-10 whitespace-nowrap px-3 text-sm" variant="outline" onClick={onExpandAll}>
						Tout déplier
					</Button>
					<Button className="h-10 whitespace-nowrap px-3 text-sm" variant="outline" onClick={onCollapseAll}>
						Tout replier
					</Button>
					<Button className="h-10 whitespace-nowrap px-3 text-sm" onClick={onCreateClick}>
						<AddIcon /> Ajouter un étudiant
					</Button>
				</div>
			</div>

			{feedbackMessage && (
				<p className="rounded-md border border-green-300/80 bg-green-50 px-3 py-2 text-sm text-green-800">{feedbackMessage}</p>
			)}

			{errorMessage && (
				<p className="rounded-md border border-red-300/80 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
			)}
		</>
	);
}
