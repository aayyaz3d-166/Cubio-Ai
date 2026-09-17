/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F8: CubiO Intelligence Memory Engine (Types & Contracts)
 *
 * Master specification for tiered Short-Term & Long-Term memory,
 * associative relationship links, semantic vector recall, and consolidation.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { DetectedPatternEntry } from '../pattern/types';

export type MemoryTier =
  | 'SHORT_TERM'
  | 'LONG_TERM'
  | 'EPISODIC'
  | 'SEMANTIC'
  | 'HOLOGRAPHIC';

export interface AssociativeMemoryNode {
  readonly memoryId: string;
  readonly tier: MemoryTier;
  readonly key: string;
  readonly dimension: CubiODimension;
  readonly associatedStateIds: readonly string[];
  readonly associatedPatternIds: readonly string[];
  readonly semanticVector: readonly number[];
  readonly resonanceScore: number; // 0..100
  readonly accessFrequency: number;
  readonly tags: readonly string[];
  readonly payload: any;
  readonly payloadChecksum: string;
  readonly timestamp: number;
  readonly lastAccessedAt: number;
}

export type MemoryAssociationType =
  | 'ASSOCIATED_WITH'
  | 'DERIVED_FROM'
  | 'REINFORCES'
  | 'SUPERSEDES'
  | 'CO_RESONATES';

export interface MemoryAssociationLink {
  readonly linkId: string;
  readonly sourceMemoryId: string;
  readonly targetMemoryId: string;
  readonly associationType: MemoryAssociationType;
  readonly weight: number;
  readonly timestamp: number;
}

export interface MemoryRecallQuery {
  readonly queryText?: string;
  readonly targetDimension?: CubiODimension;
  readonly queryVector?: readonly number[];
  readonly associatedStateId?: string;
  readonly associatedPatternId?: string;
  readonly tags?: readonly string[];
  readonly tier?: MemoryTier | 'ALL';
  readonly minResonance?: number;
  readonly limit?: number;
}

export interface MemoryRecallResult {
  readonly queryId: string;
  readonly retrievedMemories: readonly AssociativeMemoryNode[];
  readonly totalRecallCount: number;
  readonly relevanceScores: readonly number[];
  readonly retrievalDurationMs: number;
  readonly recallChecksum: string;
  readonly timestamp: number;
}

export interface ConsolidationReport {
  readonly consolidationId: string;
  readonly promotedCount: number;
  readonly evictedCount: number;
  readonly stmTotalCount: number;
  readonly ltmTotalCount: number;
  readonly timestamp: number;
}

export interface MemorySnapshotReport {
  readonly stmCount: number;
  readonly ltmCount: number;
  readonly totalAssociations: number;
  readonly memoryMerkleChecksum: string;
  readonly timestamp: number;
}
