/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-14: In-Memory Search Repository
 */

import {
  SearchIndexEntry,
  EntityType,
  SearchQuery,
} from '../types';
import { ISearchRepository } from './types';

export class MemorySearchRepository implements ISearchRepository {
  private entriesByKey: Map<string, SearchIndexEntry> = new Map(); // `${entityType}:${entityId}` -> entry

  private buildKey(entityType: EntityType, entityId: string): string {
    return `${entityType}:${entityId.trim()}`;
  }

  public async upsertEntry(entry: SearchIndexEntry): Promise<void> {
    const key = this.buildKey(entry.entityType, entry.entityId);
    this.entriesByKey.set(key, Object.freeze({ ...entry }));
  }

  public async removeEntry(entityType: EntityType, entityId: string): Promise<boolean> {
    const key = this.buildKey(entityType, entityId);
    return this.entriesByKey.delete(key);
  }

  public async getEntry(
    entityType: EntityType,
    entityId: string
  ): Promise<SearchIndexEntry | undefined> {
    const key = this.buildKey(entityType, entityId);
    return this.entriesByKey.get(key);
  }

  public async search(query: SearchQuery): Promise<readonly SearchIndexEntry[]> {
    const rawTerms = query.queryText.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches: SearchIndexEntry[] = [];

    for (const entry of this.entriesByKey.values()) {
      if (query.types && query.types.length > 0 && !query.types.includes(entry.entityType)) {
        continue;
      }

      if (rawTerms.length === 0) {
        matches.push(entry);
        continue;
      }

      const searchableText = `${entry.title} ${entry.description} ${entry.keywords.join(' ')} ${entry.ownerCubId}`.toLowerCase();
      const hasMatch = rawTerms.some((term) => searchableText.includes(term));

      if (hasMatch) {
        matches.push(entry);
      }
    }

    return Object.freeze(matches);
  }

  public async clearIndex(): Promise<void> {
    this.entriesByKey.clear();
  }
}
