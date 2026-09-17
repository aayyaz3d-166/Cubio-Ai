/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 8: CubiO Emulator v0.1 — Headless Control Layer Contracts
 *
 * Strongly-typed command protocol, payloads, execution result schemas,
 * and 369 validation contracts for programmatic simulation control.
 */

import { CubiODimension, CubiOHarmonic369 } from '../types';
import {
  CubiOState,
  CubiORelationship,
  CubiORelationshipType,
  CubiOStateTransition,
  CubiOStateUniverseSnapshot,
} from '../state/types';
import {
  CubiOMemoryTier,
  MemoryIndexEntry,
  MemoryBlock,
  MemoryQueryFilter,
} from '../memory/types';
import { DimensionTransitionResult } from '../dimension/types';

// ─── 1. COMMAND TYPES ────────────────────────────────────────────────────

export type EmulatorCommandType =
  | 'CREATE_STATE'
  | 'READ_STATE'
  | 'UPDATE_STATE'
  | 'REMOVE_STATE'
  | 'CREATE_RELATION'
  | 'STORE_MEMORY'
  | 'SEARCH_MEMORY'
  | 'TRANSFORM_STATE'
  | 'GET_STATE_HISTORY'
  | 'GET_UNIVERSE_SNAPSHOT';

// ─── 2. COMMAND PAYLOADS ─────────────────────────────────────────────────

export interface CreateStatePayload {
  readonly label: string;
  readonly position?: readonly number[];
  readonly dimension?: CubiODimension;
  readonly properties?: Readonly<Record<string, any>>;
  readonly parentId?: string | null;
  readonly customId?: string;
}

export interface ReadStatePayload {
  readonly stateId: string;
}

export interface UpdateStatePayload {
  readonly stateId: string;
  readonly properties?: Readonly<Record<string, any>>;
  readonly position?: readonly number[];
  readonly dimension?: CubiODimension;
  readonly reason?: string;
}

export interface RemoveStatePayload {
  readonly stateId: string;
  readonly reason?: string;
}

export interface CreateRelationPayload {
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly relationType: CubiORelationshipType;
  readonly weight?: number;
  readonly bidirectional?: boolean;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface StoreMemoryPayload<T = any> {
  readonly tier: CubiOMemoryTier;
  readonly key: string;
  readonly payload: T;
  readonly dimension?: CubiODimension;
  readonly tags?: readonly string[];
  readonly resonanceIndex?: number;
}

export interface SearchMemoryPayload extends MemoryQueryFilter {}

export interface TransformStatePayload {
  readonly stateId: string;
  readonly targetDimension: CubiODimension;
  readonly rotationAngles?: readonly number[]; // [yaw, pitch, roll]
  readonly scaleFactor?: number;
}

export interface GetStateHistoryPayload {
  readonly stateId: string;
}

export interface GetUniverseSnapshotPayload {}

// ─── 3. COMMAND ENVELOPE ─────────────────────────────────────────────────

export interface EmulatorCommand<T = any> {
  readonly commandId: string;
  readonly type: EmulatorCommandType;
  readonly payload: T;
  readonly timestamp: number;
  readonly actor?: string;
  readonly metadata?: Readonly<Record<string, any>>;
}

// ─── 4. HARMONIC 369 METRICS ─────────────────────────────────────────────

export interface EmulatorHarmonic369Metrics {
  readonly digitalRoot: number;
  readonly isValid369: boolean;
  readonly harmonicFlux: number;
  readonly vortexSequenceValue: number;
  readonly triadicVector: readonly [number, number, number];
}

// ─── 5. COMMAND RESULT SCHEMA ────────────────────────────────────────────

export interface EmulatorResult<T = any> {
  readonly success: boolean;
  readonly commandId: string;
  readonly commandType: EmulatorCommandType;
  readonly data?: T;
  readonly error?: string;
  readonly latencyMs: number;
  readonly timestamp: number;
  readonly harmonic369?: EmulatorHarmonic369Metrics;
  readonly trajectoryId?: string;
}

// ─── 6. EMULATOR CONFIGURATION ───────────────────────────────────────────

export interface EmulatorConfig {
  readonly autoRecordTrajectories?: boolean;
  readonly strict369Validation?: boolean;
  readonly maxCacheBytes?: number;
  readonly defaultDimension?: CubiODimension;
}
