'use client';

import { useMemo, useState } from 'react';
import ResourceTable, { ResourceTableItem } from '@/components/cours/ResourceTable';
import FiltresCours, { CourseFilter } from '@/components/cours/FiltresCours';
import { Input } from '@/components/ui/input';
import { useSortState } from '@/hooks/use-sort-state';
import { CourseStatus } from '@/components/cours/course.types';

interface ResourceTableClientProps {
  resourceItems: ResourceTableItem[];
  sessionSubjectsByResourceId?: Record<string, string[]>;
}

function getResourceStatus(resourceItem: ResourceTableItem): CourseStatus | null {
  if (resourceItem.ongoingSessionCount > 0) {
    return CourseStatus.EN_COURS;
  }

  if (resourceItem.upcomingSessionCount > 0) {
    return CourseStatus.A_VENIR;
  }

  if (resourceItem.pastSessionCount > 0) {
    return CourseStatus.TERMINE;
  }

  return null;
}

export default function ResourceTableClient({
  resourceItems,
  sessionSubjectsByResourceId = {},
}: Readonly<ResourceTableClientProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<CourseFilter[]>([]);
  const { sortColumn, sortDirection, handleSort } = useSortState();

  const filteredAndSortedItems = useMemo(() => {
    let result = resourceItems;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        // Search in resource name
        if (item.resource.subject.toLowerCase().includes(query)) {
          return true;
        }
        // Search in session names
        const sessionSubjects = sessionSubjectsByResourceId[item.resource.resourceId] ?? [];
        return sessionSubjects.some((subject) =>
          subject.toLowerCase().includes(query)
        );
      });
    }

    // Filter by status
    if (statusFilters.length > 0) {
      result = result.filter((item) => {
        const status = getResourceStatus(item);
        if (status === null && statusFilters.includes('Aucune séance' as CourseFilter)) {
          return true;
        }
        if (status === CourseStatus.EN_COURS && statusFilters.includes('En cours' as CourseFilter)) {
          return true;
        }
        if (status === CourseStatus.A_VENIR && statusFilters.includes('À venir' as CourseFilter)) {
          return true;
        }
        if (status === CourseStatus.TERMINE && statusFilters.includes('Terminé' as CourseFilter)) {
          return true;
        }
        return false;
      });
    }

    // Sort
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortColumn === 'subject') {
          aValue = a.resource.subject;
          bValue = b.resource.subject;
        } else if (sortColumn === 'totalSessionCount') {
          aValue = a.totalSessionCount;
          bValue = b.totalSessionCount;
        } else if (sortColumn === 'ongoingSessionCount') {
          aValue = a.ongoingSessionCount;
          bValue = b.ongoingSessionCount;
        } else if (sortColumn === 'upcomingSessionCount') {
          aValue = a.upcomingSessionCount;
          bValue = b.upcomingSessionCount;
        } else if (sortColumn === 'pastSessionCount') {
          aValue = a.pastSessionCount;
          bValue = b.pastSessionCount;
        } else if (sortColumn === 'nextSessionStartAt') {
          aValue = a.nextSessionStartAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
          bValue = b.nextSessionStartAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === 'asc' ? comparison : -comparison;
        }

        const comparison = aValue - bValue;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [resourceItems, searchQuery, statusFilters, sortColumn, sortDirection, sessionSubjectsByResourceId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <Input
          placeholder="Rechercher une ressource…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <FiltresCours
          selectedFilters={statusFilters}
          onFilterChange={setStatusFilters}
        />
      </div>
      <ResourceTable
        resourceItems={filteredAndSortedItems}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
    </div>
  );
}
