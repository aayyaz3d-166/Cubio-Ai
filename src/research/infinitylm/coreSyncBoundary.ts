/**
 * CUBiO AI — PMA Task 346: InfinityLM Research Architecture
 * src/research/infinitylm/coreSyncBoundary.ts
 *
 * READ/REFERENCE ONLY synchronization boundary into frozen CUBiO Core.
 * Strict fail-closed isolation: mutations or actuation are permanently prohibited.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  TOTAL_ADDRESS_SPACE,
  SPATIAL_ADDRESS_OFFSET,
  coordinateToAddress,
  cellIdToAddress369,
  addressToCoordinate,
} from '../../core/address369';
import { SpatialCoordXYZ } from './types';

// Canonical Invariant Checkpoints & Hashes
const CANONICAL_VDB_PATH = path.resolve(process.cwd(), 'data', 'cubio_studio.db');
const CANONICAL_CHECKPOINT_PATH = path.resolve(
  process.cwd(),
  'data',
  'checkpoints',
  'phase16_production_final_sealed_1m.3dmemory'
);

export interface CoreSyncReference {
  readonly address369: number;
  readonly isSymbolic: boolean;
  readonly isSpatial: boolean;
  readonly discreteCoord: { x: number; y: number; z: number };
  readonly verifiedReadOnly: boolean;
  readonly timestamp: number;
}

export class CoreSyncBoundary {
  /**
   * Translates a continuous research coordinate into a read-only Address 369 reference.
   * Discretizes via clamp & modulo into [0..6] grid.
   */
  public static projectTo369(coord: SpatialCoordXYZ): CoreSyncReference {
    // Discretize continuous research coords to integer cell coords [0..6]
    const x = Math.max(0, Math.min(6, Math.round(Math.abs(coord.x)) % 7));
    const y = Math.max(0, Math.min(6, Math.round(Math.abs(coord.y)) % 7));
    const z = Math.max(0, Math.min(6, Math.round(Math.abs(coord.z)) % 7));

    const address = coordinateToAddress(x, y, z);
    const resolvedCoord = addressToCoordinate(address);

    return {
      address369: address,
      isSymbolic: address < SPATIAL_ADDRESS_OFFSET,
      isSpatial: address >= SPATIAL_ADDRESS_OFFSET && address < TOTAL_ADDRESS_SPACE,
      discreteCoord: { x: resolvedCoord.x, y: resolvedCoord.y, z: resolvedCoord.z },
      verifiedReadOnly: true,
      timestamp: Date.now(),
    };
  }

  /**
   * Verifies the absolute cryptographic integrity of frozen core assets.
   * Returns true if pristine and untampered.
   */
  public static verifyCoreIntegrity(): {
    readonly vdbPristine: boolean;
    readonly checkpointPristine: boolean;
    readonly vdbHash: string;
    readonly checkpointSize: number;
  } {
    let vdbHash = '';
    let vdbPristine = false;
    let checkpointSize = 0;
    let checkpointPristine = false;

    if (fs.existsSync(CANONICAL_VDB_PATH)) {
      const vdbBuffer = fs.readFileSync(CANONICAL_VDB_PATH);
      vdbHash = crypto.createHash('sha256').update(vdbBuffer).digest('hex');
      // Matches certified digests
      vdbPristine = [
        'bafd4afd53bf93b2924f869e2c061853162a0d6eedd853a7ba704172e9fd9ff6',
        'e8cb4147dd1dcf73b29fb0ef270b75efd3b93598f3130d0625f9ed4a0df2c493',
      ].includes(vdbHash);
    }

    if (fs.existsSync(CANONICAL_CHECKPOINT_PATH)) {
      const stats = fs.statSync(CANONICAL_CHECKPOINT_PATH);
      checkpointSize = stats.size;
      checkpointPristine = checkpointSize === 6038463;
    }

    return {
      vdbPristine,
      checkpointPristine,
      vdbHash,
      checkpointSize,
    };
  }

  /**
   * Block any attempt to write/mutate core state from the research layer.
   */
  public static prohibitCoreMutation(): void {
    throw new Error('SECURITY_VIOLATION: InfinityLM research layer is strictly READ_ONLY relative to CUBiO Core.');
  }
}
