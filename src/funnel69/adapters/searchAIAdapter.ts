/**
 * 3D Memory Studio — Funnel 69
 * Search AI Adapter (F50 Integration)
 */

import { SearchWorkspaceAdapter, WorkspaceSearchResult } from '../../funnel64/adapters/searchWorkspaceAdapter';
import { MAX_CONTEXT_STATES } from '../context/contextLimits';

const STOP_WORDS = new Set(['find', 'show', 'search', 'what', 'where', 'which', 'who', 'is', 'are', 'the', 'a', 'an', 'in', 'on', 'at', 'of', 'for', 'to', 'from', 'with', 'about', 'all', 'me', 'please']);

export class SearchAIAdapter {
  private readonly adapter = new SearchWorkspaceAdapter();

  public async searchPermitted(query: string): Promise<readonly WorkspaceSearchResult[]> {
    const rawResults = await this.adapter.search(query);
    if (rawResults.length > 0) {
      return rawResults.slice(0, MAX_CONTEXT_STATES);
    }

    // Extract significant keywords and try searching each
    const words = query
      .toLowerCase()
      .split(/[^a-z0-9_-]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    for (const word of words) {
      const match = await this.adapter.search(word);
      if (match.length > 0) {
        return match.slice(0, MAX_CONTEXT_STATES);
      }
    }

    // Fallback: return general permitted research states
    const fallback = await this.adapter.search('');
    return fallback.slice(0, MAX_CONTEXT_STATES);
  }

  public async getPermittedStateIds(query: string): Promise<readonly string[]> {
    const results = await this.searchPermitted(query);
    return results.map((r) => r.stateId);
  }
}
