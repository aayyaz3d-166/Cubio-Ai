/**
 * CUBiO AI — PMA Task 397: Canonical 369 Address Mapping Bridge
 * 
 * Controlled mapping bridge from valid VDB spatial references into Phase 25/26 state addressing.
 * Uses src/core/address369.ts as the sole canonical spatial authority (strictly read-only).
 * Implements deterministic forward and reverse projections with fail-closed bounds enforcement.
 */

import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  SPATIAL_ADDRESS_OFFSET,
  SPATIAL_ADDRESS_END,
  TOTAL_ADDRESS_SPACE,
  validateCoordinate,
  validateCellId,
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  coordinateToAddress,
  addressToCoordinate,
  isSpatialAddress,
} from '../../core/address369';
import { CompactStateAddressingEngine, PackedStateAddressFields } from './compactStateAddressing';
import { Coordinate3D } from '../../types/memory';

export interface ContinuousCoord3D {
  x: number;
  y: number;
  z: number;
}

export interface Mapped369State {
  discreteCoord: Coordinate3D;
  cellId: number;
  address369: number;
  proceduralAddress: string;
  fields: PackedStateAddressFields;
}

export class Canonical369Bridge {
  // Continuous coordinate bounds for VDB STATES positions
  public static readonly CONTINUOUS_MIN = -100;
  public static readonly CONTINUOUS_MAX = 100;

  /** Normalizes continuous VDB position [-100..100] into discrete 7x7x7 grid [0..6] */
  public static discretizeContinuousPosition(pos: ContinuousCoord3D): Coordinate3D {
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) {
      throw new Error("FAIL_CLOSED_VIOLATION: Continuous coordinates must be finite numbers");
    }

    const clampAndScale = (val: number): number => {
      const clamped = Math.max(this.CONTINUOUS_MIN, Math.min(this.CONTINUOUS_MAX, val));
      const normalized = (clamped - this.CONTINUOUS_MIN) / (this.CONTINUOUS_MAX - this.CONTINUOUS_MIN); // [0..1]
      const discrete = Math.min(DIMENSION - 1, Math.floor(normalized * DIMENSION));
      return discrete;
    };

    const x = clampAndScale(pos.x);
    const y = clampAndScale(pos.y);
    const z = clampAndScale(pos.z);

    validateCoordinate(x, y, z);
    return { x, y, z };
  }

  /** Maps discrete coordinate (x,y,z) or cellId to Phase 25 compact procedural address */
  public static forwardMapSpatialToAddress(coordOrCellId: Coordinate3D | number): Mapped369State {
    let discreteCoord: Coordinate3D;
    let cellId: number;

    if (typeof coordOrCellId === "number") {
      cellId = coordOrCellId;
      validateCellId(cellId);
      discreteCoord = cellIdToCoordinate(cellId);
    } else {
      discreteCoord = coordOrCellId;
      validateCoordinate(discreteCoord.x, discreteCoord.y, discreteCoord.z);
      cellId = coordinateToCellId(discreteCoord.x, discreteCoord.y, discreteCoord.z);
    }

    const address369 = cellIdToAddress369(cellId);

    // Deterministically derive procedural fields for Phase 25
    const rootBaseIndex = (cellId % 100) + 1; // [1..100]
    const polarity = cellId % 2 === 0 ? "+" : "-";
    const scaleLevel = (Math.floor(cellId / 115) + 1) as 1 | 2 | 3; // 343 / 3 partitions [1..3]
    const level = 1;

    const proceduralAddress = CompactStateAddressingEngine.encodeAddress(
      rootBaseIndex,
      polarity,
      scaleLevel,
      level,
      "NONE",
      "NONE",
      0,
      (cellId % 256) / 50.0
    );

    const decoded = CompactStateAddressingEngine.decodeAddress(proceduralAddress);
    if (!decoded.valid || !decoded.fields) {
      throw new Error(`FAIL_CLOSED_VIOLATION: Generated procedural address failed decoding: ${decoded.error}`);
    }

    return {
      discreteCoord,
      cellId,
      address369,
      proceduralAddress,
      fields: decoded.fields,
    };
  }

  /** Reverse maps procedural address or address369 back to discrete spatial coordinates */
  public static reverseMapAddressToSpatial(addressInput: string | number): {
    address369: number;
    cellId: number;
    discreteCoord: Coordinate3D;
  } {
    let address369: number;

    if (typeof addressInput === "number") {
      if (!isSpatialAddress(addressInput)) {
        throw new Error(`FAIL_CLOSED_VIOLATION: Address ${addressInput} is outside spatial range [${SPATIAL_ADDRESS_OFFSET}..${SPATIAL_ADDRESS_END}]`);
      }
      address369 = addressInput;
    } else {
      const decoded = CompactStateAddressingEngine.decodeAddress(addressInput);
      if (!decoded.valid || !decoded.fields) {
        throw new Error(`FAIL_CLOSED_VIOLATION: Invalid procedural address "${addressInput}": ${decoded.error}`);
      }
      // Reconstruct cellId from deterministic encoding parameters
      // cellId = (scaleLevel - 1) * 115 + (rootBaseIndex - 1)
      const scaleOffset = (decoded.fields.scaleLevel - 1) * 115;
      const baseOffset = (decoded.fields.rootBaseIndex - 1);
      const reconstructedCellId = scaleOffset + baseOffset;
      if (reconstructedCellId >= TOTAL_SPATIAL_CELLS) {
        throw new Error(`FAIL_CLOSED_VIOLATION: Reconstructed cellId ${reconstructedCellId} exceeds bounds [0..342]`);
      }
      address369 = cellIdToAddress369(reconstructedCellId);
    }

    const cellId = address369ToCellId(address369);
    const discreteCoord = cellIdToCoordinate(cellId);
    return { address369, cellId, discreteCoord };
  }
}
