/**
 * CUBiO AI — Task 192: Native Knowledge Contradiction Detection and Resolution
 * src/cubio/model/native_knowledge_contradiction/knowledgeContradictionCoordinator.ts
 *
 * Master Orchestrator for Knowledge Contradiction Detection, Resolution,
 * Quarantine Management, and Phase 10 Reasoning Integration.
 */

import * as crypto from 'crypto';
import {
  TASK_192_ID,
  IS_ACTUATION_BLOCKED,
  ConflictRecord,
  ResolutionResult,
  QuarantineRecord,
  ContradictionAuditReport,
  HistoricalStateRecord,
  Phase10ContradictionAdvisory,
  KnowledgeContradictionActuationBlockedError,
  KnowledgeContradictionTenantViolationError,
  ContradictionConflictType,
} from './types';
import { ContradictionScanner } from './contradictionScanner';
import { ResolutionEngine } from './resolutionEngine';
import { QuarantineStore } from './quarantineStore';
import {
  KnowledgeFact,
  Relationship,
  Evidence,
} from '../native_knowledge_architecture/types';

export class KnowledgeContradictionCoordinator {
  private readonly tenantId: string;
  private readonly advisories: Phase10ContradictionAdvisory[] = [];

  constructor(tenantId: string) {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new KnowledgeContradictionTenantViolationError('Tenant ID cannot be empty');
    }
    this.tenantId = tenantId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Evaluates an individual conflict record deterministically and emits an advisory.
   */
  public evaluateAndProcess(conflict: ConflictRecord): ResolutionResult {
    this.assertActuationBlocked();
    if (conflict.tenantId !== this.tenantId) {
      throw new KnowledgeContradictionTenantViolationError(
        `Conflict tenant '${conflict.tenantId}' does not match coordinator tenant '${this.tenantId}'`
      );
    }

    const result = ResolutionEngine.resolveConflict(conflict);

    // Emit Phase 10 Reasoning Advisory
    const advisory: Phase10ContradictionAdvisory = {
      advisoryId: `ADV-${conflict.conflictId.slice(0, 16)}`,
      tenantId: this.tenantId,
      conflictType: conflict.conflictType,
      severity: conflict.severity,
      resolutionStatus: result.resolved ? 'RESOLVED' : 'QUARANTINED',
      reasonTrail: [
        conflict.reason,
        result.resolutionProofNotes,
        `Strategy: ${result.strategyApplied}`,
      ],
      affectedIds: [...conflict.conflictingRecordIds],
      emittedAt: 1000,
    };
    this.advisories.push(advisory);

    return result;
  }

  /**
   * Scans and processes a batch of facts, detecting contradictions and resolving/quarantining them.
   */
  public processFacts(facts: readonly KnowledgeFact[]): readonly ResolutionResult[] {
    this.assertActuationBlocked();
    const conflicts = ContradictionScanner.scanFacts(facts, this.tenantId);
    return conflicts.map((c) => this.evaluateAndProcess(c));
  }

  /**
   * Scans and processes relationships.
   */
  public processRelationships(relationships: readonly Relationship[]): readonly ResolutionResult[] {
    this.assertActuationBlocked();
    const conflicts = ContradictionScanner.scanRelationships(relationships, this.tenantId);
    return conflicts.map((c) => this.evaluateAndProcess(c));
  }

  /**
   * Scans and processes evidence records.
   */
  public processEvidence(evidenceList: readonly Evidence[]): readonly ResolutionResult[] {
    this.assertActuationBlocked();
    const conflicts = ContradictionScanner.scanEvidence(evidenceList, this.tenantId);
    return conflicts.map((c) => this.evaluateAndProcess(c));
  }

  /**
   * Scans and processes historical state records for OCC branch/fork conflicts.
   */
  public processHistoricalStates(states: readonly HistoricalStateRecord[]): readonly ResolutionResult[] {
    this.assertActuationBlocked();
    const conflicts = ContradictionScanner.scanHistoricalStates(states, this.tenantId);
    return conflicts.map((c) => this.evaluateAndProcess(c));
  }

  /**
   * Lists all quarantined records for this tenant.
   */
  public getQuarantinedRecords(): readonly QuarantineRecord[] {
    return QuarantineStore.list(this.tenantId);
  }

  /**
   * Returns emitted Phase 10 reasoning advisories.
   */
  public getAdvisories(): readonly Phase10ContradictionAdvisory[] {
    return [...this.advisories];
  }

  /**
   * Generates a deterministic audit report of contradiction scanning and resolutions.
   */
  public generateAuditReport(
    scannedCount: number,
    results: readonly ResolutionResult[]
  ): ContradictionAuditReport {
    let resolvedCount = 0;
    let quarantinedCount = 0;
    const breakdown: Record<ContradictionConflictType, number> = {
      FACT_CONFLICT: 0,
      RELATIONSHIP_CONFLICT: 0,
      EVIDENCE_CONFLICT: 0,
      HISTORICAL_STATE_CONFLICT: 0,
      EPISTEMIC_CONFLICT: 0,
    };

    for (const res of results) {
      if (res.resolved) {
        resolvedCount++;
      } else {
        quarantinedCount++;
      }
    }

    const digestPayload = `${this.tenantId}:${scannedCount}:${results.length}:${resolvedCount}:${quarantinedCount}:${QuarantineStore.computeDigest(
      this.tenantId
    )}`;
    const digest = crypto.createHash('sha256').update(digestPayload).digest('hex');

    return {
      tenantId: this.tenantId,
      scannedCount,
      detectedConflicts: results.length,
      resolvedCount,
      quarantinedCount,
      conflictTypeBreakdown: breakdown,
      digest,
    };
  }

  /**
   * Enforces permanent hardware actuation lockout.
   */
  private assertActuationBlocked(): void {
    if (!IS_ACTUATION_BLOCKED) {
      throw new KnowledgeContradictionActuationBlockedError('UNBLOCK_ACTUATION');
    }
  }

  /**
   * Method simulating actuation attempt for verification.
   */
  public triggerActuationAttempt(): void {
    throw new KnowledgeContradictionActuationBlockedError('PHYSICAL_MOTOR_TRIGGER');
  }
}
