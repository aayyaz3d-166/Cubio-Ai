/**
 * 3D Memory Studio — Funnel 70
 * Search Action Adapter (F50 Integration)
 */

import { SearchWorkspaceAdapter } from '../../funnel64/adapters/searchWorkspaceAdapter';
import { SecurityActionAdapter } from './securityActionAdapter';

export class SearchActionAdapter {
  private readonly adapter = new SearchWorkspaceAdapter();

  constructor(private readonly security: SecurityActionAdapter = new SecurityActionAdapter()) {}

  public async search(query: string): Promise<readonly string[]> {
    if (!this.security.isTargetPermitted(query)) {
      return [];
    }
    const results = await this.adapter.search(query);
    return results.map((r) => r.stateId);
  }
}
