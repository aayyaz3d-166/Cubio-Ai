/**
 * 3D Memory Studio — Funnel 46
 * Hook: useStudioSession
 *
 * Encapsulates the complete Studio session snapshot and closure lifecycle.
 */

import { useMemo } from 'react';
import { NormalizedStudioDataset } from '../../funnel45/adapters';
import { createStudioSessionSnapshot, closeStudioSession } from '../../funnel45/model';
import {
  StudioPanelId,
  StudioRenderBudget,
  StudioFilterCriteria,
  StudioSessionSnapshot,
  StudioClosure,
} from '../../funnel45/types';
import { createDefaultRenderBudget } from '../../funnel45/selectors';

export function useStudioSession(
  dataset: NormalizedStudioDataset,
  activePanel: StudioPanelId,
  selectedStateId?: string,
  filters: StudioFilterCriteria = { pageIndex: 0, pageSize: 20 },
  renderBudget: StudioRenderBudget = createDefaultRenderBudget()
) {
  const session: StudioSessionSnapshot = useMemo(() => {
    return createStudioSessionSnapshot(dataset, activePanel, selectedStateId, filters, renderBudget);
  }, [dataset, activePanel, selectedStateId, filters, renderBudget]);

  const closure: StudioClosure = useMemo(() => {
    return closeStudioSession(session, 0);
  }, [session]);

  return {
    session,
    closure,
    renderBudget,
  };
}
