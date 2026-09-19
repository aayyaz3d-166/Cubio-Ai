/**
 * ============================================================================
 * CUBiO AI InfinityLM Research Layer - Compact State Addressing Engine
 * Task: PMA Task 373
 * Authority: ISO/IEC/IEEE 29119 PMA Forensic Architecture
 *
 * Implements a compact, procedural deterministic reference system for the
 * enlarged virtual state space. Every address encodes the generative recipe
 * into a compact packed format (64-bit / 16-hex characters) or maps to a valid
 * canonical state description, or explicitly reports UNREACHABLE_STATE.
 *
 * Epistemic Rules:
 * - NO EAGER PHYSICAL ALLOCATION: Generative addresses replace database rows.
 * - CANONICAL 369 INTEGRITY: Zero modifications to production Address 369.
 * - DETERMINISTIC VALIDATION: Corrupt, out-of-bounds, or unmaterializable
 *   addresses fail closed and return explicit error statuses.
 * - Non-mutating and strictly isolated from production CUBiO Core/VDB.
 * ============================================================================
 */

import * as crypto from 'crypto';
import { CoreSyncBoundary } from './coreSyncBoundary';
import {
  ExtendedStateGrammar,
  GrammarASTNode,
  CompositionRelation,
  GrammarOperator,
} from './extendedStateGrammar';
import {
  OnDemandReconstructionEngine,
  CompactStateRecipe,
  ReconstructedStateNode,
} from './onDemandReconstruction';
import { DualPolarity } from './dualStateSystem';
import { ScaleLevel } from './multiScaleEngine';

export interface PackedStateAddressFields {
  readonly rootBaseIndex: number;          // 1..100 (7 bits: 0..127)
  readonly polarity: DualPolarity;         // 1 bit: 0 = '+', 1 = '-'
  readonly scaleLevel: ScaleLevel;          // 2 bits: 1..3
  readonly level: number;                  // 2 bits: 1 = Atomic, 2 = Level-2 Compound, 3 = Transformed
  readonly relationCode: number;           // 2 bits: 0 = NONE, 1 = ENTANGLED, 2 = PROJECTED, 3 = TRANSITION
  readonly operatorCode: number;           // 3 bits: 0 = NONE, 1 = PHI_ROT, 2 = POL_INV, 3 = SCALE_OCT, 4 = HARMONIC_OFF
  readonly partnerBaseIndex: number;       // 7 bits: 0..100 (0 if none)
  readonly quantizedParameter: number;     // 8 bits: quantized parameter [0..255]
  readonly checksumTag: number;            // 8 bits: checksum validation tag
}

export type AddressResolutionStatus =
  | 'RESOLVED'
  | 'UNREACHABLE_STATE'
  | 'MALFORMED_ADDRESS'
  | 'CHECKSUM_MISMATCH';

export interface DecodedAddressRecord {
  readonly addressString: string;
  readonly fields: PackedStateAddressFields;
  readonly canonicalNotation: string;
  readonly compiledRecipe: CompactStateRecipe;
}

export interface AddressLookupResult {
  readonly address: string;
  readonly status: AddressResolutionStatus;
  readonly decoded?: DecodedAddressRecord;
  readonly reconstructedNode?: ReconstructedStateNode;
  readonly lookupLatencyUs: number;
  readonly errorMessage?: string;
}

export class CompactStateAddressingEngine {
  public static readonly ADDRESS_PREFIX = 'cva:0x';
  public static readonly CANONICAL_ADDRESS_HEX_LEN = 16; // 64 bits = 16 hex chars

  /**
   * Computes an 8-bit checksum tag for the packed address fields.
   */
  public static computeChecksumTag(
    base: number,
    pol: number,
    scale: number,
    lvl: number,
    rel: number,
    op: number,
    partner: number,
    param: number
  ): number {
    const raw = (base * 31 + pol * 17 + scale * 13 + lvl * 7 + rel * 23 + op * 29 + partner * 19 + param) & 0xff;
    return raw;
  }

  /**
   * Encodes a state into a 64-bit compact procedural hex address (cva:0x...).
   */
  public static encodeAddress(
    rootBaseIndex: number,
    polarity: DualPolarity = '+',
    scaleLevel: ScaleLevel = 1,
    level: number = 1,
    relation: CompositionRelation | 'NONE' = 'NONE',
    operator: GrammarOperator | 'NONE' = 'NONE',
    partnerBaseIndex: number = 0,
    parameter: number = 1.0
  ): string {
    if (rootBaseIndex < 1 || rootBaseIndex > 100) {
      throw new Error(`INVALID_BASE_INDEX: Root base index (${rootBaseIndex}) must be in range [1..100].`);
    }

    const polBit = polarity === '+' ? 0 : 1;
    const scaleBits = (scaleLevel - 1) & 0x03;
    const levelBits = (level - 1) & 0x03;

    const relMap: Record<string, number> = { NONE: 0, ENTANGLED: 1, PROJECTED: 2, TRANSITION: 3 };
    const relBits = relMap[relation] ?? 0;

    const opMap: Record<string, number> = {
      NONE: 0,
      PHI_ROT: 1,
      POL_INV: 2,
      SCALE_OCT: 3,
      HARMONIC_OFF: 4,
    };
    const opBits = opMap[operator] ?? 0;

    const partnerBits = partnerBaseIndex & 0x7f;
    const quantizedParam = Math.max(0, Math.min(255, Math.round(parameter * 50))) & 0xff;

    const checksumTag = this.computeChecksumTag(
      rootBaseIndex,
      polBit,
      scaleBits,
      levelBits,
      relBits,
      opBits,
      partnerBits,
      quantizedParam
    );

    // Pack into BigInt (64 bits total)
    // base (7) | pol (1) | scale (2) | level (2) | rel (2) | op (3) | partner (7) | param (8) | checksum (8) = 40 bits packed into 64-bit hex
    let packed = BigInt(0);
    packed |= BigInt(rootBaseIndex & 0x7f) << BigInt(33);
    packed |= BigInt(polBit & 0x01) << BigInt(32);
    packed |= BigInt(scaleBits & 0x03) << BigInt(30);
    packed |= BigInt(levelBits & 0x03) << BigInt(28);
    packed |= BigInt(relBits & 0x03) << BigInt(26);
    packed |= BigInt(opBits & 0x07) << BigInt(23);
    packed |= BigInt(partnerBits & 0x7f) << BigInt(16);
    packed |= BigInt(quantizedParam & 0xff) << BigInt(8);
    packed |= BigInt(checksumTag & 0xff);

    const hex = packed.toString(16).padStart(this.CANONICAL_ADDRESS_HEX_LEN, '0');
    return `${this.ADDRESS_PREFIX}${hex}`;
  }

  /**
   * Decodes a compact address string into generative fields and recipe.
   */
  public static decodeAddress(address: string): {
    readonly valid: boolean;
    readonly status: AddressResolutionStatus;
    readonly fields?: PackedStateAddressFields;
    readonly canonicalNotation?: string;
    readonly compiledRecipe?: CompactStateRecipe;
    readonly error?: string;
  } {
    if (!address.startsWith(this.ADDRESS_PREFIX)) {
      return { valid: false, status: 'MALFORMED_ADDRESS', error: 'Missing cva:0x prefix' };
    }

    const hexPart = address.slice(this.ADDRESS_PREFIX.length);
    if (hexPart.length !== this.CANONICAL_ADDRESS_HEX_LEN || !/^[0-9a-fA-F]+$/.test(hexPart)) {
      return { valid: false, status: 'MALFORMED_ADDRESS', error: 'Invalid hex format or length' };
    }

    let packed: bigint;
    try {
      packed = BigInt(`0x${hexPart}`);
    } catch {
      return { valid: false, status: 'MALFORMED_ADDRESS', error: 'Hex parsing failure' };
    }

    const checksumTag = Number(packed & BigInt(0xff));
    const quantizedParam = Number((packed >> BigInt(8)) & BigInt(0xff));
    const partnerBaseIndex = Number((packed >> BigInt(16)) & BigInt(0x7f));
    const opBits = Number((packed >> BigInt(23)) & BigInt(0x07));
    const relBits = Number((packed >> BigInt(26)) & BigInt(0x03));
    const levelBits = Number((packed >> BigInt(28)) & BigInt(0x03));
    const scaleBits = Number((packed >> BigInt(30)) & BigInt(0x03));
    const polBit = Number((packed >> BigInt(32)) & BigInt(0x01));
    const rootBaseIndex = Number((packed >> BigInt(33)) & BigInt(0x7f));

    // Validate ranges
    if (rootBaseIndex < 1 || rootBaseIndex > 100) {
      return { valid: false, status: 'UNREACHABLE_STATE', error: `Base index ${rootBaseIndex} out of valid range [1..100]` };
    }

    // Checksum verification
    const expectedChecksum = this.computeChecksumTag(
      rootBaseIndex,
      polBit,
      scaleBits,
      levelBits,
      relBits,
      opBits,
      partnerBaseIndex,
      quantizedParam
    );

    if (checksumTag !== expectedChecksum) {
      return { valid: false, status: 'CHECKSUM_MISMATCH', error: 'Tampered or corrupted address checksum' };
    }

    const polarity: DualPolarity = polBit === 0 ? '+' : '-';
    const scaleLevel = (scaleBits + 1) as ScaleLevel;
    const level = levelBits + 1;

    const relNames: CompositionRelation[] = ['ENTANGLED', 'PROJECTED', 'TRANSITION'];
    const relation: CompositionRelation | 'NONE' = relBits === 0 ? 'NONE' : relNames[relBits - 1];

    const opNames: GrammarOperator[] = ['PHI_ROT', 'POL_INV', 'SCALE_OCT', 'HARMONIC_OFF'];
    const operator: GrammarOperator | 'NONE' = opBits === 0 ? 'NONE' : opNames[opBits - 1];

    const parameter = quantizedParam / 50.0;

    const fields: PackedStateAddressFields = {
      rootBaseIndex,
      polarity,
      scaleLevel,
      level,
      relationCode: relBits,
      operatorCode: opBits,
      partnerBaseIndex,
      quantizedParameter: quantizedParam,
      checksumTag,
    };

    // Construct canonical AST & Recipe
    try {
      let ast: GrammarASTNode = ExtendedStateGrammar.createAtomicNode(rootBaseIndex, polarity, scaleLevel);

      if (relation !== 'NONE' && partnerBaseIndex >= 1 && partnerBaseIndex <= 100) {
        const partnerNode = ExtendedStateGrammar.createAtomicNode(partnerBaseIndex, '+', scaleLevel);
        ast = ExtendedStateGrammar.createComposedNode(relation, ast, partnerNode);
      }

      if (operator !== 'NONE') {
        ast = ExtendedStateGrammar.createTransformedNode(operator, ast, parameter);
      }

      const evaluation = ExtendedStateGrammar.evaluateAST(ast);

      return {
        valid: true,
        status: 'RESOLVED',
        fields,
        canonicalNotation: ast.canonicalNotation,
        compiledRecipe: evaluation.compiledRecipe,
      };
    } catch (err: any) {
      return {
        valid: false,
        status: 'UNREACHABLE_STATE',
        fields,
        error: err.message || 'Grammar evaluation error',
      };
    }
  }

  /**
   * Deterministically resolves an address to a concrete reconstructed state or explicit unreachable error.
   */
  public static resolveAddress(address: string): AddressLookupResult {
    const t0 = performance.now();
    const decodeRes = this.decodeAddress(address);

    if (!decodeRes.valid || !decodeRes.compiledRecipe) {
      const latency = (performance.now() - t0) * 1000;
      return {
        address,
        status: decodeRes.status,
        lookupLatencyUs: Number(latency.toFixed(2)),
        errorMessage: decodeRes.error,
      };
    }

    const recon = OnDemandReconstructionEngine.reconstructFromRecipe(decodeRes.compiledRecipe);
    const latency = (performance.now() - t0) * 1000;

    return {
      address,
      status: 'RESOLVED',
      decoded: {
        addressString: address,
        fields: decodeRes.fields!,
        canonicalNotation: decodeRes.canonicalNotation!,
        compiledRecipe: decodeRes.compiledRecipe,
      },
      reconstructedNode: recon,
      lookupLatencyUs: Number(latency.toFixed(2)),
    };
  }

  /**
   * Verifies production Core and VDB isolation.
   */
  public static verifyCoreSafety(): boolean {
    const integrity = CoreSyncBoundary.verifyCoreIntegrity();
    return integrity.vdbPristine && integrity.checkpointPristine;
  }
}
