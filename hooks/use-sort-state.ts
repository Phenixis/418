import { useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface UseSortStateReturn {
  sortColumn: string | null;
  sortDirection: SortDirection;
  handleSort: (column: string) => void;
}

/**
 * Manages sort state for tables.
 * - If clicking the same column, toggles direction.
 * - If clicking a different column, sets to 'asc'.
 */
export function useSortState(): UseSortStateReturn {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with 'asc'
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return { sortColumn, sortDirection, handleSort };
}
