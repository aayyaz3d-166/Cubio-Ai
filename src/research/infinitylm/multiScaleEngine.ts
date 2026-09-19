/**
 * CUBiO AI — PMA Task 349: Multi-Scale Resolution Engine
 * src/research/infinitylm/multiScaleEngine.ts
 *
 * Implements finite multi-scale resolution representations (¹, ², ³, ...) for Base & Dual States.
 * Evaluates deterministic scale transitions, reversible reconstruction, collision detection,
 * and empirical storage growth profiling without assuming infinite resolution or capacity.
 */

import * as crypto from 'crypto';
import {
  InfinityBaseState,
  ScaleVector,
  SpatialCoordXYZ,
  EpistemicStatus,
} from './types';
import { DualStateEntry, DualPolarity } from './dualStateSystem';
import { ScaleNotationParser } from './baseStateMatrix';

export type ScaleLevel = 1 | 2 | 3 | number;

export interface MultiScaleStateEntry {
  readonly multiScaleId: string;        // e.g. 'BASE-STATE-001(+)[S¹]', 'BASE-STATE-001(+)[S²]'
  readonly baseIndex: number;           // 1..100
  readonly canonicalStateId: string;    // 'BASE-STATE-001'
  readonly polaritySign: DualPolarity;  // '+' | '-'
  readonly scaleLevel: ScaleLevel;      // 1, 2, 3, ...
  readonly scaleNotation: string;       // e.g. 'S¹', 'S²', 'S³'
  readonly resolutionFactor: number;    // e.g. 2^(L-1)
  readonly effectiveCoord: SpatialCoordXYZ;
  readonly voxelResolution: number;     // Cell resolution volume metric
  readonly epistemicStatus: EpistemicStatus;
  readonly stateHash: string;
}

export interface ScaleTransitionResult {
  readonly transitionId: string;
  readonly fromLevel: ScaleLevel;
  readonly toLevel: ScaleLevel;
  readonly fromStateId: string;
  readonly toStateId: string;
  readonly scaleFactorDelta: number;
  readonly isLossless: boolean;
  readonly transitionChecksum: string;
  readonly targetCoord: SpatialCoordXYZ;
}

export interface CollisionReport {
  readonly totalEvaluated: number;
  readonly detectedCollisions: number;
  readonly collisionPairs: Array<{
    stateA: string;
    stateB: string;
    level: ScaleLevel;
    distance: number;
  }>;
}

export interface ScaleStorageMetric {
  readonly scaleLevel: ScaleLevel;
  readonly stateCount: number;
  readonly totalSerializedBytes: number;
  readonly averageBytesPerState: number;
  readonly heapFootprintEstimateBytes: number;
}

export class MultiScaleResolutionEngine {
  private readonly multiScaleStates: Map<string, MultiScaleStateEntry> = new Map();

  /**
   * Materializes multi-scale states across specified scale levels for input dual states
   */
  public materializeLevels(dualStates: ReadonlyArray<DualStateEntry>, levels: ScaleLevel[] = [1, 2, 3]): void {
    for (const dual of dualStates) {
      for (const level of levels) {
        const notation = ScaleNotationParser.formatSuperscript(level, 'S');
        const multiScaleId = dual.canonicalStateId + '(' + dual.polaritySign + ')[' + notation + ']';

        // Resolution multiplier doubling at each discrete octave level: R = 2^(level - 1)
        const resolutionFactor = Math.pow(2, level - 1);

        // Effective coordinate scaled by resolution factor
        const effectiveCoord: SpatialCoordXYZ = {
          x: Number((dual.coord.x * resolutionFactor).toFixed(6)),
          y: Number((dual.coord.y * resolutionFactor).toFixed(6)),
          z: Number((dual.coord.z * resolutionFactor).toFixed(6)),
        };

        // Bounded voxel resolution volume: V_voxel = 1 / R^3
        const voxelResolution = Number((1 / Math.pow(resolutionFactor, 3)).toFixed(8));

        const hashInput = multiScaleId + ':' + level + ':' + resolutionFactor + ':' + effectiveCoord.x + ',' + effectiveCoord.y + ',' + effectiveCoord.z;
        const stateHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        const entry: MultiScaleStateEntry = {
          multiScaleId,
          baseIndex: dual.baseIndex,
          canonicalStateId: dual.canonicalStateId,
          polaritySign: dual.polaritySign,
          scaleLevel: level,
          scaleNotation: notation,
          resolutionFactor,
          effectiveCoord,
          voxelResolution,
          epistemicStatus: EpistemicStatus.FORMAL_RESEARCH_HYPOTHESIS,
          stateHash,
        };

        this.multiScaleStates.set(multiScaleId, entry);
      }
    }
  }

  public getState(multiScaleId: string): MultiScaleStateEntry {
    const s = this.multiScaleStates.get(multiScaleId);
    if (!s) throw new Error('Multi-scale state not found: ' + multiScaleId);
    return s;
  }

  public getStatesByLevel(level: ScaleLevel): MultiScaleStateEntry[] {
    const results: MultiScaleStateEntry[] = [];
    for (const s of this.multiScaleStates.values()) {
      if (s.scaleLevel === level) results.push(s);
    }
    return results;
  }

  public getAllStates(): ReadonlyArray<MultiScaleStateEntry> {
    return Array.from(this.multiScaleStates.values());
  }

  public get size(): number {
    return this.multiScaleStates.size;
  }

  /**
   * Deterministic transition between scale levels
   */
  public static transitionScale(
    state: MultiScaleStateEntry,
    targetLevel: ScaleLevel
  ): ScaleTransitionResult {
    const fromFactor = state.resolutionFactor;
    const toFactor = Math.pow(2, targetLevel - 1);
    const scaleFactorDelta = toFactor / fromFactor;

    const targetCoord: SpatialCoordXYZ = {
      x: Number((state.effectiveCoord.x * scaleFactorDelta).toFixed(6)),
      y: Number((state.effectiveCoord.y * scaleFactorDelta).toFixed(6)),
      z: Number((state.effectiveCoord.z * scaleFactorDelta).toFixed(6)),
    };

    const targetNotation = ScaleNotationParser.formatSuperscript(targetLevel, 'S');
    const toStateId = state.canonicalStateId + '(' + state.polaritySign + ')[' + targetNotation + ']';
    const transitionId = 'TRANS[' + state.multiScaleId + '->' + toStateId + ']';

    const checksum = crypto.createHash('sha256')
      .update(transitionId + ':' + scaleFactorDelta + ':' + targetCoord.x + ',' + targetCoord.y + ',' + targetCoord.z)
      .digest('hex');

    return {
      transitionId,
      fromLevel: state.scaleLevel,
      toLevel: targetLevel,
      fromStateId: state.multiScaleId,
      toStateId,
      scaleFactorDelta,
      isLossless: true,
      transitionChecksum: checksum,
      targetCoord,
    };
  }

  /**
   * Reversible cycle verification: L1 -> L2 -> L1
   */
  public static verifyReversibility(
    state: MultiScaleStateEntry,
    intermediateLevel: ScaleLevel
  ): { isReversible: boolean; maxCoordinateError: number } {
    const forward = this.transitionScale(state, intermediateLevel);
    
    // Construct pseudo intermediate entry
    const intermediateEntry: MultiScaleStateEntry = {
      ...state,
      scaleLevel: intermediateLevel,
      resolutionFactor: Math.pow(2, intermediateLevel - 1),
      effectiveCoord: forward.targetCoord,
    };

    const backward = this.transitionScale(intermediateEntry, state.scaleLevel);

    const errX = Math.abs(backward.targetCoord.x - state.effectiveCoord.x);
    const errY = Math.abs(backward.targetCoord.y - state.effectiveCoord.y);
    const errZ = Math.abs(backward.targetCoord.z - state.effectiveCoord.z);
    const maxCoordinateError = Math.max(errX, errY, errZ);

    return {
      isReversible: maxCoordinateError < 1e-4,
      maxCoordinateError,
    };
  }

  /**
   * Evaluates spatial and discrete grid collisions across states
   */
  public static detectCollisions(
    states: MultiScaleStateEntry[],
    tolerance: number = 1e-5
  ): CollisionReport {
    const collisionPairs: Array<{ stateA: string; stateB: string; level: ScaleLevel; distance: number }> = [];

    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const a = states[i];
        const b = states[j];
        if (a.scaleLevel === b.scaleLevel) {
          const dx = a.effectiveCoord.x - b.effectiveCoord.x;
          const dy = a.effectiveCoord.y - b.effectiveCoord.y;
          const dz = a.effectiveCoord.z - b.effectiveCoord.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < tolerance) {
            collisionPairs.push({
              stateA: a.multiScaleId,
              stateB: b.multiScaleId,
              level: a.scaleLevel,
              distance: dist,
            });
          }
        }
      }
    }

    return {
      totalEvaluated: states.length,
      detectedCollisions: collisionPairs.length,
      collisionPairs,
    };
  }

  /**
   * Measures storage and memory growth requirements per scale level
   */
  public measureStorageRequirements(): ScaleStorageMetric[] {
    const levels = [1, 2, 3];
    const metrics: ScaleStorageMetric[] = [];

    for (const lvl of levels) {
      const states = this.getStatesByLevel(lvl);
      const serialized = JSON.stringify(states);
      const totalBytes = Buffer.byteLength(serialized, 'utf8');
      const count = states.length || 1;
      const averageBytesPerState = Number((totalBytes / count).toFixed(2));
      // Estimate in-memory heap footprint (V8 object overhead ~ 3x serialized JSON)
      const heapFootprintEstimateBytes = totalBytes * 3;

      metrics.push({
        scaleLevel: lvl,
        stateCount: states.length,
        totalSerializedBytes: totalBytes,
        averageBytesPerState,
        heapFootprintEstimateBytes,
      });
    }

    return metrics;
  }
}
