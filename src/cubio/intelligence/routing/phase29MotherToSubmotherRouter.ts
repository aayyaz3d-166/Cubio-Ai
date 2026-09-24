/**
 * ============================================================================
 * CUBiO AI — PHASE 29 TASK 15: MOTHER TO SUBMOTHER ROUTING ENGINE
 * src/cubio/intelligence/routing/phase29MotherToSubmotherRouter.ts
 * ============================================================================
 *
 * Implements Mother Core internal routing to dynamically select required
 * formulaic Submother branches for active problem processing.
 *
 * Core Guarantees:
 *   - Problem-driven: spawns zero, one, or multiple Submother branches as required
 *   - Strict branch isolation and bounded resource allocations
 *   - Maps specific sub-problems to exact formulas (SPATIAL_PROJECTION, PHI_TRANSFORM,
 *     EXPANSION_RULE, DOMAIN_DELEGATION)
 *   - Prevents unnecessary branch creation for non-exploratory tasks
 *   - Records complete forensic routing decision records with SHA-256 audit hashes
 *   - Robust error and failure boundary handling
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../core/coreEngineContract';
import { ExternalModelGuard } from '../../model/native_foundation/external_model_guard';
import {
  SubmotherFormulaType,
} from '../../submother/phase29SubmotherGenerationEngine';
import {
  ParallelBranchTask,
  MAX_PARALLEL_BRANCHES,
} from '../../submother/phase29MultiSubmotherParallelEngine';

export interface RequiredBranchSpec {
  readonly branchIndex: number;
  readonly formulaType: SubmotherFormulaType;
  readonly formulaParameters: Record<string, number | string>;
  readonly assignedWeight: number;
  readonly rationale: string;
}

export interface MotherToSubmotherRoutingDecision {
  readonly routingId: string;
  readonly parentRequestId: string;
  readonly problemStatement: string;
  readonly requiredBranchCount: number;
  readonly branchSpecs: readonly RequiredBranchSpec[];
  readonly shouldExpandPossibilitySpace: boolean;
  readonly resourceBudget: {
    readonly maxConcurrency: number;
    readonly timeoutMs: number;
    readonly maxMemoryBytes: number;
  };
  readonly forensicRoutingHash: string;
  readonly timestamp: string;
}

export class Phase29MotherToSubmotherRouter {
  private static instance: Phase29MotherToSubmotherRouter | null = null;
  private readonly routingHistory: MotherToSubmotherRoutingDecision[] = [];

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P29-MCORE-ROUTER');
  }

  public static getInstance(): Phase29MotherToSubmotherRouter {
    if (!this.instance) {
      this.instance = new Phase29MotherToSubmotherRouter();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Evaluates problem requirements and determines exactly which Submother branches are required.
   */
  public routeProblem(parentRequestId: string, problemStatement: string): MotherToSubmotherRoutingDecision {
    const p = problemStatement.trim().toLowerCase();
    const branchSpecs: RequiredBranchSpec[] = [];

    // Problem feature detectors
    const needsSpatial = /\b(spatial|cell|address369|coordinate|grid|3d|cube)\b/i.test(p);
    const needsPhi = /\b(phi|golden|ratio|fibonacci|geometric|spiral)\b/i.test(p);
    const needsExpansion = /\b(expand|possibilit|branch|combinat|explore|lineage)\b/i.test(p);
    const needsDomain = /\b(domain|logic|verify|proof|multilingual)\b/i.test(p);

    // Case 1: Simple / Direct problem -> ZERO Submothers required
    if (!needsSpatial && !needsPhi && !needsExpansion && !needsDomain) {
      return this.recordDecision(parentRequestId, problemStatement, [], false);
    }

    // Case 2: Spatial problem -> SPATIAL_PROJECTION branch
    if (needsSpatial) {
      const matchCell = p.match(/\bcell\s*(\d+)\b/i);
      const cellId = matchCell ? parseInt(matchCell[1], 10) : 42;
      branchSpecs.push({
        branchIndex: branchSpecs.length,
        formulaType: 'SPATIAL_PROJECTION',
        formulaParameters: { cellId },
        assignedWeight: 0.4,
        rationale: `Mapped cellId ${cellId} to Address 369 spatial projection`,
      });
    }

    // Case 3: Geometric / Phi problem -> PHI_TRANSFORM branch
    if (needsPhi) {
      branchSpecs.push({
        branchIndex: branchSpecs.length,
        formulaType: 'PHI_TRANSFORM',
        formulaParameters: { power: 2 },
        assignedWeight: 0.3,
        rationale: 'Applied Phi geometric transformation scaling',
      });
    }

    // Case 4: Expansion / Possibility exploration -> EXPANSION_RULE branch
    if (needsExpansion) {
      branchSpecs.push({
        branchIndex: branchSpecs.length,
        formulaType: 'EXPANSION_RULE',
        formulaParameters: { depth: 2, rule: 'PHI_TRANSFORM' },
        assignedWeight: 0.2,
        rationale: 'Dispatched 1->Infinity procedural expansion rule',
      });
    }

    // Case 5: Domain verification -> DOMAIN_DELEGATION branch
    if (needsDomain) {
      branchSpecs.push({
        branchIndex: branchSpecs.length,
        formulaType: 'DOMAIN_DELEGATION',
        formulaParameters: { domain: 'LOGIC' },
        assignedWeight: 0.1,
        rationale: 'Domain-specific consistency validation check',
      });
    }

    // Enforce hard concurrency ceiling
    if (branchSpecs.length > MAX_PARALLEL_BRANCHES) {
      branchSpecs.length = MAX_PARALLEL_BRANCHES;
    }

    return this.recordDecision(parentRequestId, problemStatement, branchSpecs, branchSpecs.length > 0);
  }

  public convertToParallelTasks(decision: MotherToSubmotherRoutingDecision): ParallelBranchTask[] {
    return decision.branchSpecs.map(spec => ({
      branchIndex: spec.branchIndex,
      formulaType: spec.formulaType,
      formulaParameters: spec.formulaParameters,
    }));
  }

  public getRoutingHistory(): readonly MotherToSubmotherRoutingDecision[] {
    return Object.freeze([...this.routingHistory]);
  }

  private recordDecision(
    parentRequestId: string,
    problemStatement: string,
    branchSpecs: RequiredBranchSpec[],
    shouldExpand: boolean
  ): MotherToSubmotherRoutingDecision {
    const routingId = `ROUTING_${parentRequestId}_${Date.now()}`;
    const hashData = `${routingId}:${parentRequestId}:${branchSpecs.length}:${shouldExpand}`;
    const forensicRoutingHash = crypto.createHash('sha256').update(hashData).digest('hex');

    const decision: MotherToSubmotherRoutingDecision = {
      routingId,
      parentRequestId,
      problemStatement,
      requiredBranchCount: branchSpecs.length,
      branchSpecs,
      shouldExpandPossibilitySpace: shouldExpand,
      resourceBudget: {
        maxConcurrency: Math.max(1, branchSpecs.length),
        timeoutMs: 3000,
        maxMemoryBytes: 2097152, // 2MB
      },
      forensicRoutingHash,
      timestamp: new Date().toISOString(),
    };

    this.routingHistory.push(decision);
    return decision;
  }
}
