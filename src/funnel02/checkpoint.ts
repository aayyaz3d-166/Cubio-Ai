/**
 * CUBiO AI — Funnel 02: Database ↔ Virtual Core Stability
 * Deterministic Checkpoint Serializer & Integrity Engine
 */

import * as crypto from 'crypto';
import { MemoryGrid3D } from '../types/memory';
import { EulerMemoryEngine } from '../core/EulerMemoryEngine';
import {
  FORMAT_MAGIC,
  FUNNEL_NAME,
  GATE_NAME,
  GRID_DIMENSION,
  IS_ACTUATION_BLOCKED,
  LOCAL_FIRST_STORAGE_ONLY,
  SCHEMA_VERSION,
  TOTAL_ADDRESS_SPACE,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
  cellIdToCoordinate,
  coordinateToCellId,
  cellIdToAddress369,
} from './constants';
import { CheckpointGuard } from './guard';
import {
  CanonicalCellState,
  CheckpointAddressing,
  CheckpointHeader,
  CheckpointIntegrity,
  CheckpointSecurity,
  CheckpointVerificationResult,
  EulerNodeState,
  SpatialAddressEntry,
  SymbolicAddressEntry,
  VirtualCoreCheckpoint,
} from './types';

/**
 * Deterministic canonical JSON serialization with sorted keys
 */
export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJsonStringify(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map((key) => {
    return JSON.stringify(key) + ':' + canonicalJsonStringify(obj[key]);
  });
  return '{' + entries.join(',') + '}';
}

/**
 * Computes SHA-256 hash of a string
 */
export function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

/**
 * Computes a standard binary Merkle Root from an array of leaf hashes
 */
export function computeMerkleRoot(leafHashes: string[]): string {
  if (leafHashes.length === 0) {
    return computeSha256('EMPTY_MERKLE_TREE');
  }
  let currentLevel = [...leafHashes];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = currentLevel[i] + currentLevel[i + 1];
        nextLevel.push(computeSha256(combined));
      } else {
        // Odd node duplicated to balance
        const combined = currentLevel[i] + currentLevel[i];
        nextLevel.push(computeSha256(combined));
      }
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Builds the canonical 369 address table
 */
export function buildCanonicalAddressingTable(): CheckpointAddressing {
  const symbolic_table: SymbolicAddressEntry[] = [];
  for (let i = 0; i < TOTAL_SYMBOLIC_IDS; i++) {
    symbolic_table.push({
      address: i,
      symbol: String.fromCharCode(65 + i),
      symbolId: i,
    });
  }

  const spatial_table: SpatialAddressEntry[] = [];
  for (let id = 0; id < TOTAL_SPATIAL_CELLS; id++) {
    const x = id % GRID_DIMENSION;
    const y = Math.floor(id / GRID_DIMENSION) % GRID_DIMENSION;
    const z = Math.floor(id / (GRID_DIMENSION * GRID_DIMENSION));
    const address = 26 + id;

    spatial_table.push({
      address,
      cellId: id,
      coord: [x, y, z],
    });
  }

  return {
    total_address_space: TOTAL_ADDRESS_SPACE,
    symbolic_count: TOTAL_SYMBOLIC_IDS,
    spatial_count: TOTAL_SPATIAL_CELLS,
    symbolic_table,
    spatial_table,
  };
}

/**
 * Serializes Virtual Core state (MemoryGrid3D + EulerMemoryEngine) into an immutable VirtualCoreCheckpoint
 */
export function createVirtualCoreCheckpoint(
  grid: MemoryGrid3D,
  euler?: EulerMemoryEngine,
  epoch: number = 0,
  description: string = 'Virtual Core Checkpoint',
  options?: { checkpointId?: string; timestamp?: string }
): VirtualCoreCheckpoint {
  const checkpointId = options?.checkpointId ?? crypto.randomUUID();
  const createdAt = options?.timestamp ?? new Date().toISOString();
  const addressing = buildCanonicalAddressingTable();

  const header: CheckpointHeader = {
    magic: FORMAT_MAGIC,
    schema_version: SCHEMA_VERSION,
    funnel: FUNNEL_NAME,
    gate: GATE_NAME,
    checkpoint_id: checkpointId,
    created_at: createdAt,
    epoch,
    description,
  };

  const security: CheckpointSecurity = {
    is_actuation_blocked: IS_ACTUATION_BLOCKED,
    local_first_only: LOCAL_FIRST_STORAGE_ONLY,
    cloud_storage_disabled: true,
    model_weights_included: false,
  };

  // Canonicalize cells
  const canonicalCells: CanonicalCellState[] = [];
  const cellLeafHashes: string[] = [];

  for (let id = 0; id < TOTAL_SPATIAL_CELLS; id++) {
    const cell = grid.cells[id];
    const cellObj: CanonicalCellState = {
      id,
      address369: 26 + id,
      x: cell.x,
      y: cell.y,
      z: cell.z,
      state: cell.state as 0 | 1,
      symbol: cell.symbol ?? null,
      symbolId: cell.symbolId ?? null,
      payloadBinary: cell.payloadBinary ?? '00000000',
      occurrenceCount: cell.occurrenceCount ?? 0,
      stepIndices: Array.isArray(cell.stepIndices) ? [...cell.stepIndices] : [],
      connections: Array.isArray(cell.connections) ? [...cell.connections] : [],
    };
    canonicalCells.push(cellObj);
    cellLeafHashes.push(computeSha256(canonicalJsonStringify(cellObj)));
  }

  const cellsMerkleRoot = computeMerkleRoot(cellLeafHashes);

  // Address leaf hashes
  const addressLeafHashes = addressing.spatial_table.map((entry) =>
    computeSha256(canonicalJsonStringify(entry))
  );
  const addressesMerkleRoot = computeMerkleRoot(addressLeafHashes);

  // Euler complex state
  const eulerEngine = euler ?? new EulerMemoryEngine(GRID_DIMENSION);
  const eulerNodes: EulerNodeState[] = [];

  for (let z = 0; z < GRID_DIMENSION; z++) {
    for (let y = 0; y < GRID_DIMENSION; y++) {
      for (let x = 0; x < GRID_DIMENSION; x++) {
        const key = `${x},${y},${z}`;
        const node = eulerEngine.grid[key];
        eulerNodes.push({
          coords: [x, y, z],
          phi: Number(node.phi.toFixed(12)),
          amplitudeReal: Number(node.amplitudeReal.toFixed(12)),
          amplitudeImag: Number(node.amplitudeImag.toFixed(12)),
          weight: Number(node.weight.toFixed(8)),
        });
      }
    }
  }

  // Sequence steps
  const sequenceSteps = (grid.sequenceSteps || []).map((s) => ({
    stepIndex: s.stepIndex,
    cellId: s.cellId,
    address369: s.address369,
    token: s.token,
    coordinate: { x: s.coordinate.x, y: s.coordinate.y, z: s.coordinate.z },
  }));

  // Construct payload to hash
  const payloadToHash = {
    header,
    security,
    addressing,
    grid_state: {
      dimension: GRID_DIMENSION,
      total_cells: TOTAL_SPATIAL_CELLS,
      active_cell_count: grid.activeCellCount,
      cells: canonicalCells,
    },
    euler_state: {
      dimension: GRID_DIMENSION,
      total_nodes: TOTAL_SPATIAL_CELLS,
      nodes: eulerNodes,
    },
    sequence_steps: sequenceSteps,
  };

  const canonicalPayloadStr = canonicalJsonStringify(payloadToHash);
  const payloadSha256 = computeSha256(canonicalPayloadStr);
  const byteLength = Buffer.byteLength(canonicalPayloadStr, 'utf-8');

  const integrity: CheckpointIntegrity = {
    algorithm: 'SHA-256',
    payload_sha256: payloadSha256,
    cells_merkle_root: cellsMerkleRoot,
    addresses_merkle_root: addressesMerkleRoot,
    byte_length: byteLength,
    canonical_checksum: payloadSha256.slice(0, 16),
  };

  const fullCheckpoint: VirtualCoreCheckpoint = {
    ...payloadToHash,
    integrity,
  };

  // Run fail-closed validations immediately
  CheckpointGuard.validateActuationLock(fullCheckpoint);
  CheckpointGuard.validateNoModelWeights(fullCheckpoint);
  CheckpointGuard.validateSchema(fullCheckpoint);
  CheckpointGuard.validateCompleteness(fullCheckpoint);
  CheckpointGuard.validateAddressingFidelity(fullCheckpoint);

  return fullCheckpoint;
}

/**
 * Validates checkpoint integrity and seals
 */
export function verifyCheckpointIntegrity(checkpoint: VirtualCoreCheckpoint): CheckpointVerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    CheckpointGuard.validateActuationLock(checkpoint);
  } catch (err: any) {
    errors.push(err.message);
  }

  try {
    CheckpointGuard.validateNoModelWeights(checkpoint);
  } catch (err: any) {
    errors.push(err.message);
  }

  try {
    CheckpointGuard.validateSchema(checkpoint);
  } catch (err: any) {
    errors.push(err.message);
  }

  try {
    CheckpointGuard.validateCompleteness(checkpoint);
  } catch (err: any) {
    errors.push(err.message);
  }

  try {
    CheckpointGuard.validateAddressingFidelity(checkpoint);
  } catch (err: any) {
    errors.push(err.message);
  }

  // Recompute payload hash
  const payloadToRehash = {
    header: checkpoint.header,
    security: checkpoint.security,
    addressing: checkpoint.addressing,
    grid_state: checkpoint.grid_state,
    euler_state: checkpoint.euler_state,
    sequence_steps: checkpoint.sequence_steps,
  };

  const recomputedStr = canonicalJsonStringify(payloadToRehash);
  const recomputedHash = computeSha256(recomputedStr);
  const hashMatch = recomputedHash === checkpoint.integrity?.payload_sha256;
  if (!hashMatch) {
    errors.push(`Payload SHA-256 mismatch! Expected ${checkpoint.integrity?.payload_sha256}, computed ${recomputedHash}`);
  }

  // Recompute cells Merkle root
  const cellLeafHashes = (checkpoint.grid_state?.cells || []).map((cell) =>
    computeSha256(canonicalJsonStringify(cell))
  );
  const recomputedCellsMerkle = computeMerkleRoot(cellLeafHashes);
  const cellsMerkleMatch = recomputedCellsMerkle === checkpoint.integrity?.cells_merkle_root;
  if (!cellsMerkleMatch) {
    errors.push(`Cells Merkle root mismatch! Expected ${checkpoint.integrity?.cells_merkle_root}, computed ${recomputedCellsMerkle}`);
  }

  // Recompute address Merkle root
  const addressLeafHashes = (checkpoint.addressing?.spatial_table || []).map((entry) =>
    computeSha256(canonicalJsonStringify(entry))
  );
  const recomputedAddressesMerkle = computeMerkleRoot(addressLeafHashes);
  const addressesMerkleMatch = recomputedAddressesMerkle === checkpoint.integrity?.addresses_merkle_root;
  if (!addressesMerkleMatch) {
    errors.push(`Addresses Merkle root mismatch! Expected ${checkpoint.integrity?.addresses_merkle_root}, computed ${recomputedAddressesMerkle}`);
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    checkpoint_id: checkpoint.header?.checkpoint_id ?? 'UNKNOWN',
    errors,
    warnings,
    payload_sha256_match: hashMatch,
    cells_merkle_root_match: cellsMerkleMatch,
    addresses_merkle_root_match: addressesMerkleMatch,
    actuation_lock_verified: checkpoint.security?.is_actuation_blocked === true,
    cell_count: checkpoint.grid_state?.cells?.length ?? 0,
    address_count: (checkpoint.addressing?.symbolic_count ?? 0) + (checkpoint.addressing?.spatial_count ?? 0),
  };
}
