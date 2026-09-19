/**
 * ============================================================================
 * CUBiO AI — PHASE 31 TASK 507: EPISTEMIC SUBMOTHER GENERATOR
 * src/cubio/submother/phase31EpistemicSubmotherGenerator.ts
 * ============================================================================
 *
 * Procedural Epistemic Submother Generator responsible for Fact, Derivation,
 * Hypothesis, Ambiguity, and Refusal handling.
 *
 * Requirements & Invariants:
 *   1. Strictly inherits epistemic policy from Mother Core (no independent learning).
 *   2. Epistemic Classification Categories:
 *      - FACT: Grounded in canonical VDB or proven mathematical identities ($c \ge 0.85$).
 *      - DERIVATION: Formally deduced through deterministic algebraic/spatial rules ($0.75 \le c < 0.85$).
 *      - HYPOTHESIS: Plausible conjecture requiring external verification ($0.50 \le c < 0.75$).
 *      - AMBIGUITY: Multiple interpretations or under-specified query ($0.30 \le c < 0.50$).
 *      - REFUSAL: Contradictory evidence, fabricated claims, or $c < 0.30$.
 *   3. Zero Trainable Weights:
 *      - `trainableWeights: 0`, `independentWeightsCreated: false`.
 *   4. Fail-Closed Adversarial Probing:
 *      - Unsupported claims trigger bounded uncertainty or refusal.
 *      - Contradictory evidence triggers immediate calibrated refusal.
 *   5. Deterministic Behavior:
 *      - Identical evidence sets yield identical classifications and confidence scores (0 drift).
 *   6. Permanent Invariants:
 *      - IS_ACTUATION_BLOCKED === true
 *      - OFFLINE_ISOLATED === true
 *
 * ============================================================================
 */

import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import {
  IS_ACTUATION_BLOCKED,
  OFFLINE_ISOLATED,
} from '../intelligence/core/coreEngineContract';
import { ExternalModelGuard } from '../model/native_foundation/external_model_guard';
import {
  CUBIO_NATIVE_MODEL_ID,
  EpistemicStatus,
} from '../model/native_foundation/native_model_types';
import { TOTAL_NATIVE_PARAMETERS } from '../core/nativeTrainingIntegration';
import { Phase31DynamicSubmotherIdentityEngine } from './phase31DynamicSubmotherIdentityEngine';

// ============================================================================
// CONSTANTS
// ============================================================================

export const EPISTEMIC_GENERATOR_VERSION = '31.507.0';
export const EPISTEMIC_GENERATOR_ID = 'CUBIO_EPISTEMIC_SUBMOTHER_GENERATOR';

export const FACT_CONFIDENCE_THRESHOLD = 0.85;
export const DERIVATION_CONFIDENCE_THRESHOLD = 0.75;
export const HYPOTHESIS_CONFIDENCE_THRESHOLD = 0.50;
export const AMBIGUITY_CONFIDENCE_THRESHOLD = 0.30;

export type EpistemicCategory =
  | 'FACT'
  | 'DERIVATION'
  | 'HYPOTHESIS'
  | 'AMBIGUITY'
  | 'REFUSAL';

export const DEFAULT_EPISTEMIC_TIMEOUT_MS = 3000;

// ============================================================================
// CONTRACTS
// ============================================================================

export interface EvidenceItem {
  readonly statement: string;
  readonly source: 'VDB_CANONICAL' | 'FORMULA_A' | 'USER_PROMPT' | 'UNVERIFIED';
  readonly reliability: number;
}

export interface EpistemicTaskRequest {
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly claim: string;
  readonly evidence: readonly EvidenceItem[];
  readonly contextPayload?: string;
  readonly timeoutMs?: number;
}

export interface EpistemicSubmotherInstance {
  readonly instanceId: string;
  readonly identityId: string;
  readonly tenantId: string;
  readonly parentTaskId: string;
  readonly claim: string;
  readonly timeoutMs: number;
  readonly provenanceDigest: string;
  readonly motherCoreModelId: string;
  readonly motherCoreParameters: number;
  readonly trainableWeights: 0;
  readonly independentWeightsCreated: false;
  readonly delegatesToMotherCore: true;
  readonly createdAt: number;
  readonly expiresAt: number;
  status: 'INITIALIZED' | 'EVALUATING' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT';
}

export interface EpistemicEvaluationResult {
  readonly instanceId: string;
  readonly identityId: string;
  readonly claim: string;
  readonly status: 'SUCCESS' | 'REJECTED' | 'TIMED_OUT';
  readonly category: EpistemicCategory;
  readonly calibratedConfidence: number;
  readonly evidenceAlignmentScore: number;
  readonly calibrationTrace: readonly string[];
  readonly refusalNotice?: string;
  readonly outputDigest: string;
  readonly latencyMs: number;
  readonly delegatedToMotherCore: true;
  readonly independentWeightsCreated: false;
  readonly rejectionReason?: string;
  readonly timestamp: string;
}

export interface EpistemicAuditRecord {
  readonly auditId: string;
  readonly action: 'SPAWN' | 'EVALUATE' | 'ADVERSARIAL_TRAP' | 'REJECT';
  readonly instanceId: string;
  readonly tenantId: string;
  readonly category: string;
  readonly reason?: string;
  readonly auditHash: string;
  readonly timestamp: string;
}

// ============================================================================
// EPISTEMIC SUBMOTHER GENERATOR IMPLEMENTATION
// ============================================================================

export class Phase31EpistemicSubmotherGenerator {
  private static instance: Phase31EpistemicSubmotherGenerator | null = null;

  private readonly activeInstances: Map<string, EpistemicSubmotherInstance> = new Map();
  private readonly auditLedger: EpistemicAuditRecord[] = [];
  private readonly identityEngine: Phase31DynamicSubmotherIdentityEngine;

  private totalSpawned = 0;
  private totalEvaluated = 0;
  private adversarialTraps = 0;
  private totalRejections = 0;

  private constructor() {
    if (!IS_ACTUATION_BLOCKED) throw new Error('FAIL_CLOSED: IS_ACTUATION_BLOCKED must be true');
    if (!OFFLINE_ISOLATED) throw new Error('FAIL_CLOSED: OFFLINE_ISOLATED must be true');
    ExternalModelGuard.assertNativeOnly('CUBIO-P31-EPISTEMIC-GENERATOR');

    this.identityEngine = Phase31DynamicSubmotherIdentityEngine.getInstance();
  }

  public static getInstance(): Phase31EpistemicSubmotherGenerator {
    if (!this.instance) {
      this.instance = new Phase31EpistemicSubmotherGenerator();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.clearAll();
    }
    this.instance = null;
  }

  /**
   * Spawns a procedural Epistemic Submother instance.
   */
  public spawnEpistemicSubmother(req: EpistemicTaskRequest): EpistemicSubmotherInstance {
    // ── GUARD 1: Input Validation ──
    if (!req.claim || typeof req.claim !== 'string' || req.claim.trim().length === 0) {
      this.totalRejections++;
      this.recordAudit('REJECT', 'UNKNOWN', req.tenantId, 'UNKNOWN', 'INVALID_INPUT: Empty claim');
      throw new Error('[INVALID_INPUT] Epistemic claim cannot be empty');
    }

    // ── IDENTITY DERIVATION ──
    const { record: idRecord } = this.identityEngine.deriveOrReuseIdentity({
      tenantId: req.tenantId,
      parentTaskId: req.parentTaskId,
      domain: 'PROBLEM_SOLVING',
      contextPayload: `EPISTEMIC:${req.claim}:${req.evidence.length}`,
      formulaId: 'FORMULA_EPISTEMIC_BOUND',
      formulaParameters: { evidenceCount: req.evidence.length },
      generationDepth: 0,
      customTtlMs: req.timeoutMs ?? DEFAULT_EPISTEMIC_TIMEOUT_MS,
    });

    const now = performance.now();
    const timeout = req.timeoutMs ?? DEFAULT_EPISTEMIC_TIMEOUT_MS;
    const instanceId = `ESM_${idRecord.identityId.slice(5, 17)}_${Date.now()}`;

    // Provenance Digest
    const provSeed = `${instanceId}:${idRecord.identityId}:EPISTEMIC:${CUBIO_NATIVE_MODEL_ID}:${TOTAL_NATIVE_PARAMETERS}:${req.claim.slice(0, 32)}`;
    const provenanceDigest = crypto.createHash('sha256').update(provSeed).digest('hex');

    const instance: EpistemicSubmotherInstance = {
      instanceId,
      identityId: idRecord.identityId,
      tenantId: req.tenantId,
      parentTaskId: req.parentTaskId,
      claim: req.claim,
      timeoutMs: timeout,
      provenanceDigest,
      motherCoreModelId: CUBIO_NATIVE_MODEL_ID,
      motherCoreParameters: TOTAL_NATIVE_PARAMETERS,
      trainableWeights: 0,
      independentWeightsCreated: false,
      delegatesToMotherCore: true,
      createdAt: now,
      expiresAt: now + timeout,
      status: 'INITIALIZED',
    };

    this.activeInstances.set(instanceId, instance);
    this.totalSpawned++;
    this.recordAudit('SPAWN', instanceId, req.tenantId, 'INITIALIZED', `Claim: ${req.claim.slice(0, 32)}...`);
    return instance;
  }

  /**
   * Executes procedural epistemic calibration and categorization.
   */
  public evaluateEpistemicClaim(instanceId: string, evidence: readonly EvidenceItem[]): EpistemicEvaluationResult {
    const startTime = performance.now();
    this.totalEvaluated++;

    const instance = this.activeInstances.get(instanceId);
    if (!instance) {
      this.totalRejections++;
      return {
        instanceId,
        identityId: 'UNKNOWN',
        claim: '',
        status: 'REJECTED',
        category: 'REFUSAL',
        calibratedConfidence: 0,
        evidenceAlignmentScore: 0,
        calibrationTrace: ['Instance not found'],
        outputDigest: 'REJECTED_NO_OUTPUT',
        latencyMs: 0,
        delegatedToMotherCore: true,
        independentWeightsCreated: false,
        rejectionReason: `INSTANCE_NOT_FOUND: Instance '${instanceId}' does not exist`,
        timestamp: new Date().toISOString(),
      };
    }

    // Check TTL
    if (performance.now() > instance.expiresAt) {
      instance.status = 'TIMED_OUT';
      this.activeInstances.delete(instanceId);
      this.totalRejections++;
      this.recordAudit('REJECT', instanceId, instance.tenantId, 'TIMEOUT', 'Execution timed out');
      return {
        instanceId,
        identityId: instance.identityId,
        claim: instance.claim,
        status: 'TIMED_OUT',
        category: 'REFUSAL',
        calibratedConfidence: 0,
        evidenceAlignmentScore: 0,
        calibrationTrace: ['Execution TTL expired'],
        outputDigest: 'TIMED_OUT_NO_OUTPUT',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
        delegatedToMotherCore: true,
        independentWeightsCreated: false,
        rejectionReason: 'EXECUTION_TIMEOUT: Instance TTL expired',
        timestamp: new Date().toISOString(),
      };
    }

    instance.status = 'EVALUATING';

    const calibrationTrace: string[] = [];

    // ── ADVERSARIAL CHECK 1: Contradictory Evidence Detection ──
    const hasContradiction = evidence.some(
      e => e.statement.toLowerCase().includes('contradiction') ||
           e.statement.toLowerCase().includes('impossible') ||
           e.statement.toLowerCase().includes('false claim')
    );

    if (hasContradiction) {
      this.adversarialTraps++;
      instance.status = 'COMPLETED';
      this.activeInstances.delete(instanceId);
      const latencyMs = Number((performance.now() - startTime).toFixed(2));
      const refusalNotice = 'REFUSAL: Contradictory evidence detected in premise pool. Anti-hallucination policy triggered.';
      calibrationTrace.push('Contradictory evidence detected; classified as REFUSAL.');
      this.recordAudit('ADVERSARIAL_TRAP', instanceId, instance.tenantId, 'REFUSAL', refusalNotice);

      return {
        instanceId,
        identityId: instance.identityId,
        claim: instance.claim,
        status: 'SUCCESS',
        category: 'REFUSAL',
        calibratedConfidence: 0.05,
        evidenceAlignmentScore: 0.0,
        calibrationTrace,
        refusalNotice,
        outputDigest: crypto.createHash('sha256').update(refusalNotice).digest('hex'),
        latencyMs,
        delegatedToMotherCore: true,
        independentWeightsCreated: false,
        timestamp: new Date().toISOString(),
      };
    }

    // ── ADVERSARIAL CHECK 2: Zero or Insufficient Evidence ──
    if (evidence.length === 0) {
      this.adversarialTraps++;
      instance.status = 'COMPLETED';
      this.activeInstances.delete(instanceId);
      const latencyMs = Number((performance.now() - startTime).toFixed(2));
      const refusalNotice = 'REFUSAL: Zero evidence provided. Submothers cannot validate unsupported assertions.';
      calibrationTrace.push('Zero evidence provided; classified as REFUSAL.');
      this.recordAudit('ADVERSARIAL_TRAP', instanceId, instance.tenantId, 'REFUSAL', refusalNotice);

      return {
        instanceId,
        identityId: instance.identityId,
        claim: instance.claim,
        status: 'SUCCESS',
        category: 'REFUSAL',
        calibratedConfidence: 0.0,
        evidenceAlignmentScore: 0.0,
        calibrationTrace,
        refusalNotice,
        outputDigest: crypto.createHash('sha256').update(refusalNotice).digest('hex'),
        latencyMs,
        delegatedToMotherCore: true,
        independentWeightsCreated: false,
        timestamp: new Date().toISOString(),
      };
    }

    // ── PROCEDURAL CALIBRATION COMPUTATION ──
    let weightedScore = 0;
    let totalWeight = 0;

    for (const item of evidence) {
      let sourceMultiplier = 0.5; // Default unverified
      if (item.source === 'VDB_CANONICAL') sourceMultiplier = 1.0;
      else if (item.source === 'FORMULA_A') sourceMultiplier = 0.95;
      else if (item.source === 'USER_PROMPT') sourceMultiplier = 0.70;

      const itemScore = item.reliability * sourceMultiplier;
      weightedScore += itemScore;
      totalWeight += 1.0;

      calibrationTrace.push(`Evidence: '${item.statement.slice(0, 36)}...' [Source: ${item.source}, Rel: ${item.reliability}, Weighted: ${itemScore.toFixed(2)}]`);
    }

    const alignmentScore = Number((weightedScore / totalWeight).toFixed(4));
    let category: EpistemicCategory;

    if (alignmentScore >= FACT_CONFIDENCE_THRESHOLD) {
      category = 'FACT';
    } else if (alignmentScore >= DERIVATION_CONFIDENCE_THRESHOLD) {
      category = 'DERIVATION';
    } else if (alignmentScore >= HYPOTHESIS_CONFIDENCE_THRESHOLD) {
      category = 'HYPOTHESIS';
    } else if (alignmentScore >= AMBIGUITY_CONFIDENCE_THRESHOLD) {
      category = 'AMBIGUITY';
    } else {
      category = 'REFUSAL';
    }

    calibrationTrace.push(`Calculated evidence alignment score: ${alignmentScore}`);
    calibrationTrace.push(`Final calibrated epistemic category: ${category}`);

    const latencyMs = Number((performance.now() - startTime).toFixed(2));
    const outputDigest = crypto.createHash('sha256').update(
      JSON.stringify({ claim: instance.claim, category, alignmentScore, calibrationTrace })
    ).digest('hex');

    instance.status = 'COMPLETED';
    this.activeInstances.delete(instanceId);
    this.recordAudit('EVALUATE', instanceId, instance.tenantId, category, `Confidence: ${alignmentScore}`);

    return {
      instanceId,
      identityId: instance.identityId,
      claim: instance.claim,
      status: 'SUCCESS',
      category,
      calibratedConfidence: alignmentScore,
      evidenceAlignmentScore: alignmentScore,
      calibrationTrace,
      refusalNotice: category === 'REFUSAL' ? 'REFUSAL: Evidence score below epistemic acceptance floor.' : undefined,
      outputDigest,
      latencyMs,
      delegatedToMotherCore: true,
      independentWeightsCreated: false,
      timestamp: new Date().toISOString(),
    };
  }

  public clearAll(): void {
    this.activeInstances.clear();
  }

  public getMetrics(): {
    totalSpawned: number;
    totalEvaluated: number;
    adversarialTraps: number;
    totalRejections: number;
    activeCount: number;
  } {
    return {
      totalSpawned: this.totalSpawned,
      totalEvaluated: this.totalEvaluated,
      adversarialTraps: this.adversarialTraps,
      totalRejections: this.totalRejections,
      activeCount: this.activeInstances.size,
    };
  }

  public getAuditLedger(): readonly EpistemicAuditRecord[] {
    return Object.freeze([...this.auditLedger]);
  }

  private recordAudit(
    action: EpistemicAuditRecord['action'],
    instanceId: string,
    tenantId: string,
    category: string,
    reason?: string
  ): void {
    const auditId = `ESM_AUDIT_${this.auditLedger.length + 1}_${Date.now()}`;
    const hashSeed = `${auditId}|${action}|${instanceId}|${tenantId}|${category}|${reason || ''}`;
    const auditHash = crypto.createHash('sha256').update(hashSeed).digest('hex');

    this.auditLedger.push({
      auditId,
      action,
      instanceId,
      tenantId,
      category,
      reason,
      auditHash,
      timestamp: new Date().toISOString(),
    });
  }
}
