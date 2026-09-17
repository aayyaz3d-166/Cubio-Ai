/**
 * CUBiO AI — Funnel 02: Database ↔ Virtual Core Stability
 * Fail-Closed Guards & Custom Exceptions
 */

import {
  DISALLOWED_PROTOCOLS,
  FORMAT_MAGIC,
  GRID_DIMENSION,
  IS_ACTUATION_BLOCKED,
  LOCAL_FIRST_STORAGE_ONLY,
  SCHEMA_VERSION,
  TOTAL_ADDRESS_SPACE,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
} from './constants';
import { VirtualCoreCheckpoint } from './types';

// Custom Error Hierarchy
export class VirtualCoreGuardError extends Error {
  constructor(message: string) {
    super(`[VIRTUAL_CORE_GUARD] ${message}`);
    this.name = 'VirtualCoreGuardError';
  }
}

export class ActuationBlockViolationError extends VirtualCoreGuardError {
  constructor(message: string = 'CRITICAL INVARIANT VIOLATION: is_actuation_blocked must be True.') {
    super(message);
    this.name = 'ActuationBlockViolationError';
  }
}

export class CloudStorageForbiddenError extends VirtualCoreGuardError {
  constructor(uri: string) {
    super(`Cloud or remote storage URI strictly forbidden in local-first architecture: '${uri}'`);
    this.name = 'CloudStorageForbiddenError';
  }
}

export class ModelWeightLeakageError extends VirtualCoreGuardError {
  constructor(detail: string) {
    super(`Model weights or neural parameters detected in checkpoint payload: ${detail}`);
    this.name = 'ModelWeightLeakageError';
  }
}

export class IncompatibleSchemaError extends VirtualCoreGuardError {
  constructor(expected: string, actual: string) {
    super(`Incompatible checkpoint schema. Expected ${expected}, got ${actual}`);
    this.name = 'IncompatibleSchemaError';
  }
}

export class IncompleteGridStateError extends VirtualCoreGuardError {
  constructor(expected: number, actual: number) {
    super(`Incomplete grid state. Expected exactly ${expected} cells, got ${actual}`);
    this.name = 'IncompleteGridStateError';
  }
}

export class AddressMappingDriftError extends VirtualCoreGuardError {
  constructor(detail: string) {
    super(`Address mapping drift detected in 369 system: ${detail}`);
    this.name = 'AddressMappingDriftError';
  }
}

export class CheckpointCorruptedError extends VirtualCoreGuardError {
  constructor(detail: string) {
    super(`Checkpoint file corrupted or truncated: ${detail}`);
    this.name = 'CheckpointCorruptedError';
  }
}

export class CheckpointHashMismatchError extends VirtualCoreGuardError {
  constructor(expected: string, actual: string) {
    super(`Checkpoint SHA-256 integrity hash mismatch! Expected ${expected}, computed ${actual}`);
    this.name = 'CheckpointHashMismatchError';
  }
}

export class CheckpointGuard {
  /**
   * Enforces local-first storage path; rejects cloud/remote URLs
   */
  static validateStoragePath(targetPath: string): void {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new CloudStorageForbiddenError('Empty or invalid path');
    }
    const lower = targetPath.toLowerCase();
    for (const proto of DISALLOWED_PROTOCOLS) {
      if (lower.startsWith(proto) || lower.includes(`://${proto.replace('://', '')}`)) {
        throw new CloudStorageForbiddenError(targetPath);
      }
    }
  }

  /**
   * Enforces permanent non-actuation lock
   */
  static validateActuationLock(checkpoint: VirtualCoreCheckpoint): void {
    if (!checkpoint.security || checkpoint.security.is_actuation_blocked !== true) {
      throw new ActuationBlockViolationError(
        `Checkpoint has weakened or disabled actuation lock: is_actuation_blocked = ${checkpoint?.security?.is_actuation_blocked}`
      );
    }
    if (!checkpoint.security.local_first_only || !checkpoint.security.cloud_storage_disabled) {
      throw new ActuationBlockViolationError('Checkpoint security configuration violates offline-first invariants');
    }
  }

  /**
   * Enforces zero model weights in checkpoints
   */
  static validateNoModelWeights(checkpoint: any): void {
    if (checkpoint.security && checkpoint.security.model_weights_included !== false) {
      throw new ModelWeightLeakageError('Security flag marks model_weights_included as true');
    }

    const forbiddenKeys = [
      'weights',
      'tensors',
      'onnx',
      'safetensors',
      'parameters',
      'linear.weight',
      'q_proj',
      'k_proj',
      'v_proj',
      'out_proj',
      'transformer',
    ];

    const rawStr = JSON.stringify(checkpoint).toLowerCase();
    for (const k of forbiddenKeys) {
      if (rawStr.includes(`"${k}"`)) {
        throw new ModelWeightLeakageError(`Forbidden neural key "${k}" found in checkpoint payload`);
      }
    }
  }

  /**
   * Enforces schema format magic and version
   */
  static validateSchema(checkpoint: VirtualCoreCheckpoint): void {
    if (!checkpoint.header || checkpoint.header.magic !== FORMAT_MAGIC) {
      throw new IncompatibleSchemaError(FORMAT_MAGIC, checkpoint?.header?.magic ?? 'MISSING');
    }
    if (checkpoint.header.schema_version !== SCHEMA_VERSION) {
      throw new IncompatibleSchemaError(SCHEMA_VERSION, checkpoint?.header?.schema_version ?? 'MISSING');
    }
  }

  /**
   * Enforces completeness of 343 cells and 369 addresses
   */
  static validateCompleteness(checkpoint: VirtualCoreCheckpoint): void {
    if (!checkpoint.grid_state || !Array.isArray(checkpoint.grid_state.cells)) {
      throw new IncompleteGridStateError(TOTAL_SPATIAL_CELLS, 0);
    }
    if (checkpoint.grid_state.cells.length !== TOTAL_SPATIAL_CELLS) {
      throw new IncompleteGridStateError(TOTAL_SPATIAL_CELLS, checkpoint.grid_state.cells.length);
    }

    if (!checkpoint.addressing || !Array.isArray(checkpoint.addressing.spatial_table)) {
      throw new AddressMappingDriftError('Missing spatial addressing table');
    }
    if (checkpoint.addressing.spatial_table.length !== TOTAL_SPATIAL_CELLS) {
      throw new AddressMappingDriftError(
        `Spatial address count mismatch: expected ${TOTAL_SPATIAL_CELLS}, got ${checkpoint.addressing.spatial_table.length}`
      );
    }
    if (checkpoint.addressing.symbolic_table.length !== TOTAL_SYMBOLIC_IDS) {
      throw new AddressMappingDriftError(
        `Symbolic address count mismatch: expected ${TOTAL_SYMBOLIC_IDS}, got ${checkpoint.addressing.symbolic_table.length}`
      );
    }
  }

  /**
   * Enforces exact mathematical 369 addressing bijection
   */
  static validateAddressingFidelity(checkpoint: VirtualCoreCheckpoint): void {
    for (let i = 0; i < TOTAL_SPATIAL_CELLS; i++) {
      const entry = checkpoint.addressing.spatial_table[i];
      const cell = checkpoint.grid_state.cells[i];

      const expectedCellId = entry.coord[0] + 7 * entry.coord[1] + 49 * entry.coord[2];
      const expectedAddress = 26 + expectedCellId;

      if (entry.cellId !== expectedCellId || entry.address !== expectedAddress) {
        throw new AddressMappingDriftError(
          `Drift at index ${i}: expected cellId=${expectedCellId} addr=${expectedAddress}, got entry=${JSON.stringify(entry)}`
        );
      }

      if (
        cell.id !== expectedCellId ||
        cell.address369 !== expectedAddress ||
        cell.x !== entry.coord[0] ||
        cell.y !== entry.coord[1] ||
        cell.z !== entry.coord[2]
      ) {
        throw new AddressMappingDriftError(`Cell state mismatch with addressing table at cell #${cell.id}`);
      }
    }
  }
}
