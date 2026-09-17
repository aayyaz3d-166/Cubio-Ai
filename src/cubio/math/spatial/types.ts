/**
 * CUBiO AI — Task 20: Spatial 343 / 369 Mapping Interface
 * Phase 1 — Mathematical Core
 * src/cubio/math/spatial/types.ts
 *
 * Types, interfaces, and canonical constants for the 343-cell spatial lattice
 * and its mapping to the 369 address space.
 * 
 * NOTE: src/core/address369.ts is the SOLE spatial authority.
 * Constants are directly re-exported to maintain a single source of truth.
 */

import { NativeMathCoordinate } from '../types';
import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
  TOTAL_ADDRESS_SPACE,
  TOTAL_SYMBOLIC_IDS,
  SYMBOLIC_ADDRESS_START,
  SYMBOLIC_ADDRESS_END,
} from '../../../core/address369';

// Re-export canonical constants from single source of truth
export {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
  TOTAL_ADDRESS_SPACE,
  TOTAL_SYMBOLIC_IDS,
  SYMBOLIC_ADDRESS_START,
  SYMBOLIC_ADDRESS_END,
};

/**
 * Immutable native spatial mapping structure representing the bijective binding
 * between a 3D coordinate (x, y, z) in [0..6]^3, a linear cell ID in [0..342],
 * and a 369 spatial address in [26..368].
 */
export interface Spatial343Mapping {
  readonly mathType: 'SPATIAL_343_MAPPING';
  readonly coordinate: NativeMathCoordinate;
  readonly cellId: number;       // Canonical cell ID in [0..342]
  readonly address369: number;   // Canonical 369 address in [26..368]
  readonly checksum: string;     // Deterministic SHA-256 integrity digest
}

/**
 * Canonical Landmark Constants:
 * Origin: (0, 0, 0) -> cellId 0 -> address369 26
 * Center: (3, 3, 3) -> cellId 171 -> address369 197
 * Max:    (6, 6, 6) -> cellId 342 -> address369 368
 */
export const CANONICAL_ORIGIN_COORD: readonly [number, number, number] = Object.freeze([0, 0, 0]);
export const CANONICAL_ORIGIN_CELL_ID = 0;
export const CANONICAL_ORIGIN_ADDRESS369 = 26;

export const CANONICAL_CENTER_COORD: readonly [number, number, number] = Object.freeze([3, 3, 3]);
export const CANONICAL_CENTER_CELL_ID = 171;
export const CANONICAL_CENTER_ADDRESS369 = 197;

export const CANONICAL_MAX_COORD: readonly [number, number, number] = Object.freeze([6, 6, 6]);
export const CANONICAL_MAX_CELL_ID = 342;
export const CANONICAL_MAX_ADDRESS369 = 368;
