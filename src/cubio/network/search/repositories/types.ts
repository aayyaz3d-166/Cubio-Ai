/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-14: Search Repository Interfaces
 */

import {
  SearchIndexEntry,
  EntityType,
  SearchQuery,
} from '../types';

export interface ISearchRepository {
  upsertEntry(entry: SearchIndexEntry): Promise<void>;
  removeEntry(entityType: EntityType, entityId: string): Promise<boolean>;
  getEntry(entityType: EntityType, entityId: string): Promise<SearchIndexEntry | undefined>;
  search(query: SearchQuery): Promise<readonly SearchIndexEntry[]>;
  clearIndex(): Promise<void>;
}
