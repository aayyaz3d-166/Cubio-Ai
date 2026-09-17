/**
 * CUBiO AI — Phase 3: 3D Memory Data Contract
 *
 * Establishes the authoritative logical contract between:
 * Virtual Database ↕ Memory Data Contract ↕ 3D Memory Studio Core ↕ 7x7x7 Spatial Memory ↕ 369 Addressing
 *
 * Invariant: 369 = 26 symbolic + 343 spatial (Addresses 0..25 symbolic, 26..368 spatial)
 * Formula: cellId = X + 7Y + 49Z (0 <= cellId <= 342)
 * Formula: address369 = 26 + cellId (26 <= address369 <= 368)
 * Center: (3,3,3) -> cellId 171 -> address 197
 */

import * as crypto from 'crypto';
import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
  TOTAL_ADDRESS_SPACE,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
  validateCoordinate,
  validateCellId,
  validateAddress,
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  coordinateToAddress,
  addressToCoordinate
} from '../../core/address369';

export {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
  TOTAL_ADDRESS_SPACE,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
  validateCoordinate,
  validateCellId,
  validateAddress,
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  coordinateToAddress,
  addressToCoordinate
};

// ── Logical Spatial Memory Record Contract ──────────────────────────────────
export interface LogicalSpatialMemoryRecord {
  readonly memoryId: string; // SPATIAL_MEM_<cellId>
  readonly coordinate: readonly [number, number, number]; // [X, Y, Z] in 0..6
  readonly cellId: number; // 0..342
  readonly address369: number; // 26..368
  readonly state: Readonly<Record<string, unknown>>;
  readonly dimension: number; // 3
  readonly clusterId?: string;
  readonly timestamp: number;
  readonly integrityHash: string; // SHA-256
  readonly source: string;
  readonly status: 'ACTIVE' | 'ARCHIVED';
}

// ── Logical Conversational Memory Contract (Kept Strictly Separate) ─────────
export interface LogicalConversationalMemoryRecord {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly facts: Readonly<Record<string, string>>;
  readonly historyTurns: number;
  readonly integrityChecksum: string;
  readonly lastPersistedAt: number;
}

/**
 * Computes deterministic SHA-256 integrity hash for a spatial memory record.
 */
export function computeSpatialMemoryHash(params: {
  cellId: number;
  coordinate: readonly [number, number, number];
  address369: number;
  state: Readonly<Record<string, unknown>>;
  source: string;
}): string {
  const canonicalPayload = JSON.stringify({
    cellId: params.cellId,
    coordinate: params.coordinate,
    address369: params.address369,
    state: params.state,
    source: params.source
  });
  return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
}

/**
 * Creates and strictly validates a LogicalSpatialMemoryRecord.
 * Throws if coordinates, cellId, address369, or invariants are violated.
 */
export function createSpatialMemoryRecord(params: {
  coordinate: readonly [number, number, number];
  state: Record<string, unknown>;
  source?: string;
  clusterId?: string;
  timestamp?: number;
}): LogicalSpatialMemoryRecord {
  const [x, y, z] = params.coordinate;
  validateCoordinate(x, y, z);

  const cellId = coordinateToCellId(x, y, z);
  validateCellId(cellId);

  const address369 = cellIdToAddress369(cellId);
  validateAddress(address369);

  const now = params.timestamp ?? Date.now();
  const source = params.source ?? 'CUBIO_3D_MEMORY_STUDIO_CORE';
  const clusterId = params.clusterId ?? `CLUSTER_DIM3_${z}`;

  const integrityHash = computeSpatialMemoryHash({
    cellId,
    coordinate: params.coordinate,
    address369,
    state: params.state,
    source
  });

  return Object.freeze({
    memoryId: `SPATIAL_MEM_${cellId}`,
    coordinate: Object.freeze([x, y, z]) as readonly [number, number, number],
    cellId,
    address369,
    state: Object.freeze({ ...params.state }),
    dimension: 3,
    clusterId,
    timestamp: now,
    integrityHash,
    source,
    status: 'ACTIVE'
  });
}
