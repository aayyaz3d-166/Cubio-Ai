/**
 * CUBiO AI — PMA Task 348: Dual State System
 * src/research/infinitylm/dualStateSystem.ts
 *
 * Implements the InfinityLM dual-state representation for each canonical Base State (1-100).
 * Represents + and - as explicit, configurable structural state variants.
 */

import * as crypto from 'crypto';
import {
  InfinityBaseState,
  ScaleVector,
  SpatialCoordXYZ,
  EpistemicStatus,
  PolarityVariant,
} from './types';
import { BaseStateMatrix, BaseStateEntry } from './baseStateMatrix';

export type DualPolarity = '+' | '-';

export enum DualSemanticMode {
  COMPUTATIONAL_DIRECTION = 'COMPUTATIONAL_DIRECTION', // +: Forward generative, -: Inverse reconstruction
  PHASE_CONJUGATE = 'PHASE_CONJUGATE',                 // +: Base phase, -: Conjugate negative phase
  COORDINATE_REFLECTION = 'COORDINATE_REFLECTION',     // +: Direct coordinate, -: Inverted coordinate
  CUSTOM = 'CUSTOM',                                   // User-defined configurable mapping
}

export interface DualSemanticProfile {
  readonly mode: DualSemanticMode;
  readonly description: string;
  readonly coordinateTransform?: (coord: SpatialCoordXYZ, sign: DualPolarity) => SpatialCoordXYZ;
  readonly metadata?: Record<string, unknown>;
}

export interface DualStateEntry {
  readonly dualId: string;                // e.g. 'BASE-STATE-001(+)', 'BASE-STATE-001(-)'
  readonly canonicalStateId: string;      // e.g. 'BASE-STATE-001'
  readonly baseIndex: number;             // 1..100
  readonly polaritySign: DualPolarity;    // '+' | '-'
  readonly semanticMode: DualSemanticMode;
  readonly category: InfinityBaseState;
  readonly scaleNotation: string;         // e.g. 'S¹(+)', 'S¹(-)'
  readonly scale: ScaleVector;
  readonly coord: SpatialCoordXYZ;
  readonly harmonicRoot: number;          // 1..9
  readonly epistemicStatus: EpistemicStatus;
  readonly stateHash: string;
}

export interface DualComparisonResult {
  readonly isConjugatePair: boolean;
  readonly sameBaseIndex: boolean;
  readonly polarityDelta: number; // 0 if same, 2 if opposite
  readonly spatialDistance: number;
  readonly identicalState: boolean;
}

export class DualStateSystem {
  private readonly dualStates: Map<string, DualStateEntry> = new Map();
  private readonly profile: DualSemanticProfile;

  constructor(profile?: DualSemanticProfile, baseMatrix?: BaseStateMatrix) {
    this.profile = profile || {
      mode: DualSemanticMode.COMPUTATIONAL_DIRECTION,
      description: 'Default computational direction: (+) forward evolution, (-) inverse reconstruction',
    };
    this.materializeDualStates(baseMatrix || new BaseStateMatrix());
  }

  private materializeDualStates(matrix: BaseStateMatrix): void {
    const signs: DualPolarity[] = ['+', '-'];

    for (let i = 1; i <= 100; i++) {
      const baseState = matrix.getState(i);

      for (const sign of signs) {
        const dualId = baseState.id + '(' + sign + ')';
        const scaleNotation = baseState.scaleNotation + '(' + sign + ')';

        // Apply coordinate modulation according to semantic profile
        let coord: SpatialCoordXYZ = { ...baseState.coord };
        if (this.profile.coordinateTransform) {
          coord = this.profile.coordinateTransform(baseState.coord, sign);
        } else if (this.profile.mode === DualSemanticMode.COORDINATE_REFLECTION) {
          coord = sign === '+'
            ? { ...baseState.coord }
            : { x: -baseState.coord.x, y: -baseState.coord.y, z: -baseState.coord.z };
        } else if (this.profile.mode === DualSemanticMode.PHASE_CONJUGATE) {
          coord = sign === '+'
            ? { ...baseState.coord }
            : { x: baseState.coord.x, y: -baseState.coord.y, z: baseState.coord.z };
        } else {
          // COMPUTATIONAL_DIRECTION: coordinate remains stable, operational direction stored explicitly
          coord = { ...baseState.coord };
        }

        // Deterministic SHA-256 hash incorporating polarity sign and semantic mode
        const hashInput = dualId + ':' + baseState.name + ':' + sign + ':' + this.profile.mode + ':' + scaleNotation + ':' + coord.x + ',' + coord.y + ',' + coord.z;
        const stateHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        const entry: DualStateEntry = {
          dualId,
          canonicalStateId: baseState.id,
          baseIndex: i,
          polaritySign: sign,
          semanticMode: this.profile.mode,
          category: baseState.category,
          scaleNotation,
          scale: baseState.scale,
          coord,
          harmonicRoot: baseState.harmonicRoot,
          epistemicStatus: EpistemicStatus.FORMAL_RESEARCH_HYPOTHESIS,
          stateHash,
        };

        this.dualStates.set(dualId, entry);
      }
    }
  }

  public getDualState(index: number, sign: DualPolarity): DualStateEntry {
    if (index < 1 || index > 100) {
      throw new Error('Index out of bounds [1..100]: ' + index);
    }
    const id = 'BASE-STATE-' + index.toString().padStart(3, '0') + '(' + sign + ')';
    const state = this.dualStates.get(id);
    if (!state) {
      throw new Error('Dual state not found for ' + id);
    }
    return state;
  }

  public getDualPair(index: number): { positive: DualStateEntry; negative: DualStateEntry } {
    return {
      positive: this.getDualState(index, '+'),
      negative: this.getDualState(index, '-'),
    };
  }

  public getAllDualStates(): ReadonlyArray<DualStateEntry> {
    return Array.from(this.dualStates.values());
  }

  public get size(): number {
    return this.dualStates.size;
  }

  public get activeProfile(): DualSemanticProfile {
    return this.profile;
  }

  /**
   * Compares two dual states
   */
  public static compare(a: DualStateEntry, b: DualStateEntry): DualComparisonResult {
    const isConjugatePair = a.baseIndex === b.baseIndex && a.polaritySign !== b.polaritySign;
    const sameBaseIndex = a.baseIndex === b.baseIndex;
    const polarityDelta = a.polaritySign === b.polaritySign ? 0 : 2;

    const dx = a.coord.x - b.coord.x;
    const dy = a.coord.y - b.coord.y;
    const dz = a.coord.z - b.coord.z;
    const spatialDistance = Number(Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(6));

    const identicalState = a.dualId === b.dualId && a.stateHash === b.stateHash;

    return {
      isConjugatePair,
      sameBaseIndex,
      polarityDelta,
      spatialDistance,
      identicalState,
    };
  }

  /**
   * JSON serialization
   */
  public toJSON(): string {
    return JSON.stringify({
      profile: this.profile,
      states: Array.from(this.dualStates.values()),
    }, null, 2);
  }

  /**
   * Reconstitutes DualStateSystem from JSON
   */
  public static fromJSON(jsonStr: string): DualStateSystem {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.states) || parsed.states.length !== 200) {
      throw new Error('Invalid JSON: expected exactly 200 dual states.');
    }

    const system = new DualStateSystem(parsed.profile);
    // Verify each deserialized state matches internally derived state
    for (const item of parsed.states as DualStateEntry[]) {
      const derived = system.getDualState(item.baseIndex, item.polaritySign);
      if (derived.stateHash !== item.stateHash || derived.dualId !== item.dualId) {
        throw new Error('Integrity verification failed for dual state ' + item.dualId);
      }
    }
    return system;
  }

  /**
   * Integrity audit covering 200 states
   */
  public verifyIntegrity(): {
    totalDualStates: number;
    uniqueDualIds: boolean;
    uniqueHashes: boolean;
    pairCoverage: boolean;
  } {
    const ids = new Set<string>();
    const hashes = new Set<string>();
    let pairsValid = true;

    for (let i = 1; i <= 100; i++) {
      const pair = this.getDualPair(i);
      if (!pair.positive || !pair.negative) pairsValid = false;
      ids.add(pair.positive.dualId);
      ids.add(pair.negative.dualId);
      hashes.add(pair.positive.stateHash);
      hashes.add(pair.negative.stateHash);
    }

    return {
      totalDualStates: this.dualStates.size,
      uniqueDualIds: ids.size === 200,
      uniqueHashes: hashes.size === 200,
      pairCoverage: pairsValid && this.dualStates.size === 200,
    };
  }
}
