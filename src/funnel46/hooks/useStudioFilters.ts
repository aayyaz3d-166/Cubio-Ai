/**
 * 3D Memory Studio — Funnel 46
 * Hook: useStudioFilters
 */

import { useState, useCallback } from 'react';
import { StudioFilterCriteria } from '../../funnel45/types';
import { createDefaultFilterCriteria } from '../../funnel45/selectors';

export function useStudioFilters(initialCriteria: Partial<StudioFilterCriteria> = {}) {
  const [filters, setFilters] = useState<StudioFilterCriteria>(() => ({
    ...createDefaultFilterCriteria(),
    ...initialCriteria,
  }));

  const updateFilters = useCallback((updates: Partial<StudioFilterCriteria>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
      pageIndex: updates.pageIndex !== undefined ? updates.pageIndex : 0, // reset pageIndex on filter change unless pageIndex specifically passed
    }));
  }, []);

  const setPageIndex = useCallback((pageIndex: number) => {
    setFilters((prev) => ({
      ...prev,
      pageIndex,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilterCriteria());
  }, []);

  return {
    filters,
    updateFilters,
    setPageIndex,
    resetFilters,
  };
}
