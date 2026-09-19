/**
 * ============================================================================
 * CUBiO AI InfinityLM Research Layer - Extended State Grammar
 * Task: PMA Task 369
 * Authority: ISO/IEC/IEEE 29119 PMA Forensic Architecture
 *
 * Implements a formal, composable domain-specific grammar for InfinityLM states.
 * Enables the deterministic construction of higher-order compound states from
 * Base States, +/- polarities, scales, coordinates, transformations, and relations.
 *
 * Epistemic Rules:
 * - Deterministic parsing: EBNF recursive-descent parser producing canonical ASTs.
 * - Non-ambiguity: Normalized canonical formatting eliminates syntactic variance.
 * - Reconstruction semantics: Every composite expression compiles to an executable
 *   CompactStateRecipe from OnDemandReconstructionEngine.
 * - Recursion guards: Hard depth budget cap (D <= 8) prevents stack overflow and state explosion.
 * - Isolated from Core: Zero mutations to production Core, VDB, or Address 369 authority.
 * ============================================================================
 */

import * as crypto from 'crypto';
import { CoreSyncBoundary } from './coreSyncBoundary';
import { DualPolarity } from './dualStateSystem';
import { ScaleLevel } from './multiScaleEngine';
import { SpatialCoordXYZ } from './types';
import { BaseStateMatrix } from './baseStateMatrix';
import { XYZStateMapper } from './xyzStateMapping';
import { GoldenRatioEngine } from './goldenRatioEngine';
import {
  OnDemandReconstructionEngine,
  CompactStateRecipe,
  CompactLineageStep
} from './onDemandReconstruction';

export type GrammarNodeType = 'ATOMIC' | 'TRANSFORMED' | 'COMPOSED' | 'SUPERPOSITION';
export type GrammarOperator = 'PHI_ROT' | 'POL_INV' | 'SCALE_OCT' | 'HARMONIC_OFF';
export type CompositionRelation = 'ENTANGLED' | 'TRANSITION' | 'PROJECTED';

export interface BaseASTNode {
  readonly type: GrammarNodeType;
  readonly canonicalNotation: string;
  readonly urn: string;
  readonly depth: number;
}

export interface AtomicStateNode extends BaseASTNode {
  readonly type: 'ATOMIC';
  readonly baseIndex: number;
  readonly polarity: DualPolarity;
  readonly scaleLevel: ScaleLevel;
  readonly explicitCoord?: SpatialCoordXYZ;
}

export interface TransformedStateNode extends BaseASTNode {
  readonly type: 'TRANSFORMED';
  readonly operator: GrammarOperator;
  readonly operand: GrammarASTNode;
  readonly parameter: number;
}

export interface ComposedStateNode extends BaseASTNode {
  readonly type: 'COMPOSED';
  readonly relation: CompositionRelation;
  readonly left: GrammarASTNode;
  readonly right: GrammarASTNode;
}

export interface SuperpositionStateNode extends BaseASTNode {
  readonly type: 'SUPERPOSITION';
  readonly states: readonly GrammarASTNode[];
}

export type GrammarASTNode =
  | AtomicStateNode
  | TransformedStateNode
  | ComposedStateNode
  | SuperpositionStateNode;

export interface StateEvaluationResult {
  readonly canonicalNotation: string;
  readonly canonicalUrn: string;
  readonly depth: number;
  readonly netCoord: SpatialCoordXYZ;
  readonly compiledRecipe: CompactStateRecipe;
  readonly evaluatedStateHash: string;
  readonly evaluationLatencyUs: number;
}

export class ExtendedStateGrammar {
  public static readonly MAX_RECURSION_DEPTH = 8;
  public static readonly URN_GRAMMAR_PREFIX = 'urn:cubio:inf:grammar';

  /**
   * Evaluates an AST into concrete coordinates and an on-demand reconstruction recipe.
   */
  public static evaluateAST(node: GrammarASTNode): StateEvaluationResult {
    const t0 = performance.now();
    const matrix = new BaseStateMatrix();

    if (node.depth > this.MAX_RECURSION_DEPTH) {
      throw new Error(
        `RECURSION_BUDGET_EXCEEDED: Grammar expression depth (${node.depth}) exceeds hard cap (${this.MAX_RECURSION_DEPTH}).`
      );
    }

    let netCoord: SpatialCoordXYZ = { x: 0, y: 0, z: 0 };
    const lineageSteps: CompactLineageStep[] = [];
    let rootBaseIndex = 1;
    let initialPolarity: DualPolarity = '+';
    let initialScale: ScaleLevel = 1;

    switch (node.type) {
      case 'ATOMIC': {
        rootBaseIndex = node.baseIndex;
        initialPolarity = node.polarity;
        initialScale = node.scaleLevel;

        if (node.explicitCoord) {
          netCoord = { ...node.explicitCoord };
        } else {
          const rootState = matrix.getState(node.baseIndex);
          const mapped = XYZStateMapper.mapToXYZ(
            node.baseIndex,
            node.polarity,
            node.scaleLevel,
            rootState.category,
            rootState.harmonicRoot
          );
          netCoord = mapped.normalizedCoord;
        }
        break;
      }

      case 'TRANSFORMED': {
        const subResult = this.evaluateAST(node.operand);
        rootBaseIndex = subResult.compiledRecipe.rootBaseIndex;
        initialPolarity = subResult.compiledRecipe.initialPolarity;
        initialScale = subResult.compiledRecipe.initialScale;

        lineageSteps.push(...subResult.compiledRecipe.lineageSteps);

        let ruleType: 'PHI_SCALE_ROTATION' | 'POLARITY_INVERSION' | 'SCALE_TRANSITION' | 'HARMONIC_OFFSET' =
          'PHI_SCALE_ROTATION';

        if (node.operator === 'PHI_ROT') {
          ruleType = 'PHI_SCALE_ROTATION';
          const transformed = GoldenRatioEngine.transform(subResult.netCoord, {
            powerOrder: 1,
            rotationAngleRad: 0.239996 * node.parameter,
          });
          netCoord = transformed.transformedCoord;
        } else if (node.operator === 'POL_INV') {
          ruleType = 'POLARITY_INVERSION';
          netCoord = { x: subResult.netCoord.x, y: -subResult.netCoord.y, z: subResult.netCoord.z };
        } else if (node.operator === 'SCALE_OCT') {
          ruleType = 'SCALE_TRANSITION';
          const factor = Math.pow(2, node.parameter);
          netCoord = {
            x: Number((subResult.netCoord.x * factor).toFixed(6)),
            y: Number((subResult.netCoord.y * factor).toFixed(6)),
            z: Number((subResult.netCoord.z * factor).toFixed(6)),
          };
        } else if (node.operator === 'HARMONIC_OFF') {
          ruleType = 'HARMONIC_OFFSET';
          netCoord = {
            x: Number((subResult.netCoord.x + node.parameter * 0.1).toFixed(6)),
            y: Number((subResult.netCoord.y + node.parameter * 0.1).toFixed(6)),
            z: Number((subResult.netCoord.z + node.parameter * 0.05).toFixed(6)),
          };
        }

        lineageSteps.push({
          stepIndex: lineageSteps.length + 1,
          rule: ruleType,
          parameter: node.parameter,
        });
        break;
      }

      case 'COMPOSED': {
        const leftRes = this.evaluateAST(node.left);
        const rightRes = this.evaluateAST(node.right);

        rootBaseIndex = leftRes.compiledRecipe.rootBaseIndex;
        initialPolarity = leftRes.compiledRecipe.initialPolarity;
        initialScale = leftRes.compiledRecipe.initialScale;

        lineageSteps.push(...leftRes.compiledRecipe.lineageSteps);

        // Blend coordinates according to composition relation
        if (node.relation === 'ENTANGLED') {
          netCoord = {
            x: Number(((leftRes.netCoord.x + rightRes.netCoord.x) / 2).toFixed(6)),
            y: Number(((leftRes.netCoord.y + rightRes.netCoord.y) / 2).toFixed(6)),
            z: Number(((leftRes.netCoord.z + rightRes.netCoord.z) / 2).toFixed(6)),
          };
        } else if (node.relation === 'PROJECTED') {
          netCoord = {
            x: Number((leftRes.netCoord.x * 0.7 + rightRes.netCoord.x * 0.3).toFixed(6)),
            y: Number((leftRes.netCoord.y * 0.7 + rightRes.netCoord.y * 0.3).toFixed(6)),
            z: Number((leftRes.netCoord.z * 0.7 + rightRes.netCoord.z * 0.3).toFixed(6)),
          };
        } else {
          // TRANSITION
          netCoord = { ...rightRes.netCoord };
        }

        lineageSteps.push({
          stepIndex: lineageSteps.length + 1,
          rule: 'HARMONIC_OFFSET',
          parameter: 1.0,
        });
        break;
      }

      case 'SUPERPOSITION': {
        if (node.states.length === 0) {
          throw new Error('INVALID_SUPERPOSITION: Superposition must contain at least 1 state.');
        }

        const subResults = node.states.map((s) => this.evaluateAST(s));
        rootBaseIndex = subResults[0].compiledRecipe.rootBaseIndex;
        initialPolarity = subResults[0].compiledRecipe.initialPolarity;
        initialScale = subResults[0].compiledRecipe.initialScale;

        lineageSteps.push(...subResults[0].compiledRecipe.lineageSteps);

        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;
        for (const sr of subResults) {
          sumX += sr.netCoord.x;
          sumY += sr.netCoord.y;
          sumZ += sr.netCoord.z;
        }

        const k = subResults.length;
        netCoord = {
          x: Number((sumX / k).toFixed(6)),
          y: Number((sumY / k).toFixed(6)),
          z: Number((sumZ / k).toFixed(6)),
        };

        lineageSteps.push({
          stepIndex: lineageSteps.length + 1,
          rule: 'PHI_SCALE_ROTATION',
          parameter: 1.0 / k,
        });
        break;
      }
    }

    const statePayload = `${node.urn}|${netCoord.x}|${netCoord.y}|${netCoord.z}|${lineageSteps.length}`;
    const evaluatedStateHash = crypto.createHash('sha256').update(statePayload).digest('hex');

    const compiledRecipe: CompactStateRecipe = OnDemandReconstructionEngine.mintRecipe(
      rootBaseIndex,
      initialPolarity,
      initialScale,
      lineageSteps,
      node.urn,
      evaluatedStateHash
    );

    const latencyUs = (performance.now() - t0) * 1000;

    return {
      canonicalNotation: node.canonicalNotation,
      canonicalUrn: node.urn,
      depth: node.depth,
      netCoord,
      compiledRecipe,
      evaluatedStateHash,
      evaluationLatencyUs: Number(latencyUs.toFixed(2)),
    };
  }

  /**
   * Deterministically mints a canonical URN from an AST node structure.
   */
  public static mintNodeUrn(type: GrammarNodeType, canonicalNotation: string, depth: number): string {
    const digest = crypto.createHash('sha256').update(canonicalNotation).digest('hex').slice(0, 16);
    return `${this.URN_GRAMMAR_PREFIX}:${type.toLowerCase()}:d${depth}:${digest}`;
  }

  /**
   * Helper to construct an Atomic AST node.
   */
  public static createAtomicNode(
    baseIndex: number,
    polarity: DualPolarity = '+',
    scaleLevel: ScaleLevel = 1,
    explicitCoord?: SpatialCoordXYZ
  ): AtomicStateNode {
    if (baseIndex < 1 || baseIndex > 100) {
      throw new Error(`INVALID_BASE_INDEX: Base index (${baseIndex}) must be in range [1..100].`);
    }

    const padIdx = baseIndex.toString().padStart(3, '0');
    let notation = `BASE-${padIdx}(${polarity})[S${scaleLevel}]`;
    if (explicitCoord) {
      notation += `@(${explicitCoord.x.toFixed(4)},${explicitCoord.y.toFixed(4)},${explicitCoord.z.toFixed(4)})`;
    }

    const urn = this.mintNodeUrn('ATOMIC', notation, 0);

    return {
      type: 'ATOMIC',
      canonicalNotation: notation,
      urn,
      depth: 0,
      baseIndex,
      polarity,
      scaleLevel,
      explicitCoord,
    };
  }

  /**
   * Helper to construct a Transformed AST node.
   */
  public static createTransformedNode(
    operator: GrammarOperator,
    operand: GrammarASTNode,
    parameter: number = 1.0
  ): TransformedStateNode {
    const nextDepth = operand.depth + 1;
    if (nextDepth > this.MAX_RECURSION_DEPTH) {
      throw new Error(
        `RECURSION_BUDGET_EXCEEDED: Cannot create transformed node at depth ${nextDepth} (max: ${this.MAX_RECURSION_DEPTH}).`
      );
    }

    const notation = `${operator}(${operand.canonicalNotation},${Number(parameter.toFixed(4))})`;
    const urn = this.mintNodeUrn('TRANSFORMED', notation, nextDepth);

    return {
      type: 'TRANSFORMED',
      canonicalNotation: notation,
      urn,
      depth: nextDepth,
      operator,
      operand,
      parameter,
    };
  }

  /**
   * Helper to construct a Composed AST node.
   */
  public static createComposedNode(
    relation: CompositionRelation,
    left: GrammarASTNode,
    right: GrammarASTNode
  ): ComposedStateNode {
    const nextDepth = Math.max(left.depth, right.depth) + 1;
    if (nextDepth > this.MAX_RECURSION_DEPTH) {
      throw new Error(
        `RECURSION_BUDGET_EXCEEDED: Cannot create composed node at depth ${nextDepth} (max: ${this.MAX_RECURSION_DEPTH}).`
      );
    }

    const opSymbol = relation === 'ENTANGLED' ? '<*>' : relation === 'PROJECTED' ? '<+>' : '-->';
    const notation = `(${left.canonicalNotation} ${opSymbol} ${right.canonicalNotation})`;
    const urn = this.mintNodeUrn('COMPOSED', notation, nextDepth);

    return {
      type: 'COMPOSED',
      canonicalNotation: notation,
      urn,
      depth: nextDepth,
      relation,
      left,
      right,
    };
  }

  /**
   * Helper to construct a Superposition AST node.
   */
  public static createSuperpositionNode(states: readonly GrammarASTNode[]): SuperpositionStateNode {
    if (states.length === 0) {
      throw new Error('INVALID_SUPERPOSITION: Must specify at least 1 state.');
    }

    const maxChildDepth = Math.max(...states.map((s) => s.depth));
    const nextDepth = maxChildDepth + 1;
    if (nextDepth > this.MAX_RECURSION_DEPTH) {
      throw new Error(
        `RECURSION_BUDGET_EXCEEDED: Superposition depth ${nextDepth} exceeds max ${this.MAX_RECURSION_DEPTH}.`
      );
    }

    // Sort child notations for deterministic canonical representation
    const sortedNotations = [...states.map((s) => s.canonicalNotation)].sort();
    const notation = `{${sortedNotations.join(' | ')}}`;
    const urn = this.mintNodeUrn('SUPERPOSITION', notation, nextDepth);

    return {
      type: 'SUPERPOSITION',
      canonicalNotation: notation,
      urn,
      depth: nextDepth,
      states,
    };
  }

  /**
   * Parses simple state expression strings into canonical ASTs.
   * Handles:
   * - BASE-001(+)[S1]
   * - PHI_ROT(BASE-001(+)[S1],1.5)
   * - (BASE-001(+)[S1] <*> BASE-002(-)[S1])
   * - {BASE-001(+)[S1] | BASE-002(-)[S1]}
   */
  public static parseExpression(input: string): GrammarASTNode {
    const clean = input.trim();

    // 1. Superposition: { ... | ... }
    if (clean.startsWith('{') && clean.endsWith('}')) {
      const inner = clean.slice(1, -1).trim();
      const parts = inner.split('|').map((p) => p.trim());
      const childNodes = parts.map((p) => this.parseExpression(p));
      return this.createSuperpositionNode(childNodes);
    }

    // 2. Composed: (left OP right)
    if (clean.startsWith('(') && clean.endsWith(')')) {
      const inner = clean.slice(1, -1).trim();
      let splitIdx = -1;
      let rel: CompositionRelation = 'ENTANGLED';

      if (inner.includes('<*>')) {
        splitIdx = inner.indexOf('<*>');
        rel = 'ENTANGLED';
      } else if (inner.includes('<+>')) {
        splitIdx = inner.indexOf('<+>');
        rel = 'PROJECTED';
      } else if (inner.includes('-->')) {
        splitIdx = inner.indexOf('-->');
        rel = 'TRANSITION';
      }

      if (splitIdx !== -1) {
        const leftStr = inner.slice(0, splitIdx).trim();
        const opLen = rel === 'TRANSITION' ? 3 : 3;
        const rightStr = inner.slice(splitIdx + opLen).trim();
        const leftNode = this.parseExpression(leftStr);
        const rightNode = this.parseExpression(rightStr);
        return this.createComposedNode(rel, leftNode, rightNode);
      }
    }

    // 3. Transformed: OP(operand,param)
    const opMatch = clean.match(/^(PHI_ROT|POL_INV|SCALE_OCT|HARMONIC_OFF)\((.*)\)$/);
    if (opMatch) {
      const operator = opMatch[1] as GrammarOperator;
      const argsStr = opMatch[2];
      const lastComma = argsStr.lastIndexOf(',');
      if (lastComma !== -1) {
        const operandStr = argsStr.slice(0, lastComma).trim();
        const paramStr = argsStr.slice(lastComma + 1).trim();
        const param = parseFloat(paramStr);
        const operandNode = this.parseExpression(operandStr);
        return this.createTransformedNode(operator, operandNode, isNaN(param) ? 1.0 : param);
      } else {
        const operandNode = this.parseExpression(argsStr.trim());
        return this.createTransformedNode(operator, operandNode, 1.0);
      }
    }

    // 4. Atomic: BASE-001(+)[S1]
    const atomicMatch = clean.match(/^BASE-(\d{1,3})\(([+-])\)\[S(\d+)\](?:@\((-?\d+\.?\d*),(-?\d+\.?\d*),(-?\d+\.?\d*)\))?$/);
    if (atomicMatch) {
      const baseIdx = parseInt(atomicMatch[1], 10);
      const polarity = atomicMatch[2] as DualPolarity;
      const scaleLevel = parseInt(atomicMatch[3], 10) as ScaleLevel;

      let explicitCoord: SpatialCoordXYZ | undefined;
      if (atomicMatch[4] !== undefined) {
        explicitCoord = {
          x: parseFloat(atomicMatch[4]),
          y: parseFloat(atomicMatch[5]),
          z: parseFloat(atomicMatch[6]),
        };
      }

      return this.createAtomicNode(baseIdx, polarity, scaleLevel, explicitCoord);
    }

    throw new Error(`SYNTAX_ERROR: Unrecognized state grammar expression "${clean}".`);
  }

  /**
   * Deterministically serializes AST node to JSON string with integrity checksum.
   */
  public static serializeAST(node: GrammarASTNode): {
    readonly json: string;
    readonly checksum: string;
  } {
    const json = JSON.stringify(node, null, 2);
    const checksum = crypto.createHash('sha256').update(json).digest('hex');
    return { json, checksum };
  }

  /**
   * Verifies that the grammar engine remains strictly isolated from production Core.
   */
  public static verifyCoreSafety(): boolean {
    const integrity = CoreSyncBoundary.verifyCoreIntegrity();
    return integrity.vdbPristine && integrity.checkpointPristine;
  }
}
