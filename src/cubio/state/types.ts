/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 2: CubiO State Model Types
 *
 * Formal specification of CubiOState:
 * ID, Position, Dimension, Properties, Relationships, Memory, Timestamp, Parent, Children.
 *
 * Invariant: Deeply immutable, deterministic checksums, zero unobserved mutations.
 */

import { CubiODimension } from '../types';
export type { CubiODimension };

export type CubiORelationshipType =
  | 'PARENT_OF'
  | 'CHILD_OF'
  | 'ABOVE'
  | 'BELOW'
  | 'LEFT_OF'
  | 'RIGHT_OF'
  | 'FRONT_OF'
  | 'BEHIND'
  | 'CONNECTED_TO'
  | 'CONTAINS'
  | 'INSIDE'
  | 'NEAR'
  | 'FAR'
  | 'RESONATES_WITH'
  | 'DEPENDS_ON'
  | 'TRANSFORMS_TO'
  | 'HYPER_PROJECTED_FROM';

export interface CubiORelationship {
  readonly relationshipId: string;
  readonly targetStateId: string;
  readonly type: CubiORelationshipType;
  readonly weight: number;
  readonly bidirectional: boolean;
  readonly metadata?: Readonly<Record<string, any>>;
  readonly checksum: string;
}

export interface CubiOMemoryRef {
  readonly memoryId: string;
  readonly key: string;
  readonly type: 'EPISODIC' | 'SPATIAL' | 'HOLOGRAPHIC' | 'SYSTEM';
  readonly resonanceIndex: number;
  readonly timestamp: number;
  readonly payloadChecksum: string;
}

export interface CubiOState {
  readonly id: string;
  readonly position: readonly number[]; // D2 (2D), D3 (3D), D4 (4D), D5 (5D), D6 (6D), D7 (7D)
  readonly dimension: CubiODimension;
  readonly properties: Readonly<Record<string, any>>;
  readonly relationships: readonly CubiORelationship[];
  readonly memory: readonly CubiOMemoryRef[];
  readonly timestamp: number;
  readonly parent: string | null;
  readonly children: readonly string[];
  readonly checksum: string;
}

export interface CubiOStateTransition {
  readonly transitionId: string;
  readonly stateId: string;
  readonly previousChecksum: string;
  readonly nextChecksum: string;
  readonly action: string;
  readonly actor: string;
  readonly timestamp: number;
  readonly deltaDescription: string;
}

export interface CubiOStateUniverseSnapshot {
  readonly snapshotId: string;
  readonly universeChecksum: string;
  readonly timestamp: number;
  readonly states: Readonly<Record<string, CubiOState>>;
  readonly rootStateIds: readonly string[];
  readonly totalStateCount: number;
  readonly transitionsHistory: readonly CubiOStateTransition[];
}

export interface CubiOStateDiff {
  readonly diffId: string;
  readonly addedStateIds: readonly string[];
  readonly removedStateIds: readonly string[];
  readonly modifiedStateIds: readonly string[];
  readonly relationshipChangesCount: number;
  readonly isIdentical: boolean;
}

export interface CubiOStateValidationReport {
  readonly isValid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly issues: readonly string[];
  readonly universeChecksum: string;
}
