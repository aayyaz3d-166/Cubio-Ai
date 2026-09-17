/**
 * 3D Memory Studio — Funnel 64
 * Search Workspace Adapter
 *
 * Routes workspace search through F50 permitted indexed data.
 * Caps displayed search results at 50 items.
 */

import { DimensionalInformationState } from '../../funnel49/types';
import { getStandardInformationUniverseFixture } from '../../funnel49/model';

export const MAX_SEARCH_RESULTS = 50;

export interface WorkspaceSearchResult {
  resultId: string;
  stateId: string;
  title: string;
  type: string;
  score: number;
}

export class SearchWorkspaceAdapter {
  public async search(query: string): Promise<readonly WorkspaceSearchResult[]> {
    const q = query.toLowerCase().trim();
    const fixture = getStandardInformationUniverseFixture();
    const greenStates = fixture.states.filter((s) => s.classification === 'GREEN');

    if (!q) {
      return greenStates.slice(0, MAX_SEARCH_RESULTS).map((s) => ({
        resultId: `res-${s.stateId}`,
        stateId: s.stateId,
        title: s.entityName || s.recordId,
        type: s.category,
        score: 1.0,
      }));
    }

    const matched = greenStates.filter(
      (s) =>
        s.stateId.toLowerCase().includes(q) ||
        s.entityName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.semanticTerms.some((t) => t.toLowerCase().includes(q))
    );

    return matched.slice(0, MAX_SEARCH_RESULTS).map((s, idx) => ({
      resultId: `res-${s.stateId}-${idx}`,
      stateId: s.stateId,
      title: s.entityName || s.recordId,
      type: s.category,
      score: Math.max(0.1, 1.0 - idx * 0.05),
    }));
  }
}
