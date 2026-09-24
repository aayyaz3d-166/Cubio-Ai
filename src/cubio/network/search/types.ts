/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-14: CubiO Search / Discovery Network (Types & Models)
 *
 * Formal specification for sovereign resource indexing, tokenization,
 * relevance ranking, and authorization-aware discovery filtering.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Unauthorized resources MUST NOT appear in search results or discovery previews.
 * - Private resources belonging to User A must never leak to User B.
 * - Discovery filters strictly evaluate caller identity (NET-01) and policy permissions (NET-03).
 */

import { NetworkPermission } from '../authz/types';

export type EntityType =
  | 'FILE'
  | 'SERVICE'
  | 'DEVICE'
  | 'AGENT'
  | 'USER'
  | 'SPACE'
  | 'EMAIL';

export type SearchVisibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';

export interface SearchIndexEntry {
  readonly indexId: string; // IDX_...
  readonly entityType: EntityType;
  readonly entityId: string; // e.g. FILE_..., SRV_..., DEV_..., AGT_..., CUB-XXXXXXXX
  readonly ownerCubId: string; // Sovereign owner CUB-XXXXXXXX
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly visibility: SearchVisibility;
  readonly acl: readonly string[]; // Array of allowed CUB-XXXXXXXX identities
  readonly requiredPermission?: NetworkPermission;
  readonly coordinateUri?: string;
  readonly metadata?: Readonly<Record<string, any>>;
  readonly updatedAt: number;
}

export interface SearchQuery {
  readonly queryText: string;
  readonly types?: readonly EntityType[];
  readonly namespace?: string;
  readonly limit?: number; // default: 20
  readonly offset?: number; // default: 0
  readonly sort?: 'RELEVANCE' | 'RECENCY';
}

export interface SearchResultItem {
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly title: string;
  readonly description: string;
  readonly ownerCubId: string;
  readonly score: number;
  readonly coordinateUri?: string;
  readonly snippet?: string;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface SearchQueryResult {
  readonly query: string;
  readonly totalMatches: number;
  readonly items: readonly SearchResultItem[];
  readonly durationMs: number;
}

export interface IndexResourceInput {
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly ownerCubId: string;
  readonly title: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly visibility?: SearchVisibility;
  readonly acl?: readonly string[];
  readonly requiredPermission?: NetworkPermission;
  readonly coordinateUri?: string;
  readonly metadata?: Record<string, any>;
}
