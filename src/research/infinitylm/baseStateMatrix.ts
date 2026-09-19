/**
 * CUBiO AI — PMA Task 347: Base State Matrix 1–100
 * src/research/infinitylm/baseStateMatrix.ts
 *
 * Canonical implementation of the InfinityLM Base State Matrix containing states 1 through 100.
 * Isolated from and non-mutating toward CUBiO Core/VDB.
 */

import * as crypto from 'crypto';
import {
  InfinityBaseState,
  ScaleTier,
  ScaleVector,
  PolarityVariant,
  SpatialCoordXYZ,
  EpistemicStatus,
} from './types';

export interface BaseStateEntry {
  readonly index: number;             // [1..100]
  readonly id: string;                // 'BASE-STATE-001' .. 'BASE-STATE-100'
  readonly name: string;              // Canonical semantic label
  readonly category: InfinityBaseState;
  readonly polarity: PolarityVariant;
  readonly scaleNotation: string;     // e.g. 'S¹', 'S²', etc.
  readonly scale: ScaleVector;
  readonly coord: SpatialCoordXYZ;
  readonly harmonicRoot: number;      // 1..9 (digital root modulo 9)
  readonly epistemicStatus: EpistemicStatus;
  readonly stateHash: string;
}

export class ScaleNotationParser {
  private static readonly SUPERSCRIPTS: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻', '+': '⁺'
  };

  private static readonly REVERSE_SUPERSCRIPTS: Record<string, string> = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '-', '⁺': '+'
  };

  /**
   * Formats scale power to unicode superscript notation (e.g., 1 -> 'S¹')
   */
  public static formatSuperscript(power: number, prefix: string = 'S'): string {
    const str = power.toString();
    let result = prefix;
    for (const ch of str) {
      result += this.SUPERSCRIPTS[ch] || ch;
    }
    return result;
  }

  /**
   * Parses unicode superscript notation back to numeric scale exponent
   */
  public static parseSuperscript(notation: string): number {
    const cleaned = notation.replace(/^[A-Za-z]+/, '');
    let numStr = '';
    for (const ch of cleaned) {
      numStr += this.REVERSE_SUPERSCRIPTS[ch] || ch;
    }
    const val = parseInt(numStr, 10);
    return isNaN(val) ? 1 : val;
  }
}

export class BaseStateMatrix {
  private readonly matrix: Map<number, BaseStateEntry> = new Map();

  constructor() {
    this.materializeMatrix();
  }

  /**
   * Deterministically constructs canonical states 1 through 100
   */
  private materializeMatrix(): void {
    const baseCategories = [
      InfinityBaseState.GROUND,
      InfinityBaseState.EXCITATION,
      InfinityBaseState.SUPERPOSITION,
      InfinityBaseState.ENTANGLEMENT,
      InfinityBaseState.DISSIPATION,
      InfinityBaseState.COHERENCE,
      InfinityBaseState.COLLAPSE,
    ];

    for (let i = 1; i <= 100; i++) {
      const id = 'BASE-STATE-' + i.toString().padStart(3, '0');
      
      // Determine base category cycling deterministically across the 7 canonical base states
      const category = baseCategories[(i - 1) % baseCategories.length];

      // Polarity: alternating forward / inverse around balanced ground states
      let polarity: PolarityVariant = PolarityVariant.BALANCED;
      if (category === InfinityBaseState.GROUND) {
        polarity = PolarityVariant.BALANCED;
      } else if (i % 2 === 0) {
        polarity = PolarityVariant.FORWARD;
      } else {
        polarity = PolarityVariant.INVERSE;
      }

      // Digital root modulo 9 (matching the 369 harmonic substrate)
      const harmonicRoot = ((i - 1) % 9) + 1;

      // Scale assignment: scale level 1 notation 'S¹' as defined, with tier progressing predictably
      const scalePower = 1; // Explicitly defined S¹ scale
      const scaleNotation = ScaleNotationParser.formatSuperscript(scalePower, 'S');

      // Scale tier based on decade
      let tier = ScaleTier.PLANCK;
      if (i <= 10) tier = ScaleTier.PLANCK;
      else if (i <= 25) tier = ScaleTier.SUBATOMIC;
      else if (i <= 50) tier = ScaleTier.ATOMIC;
      else if (i <= 75) tier = ScaleTier.MESOSCOPIC;
      else if (i <= 90) tier = ScaleTier.MACROSCOPIC;
      else tier = ScaleTier.COSMIC;

      const scale: ScaleVector = {
        tier,
        exponent: scalePower,
        coefficient: Number((1.0 + (i % 10) * 0.1).toFixed(2)),
        units: 'canonical_scale_units',
      };

      // Continuous XYZ coordinates deterministically generated within unit bounding space
      const theta = (2 * Math.PI * (i - 1)) / 100;
      const r = Math.sin(harmonicRoot);
      const coord: SpatialCoordXYZ = {
        x: Number((Math.cos(theta) * 10).toFixed(6)),
        y: Number((Math.sin(theta) * 10).toFixed(6)),
        z: Number((r * 5).toFixed(6)),
      };

      const name = category + '_LEVEL_' + i.toString().padStart(3, '0') + '_' + scaleNotation;

      // Deterministic SHA-256 state hash
      const hashData = id + ':' + name + ':' + category + ':' + polarity + ':' + scaleNotation + ':' + coord.x + ',' + coord.y + ',' + coord.z;
      const stateHash = crypto.createHash('sha256').update(hashData).digest('hex');

      const entry: BaseStateEntry = {
        index: i,
        id,
        name,
        category,
        polarity,
        scaleNotation,
        scale,
        coord,
        harmonicRoot,
        epistemicStatus: EpistemicStatus.FORMAL_RESEARCH_HYPOTHESIS,
        stateHash,
      };

      this.matrix.set(i, entry);
    }
  }

  public getState(index: number): BaseStateEntry {
    if (index < 1 || index > 100) {
      throw new Error('Index out of bounds: Base State Matrix is strictly bounded to [1..100]. Requested: ' + index);
    }
    const state = this.matrix.get(index);
    if (!state) {
      throw new Error('State at index ' + index + ' not found.');
    }
    return state;
  }

  public getStateById(id: string): BaseStateEntry | undefined {
    for (const state of this.matrix.values()) {
      if (state.id === id) return state;
    }
    return undefined;
  }

  public getAllStates(): ReadonlyArray<BaseStateEntry> {
    return Array.from(this.matrix.values());
  }

  public get size(): number {
    return this.matrix.size;
  }

  /**
   * Lossless JSON serialization
   */
  public toJSON(): string {
    return JSON.stringify(Array.from(this.matrix.values()), null, 2);
  }

  /**
   * Reconstitutes matrix from serialized JSON representation
   */
  public static fromJSON(jsonStr: string): BaseStateMatrix {
    const data: BaseStateEntry[] = JSON.parse(jsonStr);
    if (!Array.isArray(data) || data.length !== 100) {
      throw new Error('Invalid JSON format: Base State Matrix requires exactly 100 entries.');
    }

    const instance = new BaseStateMatrix();
    // Validate that deserialized entries match internal derivation
    for (const item of data) {
      const derived = instance.getState(item.index);
      if (derived.stateHash !== item.stateHash || derived.id !== item.id) {
        throw new Error('Integrity mismatch in deserialized state at index ' + item.index);
      }
    }
    return instance;
  }

  /**
   * Verifies total matrix integrity, uniqueness, and bounds
   */
  public verifyIntegrity(): {
    totalStates: number;
    uniqueIds: boolean;
    uniqueHashes: boolean;
    boundedIndices: boolean;
    scaleOneNotationValid: boolean;
  } {
    const ids = new Set<string>();
    const hashes = new Set<string>();
    let bounded = true;
    let scaleOneValid = true;

    for (const [idx, entry] of this.matrix.entries()) {
      if (idx < 1 || idx > 100) bounded = false;
      ids.add(entry.id);
      hashes.add(entry.stateHash);
      if (!entry.scaleNotation.includes('¹')) scaleOneValid = false;
    }

    return {
      totalStates: this.matrix.size,
      uniqueIds: ids.size === 100,
      uniqueHashes: hashes.size === 100,
      boundedIndices: bounded && this.matrix.size === 100,
      scaleOneNotationValid: scaleOneValid,
    };
  }
}
