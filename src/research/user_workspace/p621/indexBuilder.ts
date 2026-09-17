/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.21: Deterministic Search Index Builder
 *
 * Constructs immutable search index catalogs from authoritative workspace state.
 * Derived index structure only — never competes with or mutates Reality authority.
 */

import {
  SearchIndex,
  SearchIndexEntry,
  SearchResultType,
} from './types';
import {
  generateDeterministicIndexId,
  generateDeterministicEntryId,
  deterministicHash,
} from './determinism';

export class SearchIndexBuilder {
  private workspaceId: string;
  private entries: SearchIndexEntry[] = [];

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  public addEntry(params: {
    sourceId: string;
    sourceType: SearchResultType;
    name: string;
    spaceId: string;
    experimentId?: string;
    ownerId: string;
    accessLevel?: 'PUBLIC' | 'SHARED' | 'PRIVATE' | 'RESTRICTED';
    lineageId: string;
    checksum: string;
    certainty?: 'EXACT' | 'CONSTRAINED' | 'AMBIGUOUS' | 'UNKNOWN';
    coordinates?: readonly [number, number, number];
    createdAt?: number;
    metadata?: Readonly<Record<string, unknown>>;
  }): this {
    const entryId = generateDeterministicEntryId(params.sourceType, params.sourceId);
    const accessLevel = params.accessLevel ?? 'PUBLIC';
    const certainty = params.certainty ?? 'EXACT';
    const createdAt = params.createdAt ?? 0;
    const metadata = params.metadata ? Object.freeze({ ...params.metadata }) : Object.freeze({});

    const entry: SearchIndexEntry = Object.freeze({
      entryId,
      sourceId: params.sourceId,
      sourceType: params.sourceType,
      name: params.name,
      spaceId: params.spaceId,
      experimentId: params.experimentId,
      ownerId: params.ownerId,
      accessLevel,
      lineageId: params.lineageId,
      checksum: params.checksum,
      certainty,
      coordinates: params.coordinates ? (Object.freeze([...params.coordinates]) as [number, number, number]) : undefined,
      createdAt,
      metadata,
    });

    this.entries.push(entry);
    return this;
  }

  public build(): SearchIndex {
    // Sort entries deterministically by sourceType then sourceId
    const sortedEntries = [...this.entries].sort((a, b) => {
      const typeCmp = a.sourceType.localeCompare(b.sourceType);
      if (typeCmp !== 0) return typeCmp;
      return a.sourceId.localeCompare(b.sourceId);
    });

    const indexId = generateDeterministicIndexId(this.workspaceId, sortedEntries.length);

    const raw = JSON.stringify([
      '6.21.0',
      indexId,
      this.workspaceId,
      sortedEntries.map((e) => [e.entryId, e.sourceId, e.checksum, e.lineageId]),
    ]);
    const indexChecksum = deterministicHash(raw);

    return Object.freeze({
      indexId,
      schemaVersion: '6.21.0',
      workspaceId: this.workspaceId,
      entries: Object.freeze(sortedEntries),
      entryCount: sortedEntries.length,
      indexChecksum,
      createdAt: 0,
    });
  }
}
