/**
 * CUBiO AI — Funnel 02: Database ↔ Virtual Core Stability
 * Checkpoint Export Service
 * 
 * Provides deterministic manual checkpoint generation and snapshotting of the Virtual Core.
 */

import * as crypto from 'crypto';
import { MemoryGrid3D } from '../types/memory';
import { EulerMemoryEngine } from '../core/EulerMemoryEngine';
import { createEmptyMemoryGrid } from '../core/memoryGrid';
import {
  GRID_DIMENSION,
  TOTAL_ADDRESS_SPACE,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
} from './constants';
import {
  CheckpointGuard,
  IncompleteGridStateError,
  AddressMappingDriftError,
  ModelWeightLeakageError,
} from './guard';
import {
  canonicalJsonStringify,
  computeSha256,
  createVirtualCoreCheckpoint,
} from './checkpoint';
import { VirtualCoreCheckpoint } from './types';

export interface CheckpointExportOptions {
  grid?: MemoryGrid3D;
  euler?: EulerMemoryEngine;
  epoch?: number;
  description?: string;
  checkpointId?: string;
  timestamp?: string;
}

export interface CheckpointExportResult {
  success: boolean;
  checkpoint: VirtualCoreCheckpoint;
  jsonString: string;
  filename: string;
  contentType: string;
  byteLength: number;
  sha256: string;
  cellsCount: number;
  addressCount: number;
  durationMs: number;
}

/**
 * Validates that the payload contains zero credentials, secrets, tokens, or model weights
 */
export function auditZeroLeakage(payloadStr: string): void {
  const sensitivePatterns = [
    'password',
    'api_key',
    'apikey',
    'secret_key',
    'private_key',
    'authorization',
    'bearer',
    'aws_secret',
    'model_weights',
    'neural_weights',
    'tensor',
    'tensors',
    'q_proj',
    'k_proj',
    'v_proj',
    'out_proj',
    'transformer',
    'linear.weight',
    'safetensors',
  ];

  const lower = payloadStr.toLowerCase();
  for (const pattern of sensitivePatterns) {
    if (lower.includes(`"${pattern}"`)) {
      throw new ModelWeightLeakageError(`Prohibited pattern "${pattern}" detected in export payload`);
    }
  }
}

/**
 * Snapshots the Virtual Core and exports a canonical, deterministic .3dmem checkpoint
 */
export function generateCheckpoint(options: CheckpointExportOptions = {}): CheckpointExportResult {
  const t0 = performance.now();

  const grid = options.grid ?? createEmptyMemoryGrid('Live Virtual Core Snapshot');
  const euler = options.euler ?? new EulerMemoryEngine(GRID_DIMENSION);
  const epoch = options.epoch ?? 0;
  const description = options.description ?? 'Live Virtual Core Snapshot Export';

  // 1. Fail-closed count verification
  if (!grid.cells || !Array.isArray(grid.cells) || grid.cells.length !== TOTAL_SPATIAL_CELLS) {
    throw new IncompleteGridStateError(
      TOTAL_SPATIAL_CELLS,
      grid.cells ? grid.cells.length : 0
    );
  }

  // 2. Coordinate and address range boundary checks
  for (let id = 0; id < TOTAL_SPATIAL_CELLS; id++) {
    const cell = grid.cells[id];
    if (
      cell.x < 0 || cell.x >= GRID_DIMENSION ||
      cell.y < 0 || cell.y >= GRID_DIMENSION ||
      cell.z < 0 || cell.z >= GRID_DIMENSION
    ) {
      throw new AddressMappingDriftError(
        `Coordinate out of [0..6] bounds at cell #${id}: (${cell.x}, ${cell.y}, ${cell.z})`
      );
    }
    const expectedCellId = cell.x + 7 * cell.y + 49 * cell.z;
    if (cell.id !== expectedCellId || cell.address369 !== 26 + expectedCellId) {
      throw new AddressMappingDriftError(
        `Bijective address drift at cell #${id}: id=${cell.id}, address369=${cell.address369}`
      );
    }
  }

  // 3. Create canonical checkpoint
  const checkpoint = createVirtualCoreCheckpoint(grid, euler, epoch, description, {
    checkpointId: options.checkpointId,
    timestamp: options.timestamp,
  });

  // 4. Deterministic canonical serialization
  const jsonString = canonicalJsonStringify(checkpoint);

  // 5. Audit zero secrets / model weight leakage
  auditZeroLeakage(jsonString);

  // 6. SHA-256 verification
  const fileSha256 = computeSha256(jsonString);
  const byteLength = Buffer.byteLength(jsonString, 'utf-8');

  // Format filename: .3dmem extension
  const shortId = checkpoint.header.checkpoint_id.slice(0, 8);
  const filename = `virtual_core_checkpoint_epoch_${String(epoch).padStart(4, '0')}_${shortId}.3dmem`;

  const durationMs = Math.round((performance.now() - t0) * 100) / 100;

  return {
    success: true,
    checkpoint,
    jsonString,
    filename,
    contentType: 'application/octet-stream',
    byteLength,
    sha256: fileSha256,
    cellsCount: TOTAL_SPATIAL_CELLS,
    addressCount: TOTAL_ADDRESS_SPACE,
    durationMs,
  };
}
