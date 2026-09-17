/**
 * CUBiO AI — Task 20: Spatial 343 / 369 Mapping Interface
 * Phase 1 — Mathematical Core
 * src/cubio/math/spatial/mapping.ts
 *
 * Sovereign, deterministic, on-demand mapping interface for canonical 343-cell
 * spatial addressing bound to the 369 address space.
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. src/core/address369.ts is the SOLE spatial authority.
 * 2. Canonical formulas are strictly preserved:
 *      cellId = x + 7*y + 49*z
 *      address369 = 26 + cellId
 * 3. NO duplication or redefinition of formulas; all conversions delegate to address369.ts.
 * 4. NO dense 343-cell memory allocation. All evaluations are lightweight and on-demand O(1).
 * 5. Complete isolation from external models, training loops, audio, and ternary encoding.
 */

import {
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  coordinateToAddress,
  addressToCoordinate,
  validateCoordinate,
  validateCellId,
  validateAddress,
  isSpatialAddress,
  isSymbolicAddress,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
} from '../../../core/address369';

import { NativeMathCoordinate } from '../types';
import { createCoordinate } from '../primitives';
import { computeMathChecksum } from '../checksum';
import { NativeMathValidationError } from '../validation';
import { Spatial343Mapping } from './types';

/**
 * Validates that coordinate (x, y, z) lies within the canonical 7x7x7 lattice [0..6].
 * Wraps canonical validator error into NativeMathValidationError.
 */
export function assertSpatialBounds(x: number, y: number, z: number): void {
  try {
    validateCoordinate(x, y, z);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new NativeMathValidationError(`Spatial coordinate validation failed: ${msg}`);
  }
}

/**
 * Validates that linear cellId lies within [0..342].
 * Wraps canonical validator error into NativeMathValidationError.
 */
export function assertCellIdBounds(cellId: number): void {
  try {
    validateCellId(cellId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new NativeMathValidationError(`Spatial cell ID validation failed: ${msg}`);
  }
}

/**
 * Validates that address369 lies within spatial bounds [26..368].
 * Rejects symbolic addresses [0..25] and out-of-range values.
 */
export function assertSpatialAddressBounds(address369: number): void {
  if (
    !Number.isInteger(address369) ||
    address369 < SPATIAL_ADDRESS_OFFSET ||
    address369 > SPATIAL_ADDRESS_END
  ) {
    throw new NativeMathValidationError(
      `Spatial address out of canonical bounds [${SPATIAL_ADDRESS_OFFSET}..${SPATIAL_ADDRESS_END}]: ${address369}`
    );
  }
}

/**
 * Checks if a given address belongs to the spatial segment [26..368].
 */
export function isSpatialAddress369(address: number): boolean {
  return isSpatialAddress(address);
}

/**
 * Checks if a given address belongs to the symbolic segment [0..25].
 */
export function isSymbolicAddress369(address: number): boolean {
  return isSymbolicAddress(address);
}

/**
 * Converts (x, y, z) to linear Cell ID [0..342] strictly via canonical authority.
 */
export function coordToSpatialCellId(x: number, y: number, z: number): number {
  assertSpatialBounds(x, y, z);
  return coordinateToCellId(x, y, z);
}

/**
 * Converts (x, y, z) to 369 Spatial Address [26..368] strictly via canonical authority.
 */
export function coordToSpatialAddress(x: number, y: number, z: number): number {
  assertSpatialBounds(x, y, z);
  return coordinateToAddress(x, y, z);
}

/**
 * Converts linear Cell ID [0..342] to NativeMathCoordinate strictly via canonical authority.
 */
export function spatialCellIdToCoord(cellId: number): NativeMathCoordinate {
  assertCellIdBounds(cellId);
  const raw = cellIdToCoordinate(cellId);
  return createCoordinate(raw.x, raw.y, raw.z, 'CANONICAL_SPATIAL_343');
}

/**
 * Converts linear Cell ID [0..342] to 369 Spatial Address [26..368] strictly via canonical authority.
 */
export function spatialCellIdToAddress(cellId: number): number {
  assertCellIdBounds(cellId);
  return cellIdToAddress369(cellId);
}

/**
 * Converts 369 Spatial Address [26..368] to linear Cell ID [0..342] strictly via canonical authority.
 * Throws NativeMathValidationError if address is symbolic or out of bounds.
 */
export function spatialAddressToCellId(address369: number): number {
  assertSpatialAddressBounds(address369);
  try {
    return address369ToCellId(address369);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new NativeMathValidationError(`Spatial address translation failed: ${msg}`);
  }
}

/**
 * Converts 369 Spatial Address [26..368] to NativeMathCoordinate strictly via canonical authority.
 */
export function spatialAddressToCoord(address369: number): NativeMathCoordinate {
  assertSpatialAddressBounds(address369);
  const raw = addressToCoordinate(address369);
  return createCoordinate(raw.x, raw.y, raw.z, 'CANONICAL_SPATIAL_343');
}

/**
 * Helper to compute deterministic checksum for Spatial343Mapping.
 */
function computeSpatialMappingChecksum(
  x: number,
  y: number,
  z: number,
  cellId: number,
  address369: number
): string {
  return computeMathChecksum({
    mathType: 'SPATIAL_343_MAPPING',
    x,
    y,
    z,
    cellId,
    address369,
  });
}

/**
 * Maps a 3D coordinate to a full, immutable Spatial343Mapping on-demand in O(1).
 * Accepts either three numbers (x, y, z) or an object { x, y, z } / NativeMathCoordinate.
 */
export function mapCoordinateToSpatial(
  xOrCoord: number | { x: number; y: number; z: number },
  y?: number,
  z?: number
): Spatial343Mapping {
  let xCoord: number;
  let yCoord: number;
  let zCoord: number;

  if (typeof xOrCoord === 'object' && xOrCoord !== null) {
    xCoord = xOrCoord.x;
    yCoord = xOrCoord.y;
    zCoord = xOrCoord.z;
  } else if (typeof xOrCoord === 'number' && typeof y === 'number' && typeof z === 'number') {
    xCoord = xOrCoord;
    yCoord = y;
    zCoord = z;
  } else {
    throw new NativeMathValidationError('Invalid coordinate arguments: expected (x, y, z) or { x, y, z }');
  }

  assertSpatialBounds(xCoord, yCoord, zCoord);
  const cellId = coordinateToCellId(xCoord, yCoord, zCoord);
  const address369 = cellIdToAddress369(cellId);
  const coordinate = createCoordinate(xCoord, yCoord, zCoord, 'CANONICAL_SPATIAL_343');
  const checksum = computeSpatialMappingChecksum(xCoord, yCoord, zCoord, cellId, address369);

  return Object.freeze({
    mathType: 'SPATIAL_343_MAPPING' as const,
    coordinate,
    cellId,
    address369,
    checksum,
  });
}

/**
 * Maps a linear Cell ID [0..342] to a full, immutable Spatial343Mapping on-demand in O(1).
 */
export function mapCellIdToSpatial(cellId: number): Spatial343Mapping {
  assertCellIdBounds(cellId);
  const rawCoord = cellIdToCoordinate(cellId);
  const address369 = cellIdToAddress369(cellId);
  const coordinate = createCoordinate(rawCoord.x, rawCoord.y, rawCoord.z, 'CANONICAL_SPATIAL_343');
  const checksum = computeSpatialMappingChecksum(rawCoord.x, rawCoord.y, rawCoord.z, cellId, address369);

  return Object.freeze({
    mathType: 'SPATIAL_343_MAPPING' as const,
    coordinate,
    cellId,
    address369,
    checksum,
  });
}

/**
 * Maps a 369 Spatial Address [26..368] to a full, immutable Spatial343Mapping on-demand in O(1).
 * Symbolic addresses [0..25] are rejected.
 */
export function mapAddress369ToSpatial(address369: number): Spatial343Mapping {
  assertSpatialAddressBounds(address369);
  const cellId = address369ToCellId(address369);
  const rawCoord = cellIdToCoordinate(cellId);
  const coordinate = createCoordinate(rawCoord.x, rawCoord.y, rawCoord.z, 'CANONICAL_SPATIAL_343');
  const checksum = computeSpatialMappingChecksum(rawCoord.x, rawCoord.y, rawCoord.z, cellId, address369);

  return Object.freeze({
    mathType: 'SPATIAL_343_MAPPING' as const,
    coordinate,
    cellId,
    address369,
    checksum,
  });
}
