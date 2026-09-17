/**
 * 3D Memory Studio — Funnel 70
 * Database Action Adapter (F67 Integration)
 */

import { DatabaseRegistry } from '../../funnel67/database/databaseRegistry';
import { DatabaseRecord } from '../../funnel67/types';
import { SecurityActionAdapter } from './securityActionAdapter';

export class DatabaseActionAdapter {
  private readonly registry: DatabaseRegistry;
  private currentFilter = '';
  private currentSortField = 'id';
  private currentSortDirection: 'ASC' | 'DESC' = 'ASC';

  constructor(
    registry?: DatabaseRegistry,
    private readonly security: SecurityActionAdapter = new SecurityActionAdapter()
  ) {
    this.registry = registry ?? new DatabaseRegistry();
  }

  public getRecord(id: string): DatabaseRecord | undefined {
    if (!this.security.isTargetPermitted(id)) return undefined;
    const record = this.registry.getRecord(id);
    if (!record || !this.security.isPermitted(record.classification)) {
      return undefined;
    }
    return record;
  }

  public filter(text: string): boolean {
    this.currentFilter = text;
    return true;
  }

  public sort(field: string, direction: 'ASC' | 'DESC' = 'ASC'): boolean {
    this.currentSortField = field;
    this.currentSortDirection = direction;
    return true;
  }

  public getCurrentFilter(): string {
    return this.currentFilter;
  }

  public getCurrentSort(): { field: string; direction: 'ASC' | 'DESC' } {
    return { field: this.currentSortField, direction: this.currentSortDirection };
  }
}
