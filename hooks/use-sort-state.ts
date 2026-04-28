import { useState } from 'react';

/** Sort order for a table column. */
export type SortDirection = 'asc' | 'desc';

/** Return value of {@link useSortState}. */
export interface UseSortStateReturn {
  /** Currently sorted column key, or `null` when no column is active. */
  sortColumn: string | null;
  /** Current sort direction for the active column. */
  sortDirection: SortDirection;
  /**
   * Toggles or sets the sort column.
   *
   * Clicking the active column toggles direction; clicking a different column
   * sets it as active with `"asc"` direction.
   *
   * @param column - The column key to sort by.
   */
  handleSort: (column: string) => void;
}

/**
 * Manages sort column and direction state for a data table.
 *
 * Clicking the same column toggles the direction; clicking a different column
 * resets to `"asc"`. Designed to be paired with a sorted data derivation in
 * the consuming component.
 *
 * @returns The current sort state and a {@link UseSortStateReturn.handleSort} callback.
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
