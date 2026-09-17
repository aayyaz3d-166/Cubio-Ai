/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.10: Workspace Index Repository & Service
 *
 * User-isolated index store for fast search, filter, and sort across all workspace entities.
 */

import { IndexRecord, WorkspaceSearchQuery, SortSpec, WorkspaceIndexState } from './types';
import { SearchEngine } from './searchEngine';
import { FilterEngine } from './filterEngine';
import { SortEngine } from './sortEngine';
import { deterministicHash } from './determinism';

export class WorkspaceIndex {
  private userId: string;
  private recordsMap: Map<string, IndexRecord> = new Map();

  constructor(userId = 'USR_RESEARCHER_01') {
    this.userId = userId;
  }

  public getUserId(): string {
    return this.userId;
  }

  public addRecord(record: IndexRecord): void {
    if (record.userId !== this.userId) {
      throw new Error(`User isolation violation: cannot add record owned by ${record.userId} to user ${this.userId}'s index.`);
    }
    this.recordsMap.set(record.recordId, record);
  }

  public updateRecord(record: IndexRecord): void {
    if (!this.recordsMap.has(record.recordId)) {
      throw new Error(`Record ${record.recordId} does not exist in index.`);
    }
    this.recordsMap.set(record.recordId, record);
  }

  public removeRecord(recordId: string): boolean {
    return this.recordsMap.delete(recordId);
  }

  public getRecord(recordId: string): IndexRecord | undefined {
    return this.recordsMap.get(recordId);
  }

  public listRecords(): readonly IndexRecord[] {
    return Object.freeze(Array.from(this.recordsMap.values()));
  }

  public query(query: WorkspaceSearchQuery = {}, sortSpec?: SortSpec): readonly IndexRecord[] {
    let results = this.listRecords();

    // 1. Search text
    if (query.queryText) {
      results = SearchEngine.search(results, query.queryText);
    }

    // 2. Filters
    results = FilterEngine.filter(results, query);

    // 3. Sorting
    if (sortSpec) {
      results = SortEngine.sort(results, sortSpec);
    } else {
      results = SortEngine.sort(results, { primaryField: 'NAME', direction: 'ASC' });
    }

    return results;
  }

  public calculateIndexChecksum(): string {
    const sorted = [...this.recordsMap.values()].sort((a, b) => a.recordId.localeCompare(b.recordId));
    const raw = JSON.stringify([
      this.userId,
      '6.10.0',
      sorted.map((r) => [r.recordId, r.checksumRef, r.status, r.isPinned, r.tags]),
    ]);
    return deterministicHash(raw);
  }

  public getIndexState(): WorkspaceIndexState {
    const records = Object.freeze(
      Array.from(this.recordsMap.values()).sort((a, b) => a.recordId.localeCompare(b.recordId))
    );
    const indexChecksum = this.calculateIndexChecksum();

    return Object.freeze({
      userId: this.userId,
      schemaVersion: '6.10.0',
      records,
      indexChecksum,
      lastReindexedAt: 0,
    });
  }

  public clear(): void {
    this.recordsMap.clear();
  }
}
