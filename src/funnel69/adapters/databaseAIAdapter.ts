/**
 * 3D Memory Studio — Funnel 69
 * Database AI Adapter (F67 Integration)
 */

import { DatabaseRegistry } from '../../funnel67/database/databaseRegistry';
import { DatabaseRecord } from '../../funnel67/types';
import { isPermittedInWorkspace } from '../../funnel64/adapters/securityWorkspaceAdapter';

export class DatabaseAIAdapter {
  private readonly registry: DatabaseRegistry;

  constructor(registry?: DatabaseRegistry) {
    this.registry = registry ?? new DatabaseRegistry();
  }

  public getRecord(id: string): DatabaseRecord | undefined {
    const record = this.registry.getRecord(id);
    if (!record) return undefined;
    if (!isPermittedInWorkspace(record.classification)) {
      return undefined;
    }
    return record;
  }

  public getPermittedRecords(): readonly DatabaseRecord[] {
    return this.registry.getAll().filter((r) => isPermittedInWorkspace(r.classification));
  }

  public getDatabaseSummary(): { totalPermitted: number; states: number; relationships: number; clusters: number } {
    const records = this.getPermittedRecords();
    return {
      totalPermitted: records.length,
      states: records.filter((r) => r.type.startsWith('STATE')).length,
      relationships: records.filter((r) => r.type.startsWith('REL')).length,
      clusters: records.filter((r) => r.type.startsWith('CLUSTER')).length,
    };
  }
}
