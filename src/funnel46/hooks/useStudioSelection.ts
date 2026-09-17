/**
 * 3D Memory Studio — Funnel 46
 * Hook: useStudioSelection
 *
 * Central source of truth for the active selected state across all Studio panels.
 */

import { useState, useCallback, useMemo } from 'react';
import { NormalizedStudioDataset, NormalizedStudioRecord } from '../../funnel45/adapters';
import { StudioPanelId } from '../../funnel45/types';
import { StudioBreadcrumb } from '../types';

export function useStudioSelection(
  dataset: NormalizedStudioDataset,
  initialStateId?: string
) {
  const [selectedStateId, setSelectedStateId] = useState<string>(() => {
    return initialStateId || dataset.records[0]?.stateId || '';
  });

  const [activePanel, setActivePanel] = useState<StudioPanelId>('UNIVERSE_OVERVIEW');

  const selectedRecord: NormalizedStudioRecord | undefined = useMemo(() => {
    if (!selectedStateId) return dataset.records[0];
    return (
      dataset.records.find((r) => r.stateId === selectedStateId || r.recordId === selectedStateId) ||
      dataset.records[0]
    );
  }, [dataset, selectedStateId]);

  const selectState = useCallback((stateId: string) => {
    setSelectedStateId(stateId);
  }, []);

  const breadcrumb: StudioBreadcrumb = useMemo(() => {
    return {
      universeId: dataset.universeId,
      dimension: dataset.dimension,
      stateId: selectedRecord?.stateId,
      recordId: selectedRecord?.recordId,
      panelId: activePanel,
    };
  }, [dataset, selectedRecord, activePanel]);

  return {
    selectedStateId: selectedRecord?.stateId || '',
    selectedRecord,
    selectState,
    activePanel,
    setActivePanel,
    breadcrumb,
  };
}
