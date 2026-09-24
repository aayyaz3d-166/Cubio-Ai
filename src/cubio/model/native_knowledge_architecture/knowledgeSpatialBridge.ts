/**
 * CUBiO AI — Task 184: Native Knowledge Architecture
 * src/cubio/model/native_knowledge_architecture/knowledgeSpatialBridge.ts
 *
 * Grounding Bridge connecting Knowledge Entities, Facts, and Concepts to
 * the 343 Spatial Cell Lattice (7x7x7) and 369 Euler Address Space.
 */

import {
  DIMENSION,
  TOTAL_SPATIAL_CELLS,
  TOTAL_SYMBOLIC_IDS,
  TOTAL_ADDRESS_SPACE,
  SPATIAL_ADDRESS_OFFSET,
  validateCoordinate,
  validateCellId,
  validateAddress,
  coordinateToCellId,
  cellIdToCoordinate,
  cellIdToAddress369,
  address369ToCellId,
  coordinateToAddress,
  addressToCoordinate,
  isSymbolicAddress,
  isSpatialAddress,
  charToAddress,
  addressToChar,
} from '../../../core/address369';
import { Coordinate3D } from '../../../types/memory';

export class KnowledgeSpatialBridge {
  /**
   * Resolves full spatial grounding details from a given 369 address.
   */
  public static resolveGrounding(address369: number): {
    address369: number;
    isSpatial: boolean;
    isSymbolic: boolean;
    cellId343?: number;
    coordinate3D?: Coordinate3D;
    symbol?: string;
  } {
    validateAddress(address369);

    if (isSymbolicAddress(address369)) {
      return {
        address369,
        isSpatial: false,
        isSymbolic: true,
        symbol: addressToChar(address369),
      };
    }

    const cellId = address369ToCellId(address369);
    const coord = cellIdToCoordinate(cellId);

    return {
      address369,
      isSpatial: true,
      isSymbolic: false,
      cellId343: cellId,
      coordinate3D: coord,
    };
  }

  /**
   * Creates a grounded spatial address from 3D coordinates (x, y, z in [0..6]).
   */
  public static fromCoordinates(x: number, y: number, z: number): {
    address369: number;
    cellId343: number;
    coordinate3D: Coordinate3D;
  } {
    validateCoordinate(x, y, z);
    const cellId = coordinateToCellId(x, y, z);
    const address = cellIdToAddress369(cellId);
    return {
      address369: address,
      cellId343: cellId,
      coordinate3D: { x, y, z },
    };
  }

  /**
   * Creates a grounded address from a linear 343 Cell ID [0..342].
   */
  public static fromCellId(cellId: number): {
    address369: number;
    cellId343: number;
    coordinate3D: Coordinate3D;
  } {
    validateCellId(cellId);
    const address = cellIdToAddress369(cellId);
    const coord = cellIdToCoordinate(cellId);
    return {
      address369: address,
      cellId343: cellId,
      coordinate3D: coord,
    };
  }

  /**
   * Calculates deterministic Manhattan distance between two addresses.
   * If either address is symbolic, returns a nominal symbolic distance.
   */
  public static manhattanDistance(addrA: number, addrB: number): number {
    validateAddress(addrA);
    validateAddress(addrB);

    if (addrA === addrB) return 0;

    const isSpatialA = isSpatialAddress(addrA);
    const isSpatialB = isSpatialAddress(addrB);

    if (!isSpatialA || !isSpatialB) {
      // Nominal distance between symbolic and spatial, or two symbolic
      return Math.abs(addrA - addrB);
    }

    const coordA = addressToCoordinate(addrA);
    const coordB = addressToCoordinate(addrB);

    return (
      Math.abs(coordA.x - coordB.x) +
      Math.abs(coordA.y - coordB.y) +
      Math.abs(coordA.z - coordB.z)
    );
  }

  /**
   * Calculates deterministic Euclidean distance between two addresses.
   */
  public static euclideanDistance(addrA: number, addrB: number): number {
    validateAddress(addrA);
    validateAddress(addrB);

    if (addrA === addrB) return 0.0;

    const isSpatialA = isSpatialAddress(addrA);
    const isSpatialB = isSpatialAddress(addrB);

    if (!isSpatialA || !isSpatialB) {
      return Math.abs(addrA - addrB);
    }

    const coordA = addressToCoordinate(addrA);
    const coordB = addressToCoordinate(addrB);

    const dx = coordA.x - coordB.x;
    const dy = coordA.y - coordB.y;
    const dz = coordA.z - coordB.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Computes spatial affinity score in [0.0..1.0] where identical location = 1.0.
   * Max Manhattan distance in 7x7x7 grid is (6+6+6) = 18.
   */
  public static computeSpatialAffinity(addrA: number, addrB: number): number {
    validateAddress(addrA);
    validateAddress(addrB);

    if (addrA === addrB) return 1.0;

    const isSpatialA = isSpatialAddress(addrA);
    const isSpatialB = isSpatialAddress(addrB);

    if (!isSpatialA && !isSpatialB) {
      // Both symbolic
      const diff = Math.abs(addrA - addrB);
      return Math.max(0.0, 1.0 - diff / TOTAL_SYMBOLIC_IDS);
    }

    if (!isSpatialA || !isSpatialB) {
      // Cross symbolic-spatial affinity is low baseline
      return 0.10;
    }

    const dist = this.manhattanDistance(addrA, addrB);
    const maxDist = 18; // 6 + 6 + 6
    const score = 1.0 - dist / maxDist;
    return Math.max(0.0, Math.min(1.0, score));
  }
}
