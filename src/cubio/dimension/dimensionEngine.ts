/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 4: CubiO Dimension Engine
 *
 * Core engine managing transitions, elevations, projections, and invariants
 * across the 8 Logical State Spaces (D0 through D7).
 */

import {
  CubiODimension,
  CubiODimensionDescriptor,
  DimensionTensorState,
  DimensionTransitionResult,
  DimensionTransitionType,
} from './types';
import { CUBIO_DIMENSION_DESCRIPTORS } from './descriptors';
import { CubiOState } from '../state/types';
import { CubiOStateFactory } from '../state/stateEngine';
import { deterministicHash } from '../state/determinism';
import { Math369 } from '../engine_369/math369';

export class CubiODimensionEngine {
  private static readonly DIMENSION_RANKS: Record<CubiODimension, number> = {
    D0: 1,
    D1: 1,
    D2: 2,
    D3: 3,
    D4: 4,
    D5: 5,
    D6: 6,
    D7: 7,
  };

  private static readonly DIMENSION_ORDER: readonly CubiODimension[] = [
    'D0',
    'D1',
    'D2',
    'D3',
    'D4',
    'D5',
    'D6',
    'D7',
  ];

  public static getDescriptor(dimension: CubiODimension): CubiODimensionDescriptor {
    return CUBIO_DIMENSION_DESCRIPTORS[dimension];
  }

  public static getAllDescriptors(): readonly CubiODimensionDescriptor[] {
    return Object.freeze(this.DIMENSION_ORDER.map((d) => CUBIO_DIMENSION_DESCRIPTORS[d]));
  }

  public static getTensorRank(dimension: CubiODimension): number {
    return this.DIMENSION_RANKS[dimension];
  }

  /**
   * Creates a frozen DimensionTensorState.
   */
  public static createTensorState(
    stateId: string,
    dimension: CubiODimension,
    coordinates: readonly number[],
    payload: Record<string, any> = {}
  ): Readonly<DimensionTensorState> {
    const targetRank = this.DIMENSION_RANKS[dimension];
    const normalizedCoords = new Array(targetRank).fill(0);
    for (let i = 0; i < targetRank; i++) {
      normalizedCoords[i] = i < coordinates.length ? coordinates[i] : 0;
    }

    const frozenCoords = Object.freeze(normalizedCoords);
    const frozenPayload = Object.freeze({ ...payload });

    const checksum = deterministicHash(
      `${stateId}:${dimension}:[${frozenCoords.map((c) => c.toFixed(4)).join(',')}]`
    );

    return Object.freeze({
      stateId,
      dimension,
      coordinateVector: frozenCoords,
      rank: targetRank,
      payload: frozenPayload,
      checksum,
    });
  }

  /**
   * Transforms a tensor state across logical state spaces (D0 through D7).
   */
  public static transformTensor(
    tensor: DimensionTensorState,
    targetDimension: CubiODimension
  ): Readonly<DimensionTransitionResult> {
    const fromDim = tensor.dimension;
    const toDim = targetDimension;

    const fromRank = this.DIMENSION_RANKS[fromDim];
    const toRank = this.DIMENSION_RANKS[toDim];

    let transitionType: DimensionTransitionType = 'IDENTITY';
    if (fromDim === toDim) {
      transitionType = 'IDENTITY';
    } else if (toRank > fromRank) {
      transitionType = 'ELEVATION';
    } else {
      transitionType = 'PROJECTION';
    }

    // Dimension coordinate transformation using harmonic basis
    const projectedCoords = Math369.projectDimensionCoordinates(
      tensor.coordinateVector,
      (fromDim === 'D0' || fromDim === 'D1' ? 'D2' : fromDim) as any,
      (toDim === 'D0' || toDim === 'D1' ? 'D2' : toDim) as any
    );

    // Slice to exact rank
    const targetRankCoords = new Array(toRank).fill(0);
    for (let i = 0; i < toRank; i++) {
      targetRankCoords[i] = i < projectedCoords.length ? projectedCoords[i] : 0;
    }

    const outputTensor = this.createTensorState(
      tensor.stateId,
      toDim,
      targetRankCoords,
      {
        ...tensor.payload,
        transitionedFrom: fromDim,
        elevationRank: toRank - fromRank,
      }
    );

    const isLossless = toRank >= fromRank;
    const transitionChecksum = deterministicHash(
      `${tensor.checksum}->${outputTensor.checksum}:${transitionType}`
    );

    return Object.freeze({
      transitionId: `TR_${transitionChecksum.slice(2, 10)}`,
      fromDimension: fromDim,
      toDimension: toDim,
      inputTensor: tensor,
      outputTensor,
      isLossless,
      transitionType,
      transitionChecksum,
    });
  }

  /**
   * Immutably transforms a canonical CubiOState into a target logical state space.
   */
  public static transformCubiOState(
    state: CubiOState,
    targetDimension: CubiODimension
  ): Readonly<CubiOState> {
    const tensor = this.createTensorState(
      state.id,
      state.dimension,
      state.position,
      state.properties
    );

    const transitionResult = this.transformTensor(tensor, targetDimension);
    const desc = this.getDescriptor(targetDimension);

    return CubiOStateFactory.createState(
      state.properties.label || state.id,
      transitionResult.outputTensor.coordinateVector,
      targetDimension,
      {
        ...state.properties,
        logicalSpaceName: desc.name,
        logicalCategory: desc.category,
        tensorRank: desc.tensorRank,
      },
      state.relationships,
      state.memory,
      state.parent,
      state.children,
      state.id
    );
  }

  /**
   * Computes dimensional Shannon entropy over coordinates.
   */
  public static computeDimensionEntropy(tensor: DimensionTensorState): number {
    const coords = tensor.coordinateVector;
    if (coords.length === 0) return 0;

    let sumSquares = 0;
    for (const c of coords) {
      sumSquares += c * c;
    }

    if (sumSquares === 0) return 0;

    let entropy = 0;
    for (const c of coords) {
      const p = (c * c) / sumSquares;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return parseFloat(entropy.toFixed(4));
  }

  /**
   * Validates tensor coherence against descriptor invariants.
   */
  public static validateDimensionalTensor(tensor: DimensionTensorState): {
    isValid: boolean;
    issues: readonly string[];
  } {
    const issues: string[] = [];
    const expectedRank = this.DIMENSION_RANKS[tensor.dimension];

    if (tensor.coordinateVector.length !== expectedRank) {
      issues.push(
        `Coordinate length ${tensor.coordinateVector.length} does not match expected rank ${expectedRank} for ${tensor.dimension}.`
      );
    }

    for (const c of tensor.coordinateVector) {
      if (!Number.isFinite(c)) {
        issues.push(`Non-finite coordinate value detected: ${c}`);
      }
    }

    return Object.freeze({
      isValid: issues.length === 0,
      issues: Object.freeze(issues),
    });
  }
}
