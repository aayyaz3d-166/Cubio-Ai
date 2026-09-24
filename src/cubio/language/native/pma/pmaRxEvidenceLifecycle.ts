/**
 * CUBiO AI — Task 30: PMA ↔ RX Evidence Lifecycle Integration
 * src/cubio/language/native/pma/pmaRxEvidenceLifecycle.ts
 *
 * Integrates the existing F10 RX Lifecycle Engine:
 *   RX0 (Birth) → RX1 (Superposition) → RX2 (Interaction) → RX3 (Awareness Growth) → RX4 (Evolution) → RX5 (Exit)
 * into the Native Project Manager Agent (PMA) as the ephemeral execution lifecycle
 * and evidence / provenance collection layer.
 *
 * Core Directives & Principles:
 * 1. STORE ONCE, REFERENCE EVERYWHERE:
 *    - Evidence structures store cryptographic references, hashes, and IDs; never full file or DB copies.
 * 2. REUSE EXISTING RX ENGINE:
 *    - Reuses `RxLifecycleIntegrationEngine` as the underlying lifecycle & State-T coordinator.
 *    - Respects monotonic RX0..RX5 progression, OCC concurrency, tenant isolation, and RX5 cleanup.
 * 3. BOUNDED MEMORY MODEL:
 *    - Active lifecycles and evidence event records per lifecycle are bounded (default <= 256).
 * 4. DETERMINISTIC PROVENANCE:
 *    - Evidence events and lifecycle hashes are bitwise deterministic. Same input -> same hashes.
 * 5. SOVEREIGNTY & PERMANENT ACTUATION LOCKOUT:
 *    - is_actuation_blocked = true enforced at all times.
 *    - Zero external AI / cloud dependencies.
 */

import * as crypto from 'crypto';
import {
  RxLifecycleIntegrationEngine,
  RxLifecycleContext,
  RX_STAGE_NAMES,
  RX_LIFECYCLE_ERRORS,
} from '../../../core/rxLifecycleIntegration';
import {
  CanonicalIdentityKey,
  calculateCanonicalChecksum,
} from '../../../core/canonicalIdentity';
import { RxStage, AwarenessLevel } from '../../../f10/lifecycle/rxTypes';
import { IS_ACTUATION_BLOCKED } from '../../../intelligence/core/coreEngineContract';
import {
  PMAHandoffContract,
  PMAGitChanges,
  PMAReviewVerdict,
  PMAFileChangeRecord,
} from './types';

// ---------------------------------------------------------------------------
// TYPES & INTERFACES
// ---------------------------------------------------------------------------

export type PMARxEventType =
  | 'RX0_BIRTH'
  | 'RX1_CANDIDATE_DISCOVERY'
  | 'RX2_INTERACTION_PLAN'
  | 'RX3_AWARENESS_IMPACT'
  | 'RX3_CHANGE_WATCHER_EVENT'
  | 'RX4_EVOLUTION_EXECUTION'
  | 'RX4_TEST_RESULT'
  | 'RX4_CANONICAL_PROMOTION'
  | 'RX5_EXIT_FINALIZATION';

export interface PMARxEvidenceEvent {
  readonly eventId: string;
  readonly taskId: string;
  readonly rxLifecycleId: string;
  readonly stage: RxStage;
  readonly eventType: PMARxEventType;
  readonly sequence: number;
  readonly timestamp: number;
  readonly sourceReference: string;
  readonly artifactReference: string;
  readonly contentHash: string;
  readonly tenantId: string;
  readonly cellId?: number;
  readonly resultStatus: 'PASS' | 'PARTIAL_PASS' | 'FAIL' | 'BLOCKED' | 'INFO';
  readonly verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
  readonly provenanceHash: string;
}

export interface PMARxEvidenceSummary {
  readonly taskId: string;
  readonly rxLifecycleId: string;
  readonly tenantId: string;
  readonly finalStage: RxStage;
  readonly totalEvidenceCount: number;
  readonly evidenceEventIds: readonly string[];
  readonly involvedFiles: readonly string[];
  readonly involvedCapabilities: readonly string[];
  readonly testResults: Readonly<Record<string, 'PASS' | 'FAIL'>>;
  readonly finalVerdict: 'PASS' | 'PARTIAL_PASS' | 'BLOCKED';
  readonly masterProvenanceHash: string;
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// PMA RX EVIDENCE ENGINE
// ---------------------------------------------------------------------------

export class PMARxEvidenceEngine {
  public static readonly DEFAULT_MAX_EVIDENCE_PER_LIFECYCLE = 256;
  public static readonly DEFAULT_MAX_ACTIVE_LIFECYCLES = 256;

  public readonly is_actuation_blocked: boolean = true;
  private readonly maxEvidencePerLifecycle: number;

  // Underlying existing RX Engine
  private readonly rxEngine: RxLifecycleIntegrationEngine;

  // Ephemeral evidence store: rxLifecycleId -> PMARxEvidenceEvent[]
  private readonly evidenceRegistry = new Map<string, PMARxEvidenceEvent[]>();

  // Task ID to Lifecycle ID mapping: taskId -> rxLifecycleId
  private readonly taskToLifecycleMap = new Map<string, string>();

  // Finalized summaries: taskId -> PMARxEvidenceSummary
  private readonly summaryRegistry = new Map<string, PMARxEvidenceSummary>();

  constructor(
    maxActiveLifecycles: number = PMARxEvidenceEngine.DEFAULT_MAX_ACTIVE_LIFECYCLES,
    maxEvidencePerLifecycle: number = PMARxEvidenceEngine.DEFAULT_MAX_EVIDENCE_PER_LIFECYCLE,
    rxEngine?: RxLifecycleIntegrationEngine
  ) {
    this.maxEvidencePerLifecycle = Math.max(1, maxEvidencePerLifecycle);
    this.rxEngine = rxEngine || new RxLifecycleIntegrationEngine(maxActiveLifecycles, 256);
  }

  public verifyActuationLock(): void {
    if (this.is_actuation_blocked !== true || IS_ACTUATION_BLOCKED !== true) {
      throw new Error('ACTUATION_BLOCKED_VIOLATION: Actuation is permanently blocked in sovereign CUBiO architecture.');
    }
  }

  // -------------------------------------------------------------------------
  // DETERMINISTIC IDENTITY HELPER
  // -------------------------------------------------------------------------

  /**
   * Deterministically derives the canonical identity key for a PMA Task.
   */
  public getDeterministicCanonicalIdentity(
    taskId: string,
    tenantId: string = 'root',
    cellId?: number
  ): CanonicalIdentityKey {
    const objectId = `PMA-TASK-${taskId}`;
    const payload = { taskId, tenantId, domain: 'GOVERNANCE', timestamp: 0 };
    const checksum = calculateCanonicalChecksum(payload);

    return Object.freeze({
      objectId,
      tenantId,
      domain: 'GOVERNANCE',
      ...(cellId !== undefined ? { cellId } : {}),
      stateVersion: 1,
      checksum,
    });
  }

  // -------------------------------------------------------------------------
  // RX0: BIRTH
  // -------------------------------------------------------------------------

  /**
   * Initializes RX0 Birth for a PMA Task.
   */
  public startRx0Birth(
    handoff: PMAHandoffContract,
    tenantId: string = 'root',
    cellId?: number
  ): {
    readonly context: RxLifecycleContext;
    readonly event: PMARxEvidenceEvent;
  } {
    this.verifyActuationLock();

    const canonicalIdentity = this.getDeterministicCanonicalIdentity(handoff.taskId, tenantId, cellId);
    const customLifecycleId = `RX-LIFE-${handoff.taskId}`;

    const context = this.rxEngine.birthLifecycle(
      { identity: canonicalIdentity },
      customLifecycleId
    );

    this.taskToLifecycleMap.set(handoff.taskId, context.lifecycleId);

    const event = this.recordEvidenceEvent({
      taskId: handoff.taskId,
      rxLifecycleId: context.lifecycleId,
      stage: 0,
      eventType: 'RX0_BIRTH',
      sourceReference: `PMAHandoffContract:${handoff.taskId}`,
      artifactReference: `objective:${handoff.objective}`,
      contentHash: handoff.handoffHash,
      tenantId,
      cellId,
      resultStatus: handoff.isApprovedForDevelopment ? 'PASS' : 'BLOCKED',
      verificationStatus: 'VERIFIED',
    });

    return { context, event };
  }

  // -------------------------------------------------------------------------
  // RX1: SUPERPOSITION (Candidate Discovery)
  // -------------------------------------------------------------------------

  public advanceRx1Superposition(
    taskId: string,
    candidates: readonly { capabilityName: string; path: string; status: string }[],
    tenantId: string = 'root'
  ): {
    readonly context: RxLifecycleContext;
    readonly event: PMARxEvidenceEvent;
  } {
    this.verifyActuationLock();
    const lifecycleId = this.getLifecycleIdForTask(taskId);

    const context = this.rxEngine.transitionLifecycleStage(
      lifecycleId,
      1 as RxStage,
      tenantId,
      1 as AwarenessLevel
    );

    const contentPayload = JSON.stringify(candidates.map((c) => ({ name: c.capabilityName, path: c.path })));
    const contentHash = crypto.createHash('sha256').update(contentPayload).digest('hex');

    const event = this.recordEvidenceEvent({
      taskId,
      rxLifecycleId: lifecycleId,
      stage: 1,
      eventType: 'RX1_CANDIDATE_DISCOVERY',
      sourceReference: `CapabilityResolver:candidates(${candidates.length})`,
      artifactReference: candidates.map((c) => c.capabilityName).join('; ') || 'none',
      contentHash,
      tenantId,
      resultStatus: 'PASS',
      verificationStatus: 'VERIFIED',
    });

    return { context, event };
  }

  // -------------------------------------------------------------------------
  // RX2: INTERACTION (Selected Path / Interactions)
  // -------------------------------------------------------------------------

  public advanceRx2Interaction(
    taskId: string,
    selectedPlan: {
      readonly reuseStrategy: string;
      readonly allowedFiles: readonly string[];
      readonly dependencies: readonly string[];
    },
    tenantId: string = 'root'
  ): {
    readonly context: RxLifecycleContext;
    readonly event: PMARxEvidenceEvent;
  } {
    this.verifyActuationLock();
    const lifecycleId = this.getLifecycleIdForTask(taskId);

    const context = this.rxEngine.transitionLifecycleStage(
      lifecycleId,
      2 as RxStage,
      tenantId,
      2 as AwarenessLevel
    );

    const contentPayload = JSON.stringify(selectedPlan);
    const contentHash = crypto.createHash('sha256').update(contentPayload).digest('hex');

    const event = this.recordEvidenceEvent({
      taskId,
      rxLifecycleId: lifecycleId,
      stage: 2,
      eventType: 'RX2_INTERACTION_PLAN',
      sourceReference: `PMAPlanner:strategy=${selectedPlan.reuseStrategy}`,
      artifactReference: `allowedFiles:${selectedPlan.allowedFiles.length}`,
      contentHash,
      tenantId,
      resultStatus: 'PASS',
      verificationStatus: 'VERIFIED',
    });

    return { context, event };
  }

  // -------------------------------------------------------------------------
  // RX3: AWARENESS GROWTH (Cross-Subsystem & Change Watcher Evidence)
  // -------------------------------------------------------------------------

  public advanceRx3AwarenessGrowth(
    taskId: string,
    awarenessData: {
      readonly crossSubsystems: readonly string[];
      readonly watcherChanges?: readonly PMAFileChangeRecord[];
      readonly constraintNotes?: string;
    },
    tenantId: string = 'root'
  ): {
    readonly context: RxLifecycleContext;
    readonly event: PMARxEvidenceEvent;
  } {
    this.verifyActuationLock();
    const lifecycleId = this.getLifecycleIdForTask(taskId);

    const context = this.rxEngine.transitionLifecycleStage(
      lifecycleId,
      3 as RxStage,
      tenantId,
      3 as AwarenessLevel
    );

    const contentPayload = JSON.stringify({
      subsystems: awarenessData.crossSubsystems,
      changesCount: awarenessData.watcherChanges?.length || 0,
      notes: awarenessData.constraintNotes || '',
    });
    const contentHash = crypto.createHash('sha256').update(contentPayload).digest('hex');

    const event = this.recordEvidenceEvent({
      taskId,
      rxLifecycleId: lifecycleId,
      stage: 3,
      eventType: 'RX3_AWARENESS_IMPACT',
      sourceReference: `ProjectNavigator:subsystems(${awarenessData.crossSubsystems.join(',')})`,
      artifactReference: awarenessData.constraintNotes || 'Normal Awareness Expansion',
      contentHash,
      tenantId,
      resultStatus: 'PASS',
      verificationStatus: 'VERIFIED',
    });

    // If change watcher records are passed, link them as separate evidence references
    if (awarenessData.watcherChanges && awarenessData.watcherChanges.length > 0) {
      for (const change of awarenessData.watcherChanges) {
        this.recordEvidenceEvent({
          taskId,
          rxLifecycleId: lifecycleId,
          stage: 3,
          eventType: 'RX3_CHANGE_WATCHER_EVENT',
          sourceReference: `ProjectChangeWatcher:${change.changeType}:${change.path}`,
          artifactReference: `scope=${change.scopeStatus};classification=${change.classification}`,
          contentHash: change.currentHash || change.changeId,
          tenantId,
          resultStatus: change.scopeStatus === 'OUT_OF_SCOPE' ? 'BLOCKED' : 'PASS',
          verificationStatus: change.protectionStatus === 'PROTECTED_MUTATION_ALERT' ? 'REJECTED' : 'VERIFIED',
        });
      }
    }

    return { context, event };
  }

  // -------------------------------------------------------------------------
  // RX4: EVOLUTION (Execution, Test & Review Evidence)
  // -------------------------------------------------------------------------

  public advanceRx4Evolution(
    taskId: string,
    evolutionData: {
      readonly changes: PMAGitChanges;
      readonly review: PMAReviewVerdict;
      readonly testOutcomes?: Readonly<Record<string, 'PASS' | 'FAIL'>>;
    },
    tenantId: string = 'root'
  ): {
    readonly context: RxLifecycleContext;
    readonly event: PMARxEvidenceEvent;
  } {
    this.verifyActuationLock();
    const lifecycleId = this.getLifecycleIdForTask(taskId);

    const context = this.rxEngine.transitionLifecycleStage(
      lifecycleId,
      4 as RxStage,
      tenantId,
      4 as AwarenessLevel
    );

    const contentPayload = JSON.stringify({
      changed: evolutionData.changes.changedFiles,
      newFiles: evolutionData.changes.newFiles,
      verdict: evolutionData.review.finalVerdict,
      tests: evolutionData.testOutcomes || {},
    });
    const contentHash = crypto.createHash('sha256').update(contentPayload).digest('hex');

    const event = this.recordEvidenceEvent({
      taskId,
      rxLifecycleId: lifecycleId,
      stage: 4,
      eventType: 'RX4_EVOLUTION_EXECUTION',
      sourceReference: `PostDevelopmentVerifier:verdict=${evolutionData.review.finalVerdict}`,
      artifactReference: `touchedFiles=${evolutionData.changes.changedFiles.length + evolutionData.changes.newFiles.length}`,
      contentHash,
      tenantId,
      resultStatus: evolutionData.review.finalVerdict === 'PASS' ? 'PASS' : 'BLOCKED',
      verificationStatus: evolutionData.review.didTestsPass ? 'VERIFIED' : 'UNVERIFIED',
    });

    return { context, event };
  }

  // -------------------------------------------------------------------------
  // CANONICAL PROMOTION (RX4 -> State-T OCC Promotion helper)
  // -------------------------------------------------------------------------

  public promoteCanonicalState(
    taskId: string,
    currentCanonical: {
      readonly identity: CanonicalIdentityKey;
      readonly currentLifecycle: any;
      readonly payload: Record<string, unknown>;
    },
    evolutionUpdates: {
      newPayloadFields?: Record<string, unknown>;
      targetCellId?: number;
    }
  ) {
    this.verifyActuationLock();
    const lifecycleId = this.getLifecycleIdForTask(taskId);
    return this.rxEngine.promoteLifecycleToCanonical(lifecycleId, currentCanonical, evolutionUpdates);
  }

  // -------------------------------------------------------------------------
  // RX5: EXIT (Finalization & Ephemeral Cleanup)
  // -------------------------------------------------------------------------

  public advanceRx5Exit(
    taskId: string,
    finalVerdict: 'PASS' | 'PARTIAL_PASS' | 'BLOCKED',
    tenantId: string = 'root'
  ): {
    readonly summary: PMARxEvidenceSummary;
    readonly event: PMARxEvidenceEvent;
  } {
    this.verifyActuationLock();
    const lifecycleId = this.getLifecycleIdForTask(taskId);

    // Record the final RX5 event before cleaning up
    const exitEvent = this.recordEvidenceEvent({
      taskId,
      rxLifecycleId: lifecycleId,
      stage: 5,
      eventType: 'RX5_EXIT_FINALIZATION',
      sourceReference: `RX_LIFECYCLE_FINALIZATION:${finalVerdict}`,
      artifactReference: `Lifecycle Session Completed`,
      contentHash: crypto.createHash('sha256').update(`${taskId}:${lifecycleId}:${finalVerdict}`).digest('hex'),
      tenantId,
      resultStatus: finalVerdict,
      verificationStatus: 'VERIFIED',
    });

    // Advance lifecycle in the underlying engine to RX5 (cleans up active cache)
    this.rxEngine.transitionLifecycleStage(
      lifecycleId,
      5 as RxStage,
      tenantId,
      4 as AwarenessLevel
    );

    // Aggregate evidence into summary
    const allEvents = this.evidenceRegistry.get(lifecycleId) || [];
    const involvedFilesSet = new Set<string>();
    const involvedCapabilitiesSet = new Set<string>();
    const testResults: Record<string, 'PASS' | 'FAIL'> = {};

    for (const ev of allEvents) {
      if (ev.sourceReference.includes('CapabilityResolver')) {
        involvedCapabilitiesSet.add(ev.artifactReference);
      }
      if (ev.sourceReference.includes('ProjectChangeWatcher')) {
        involvedFilesSet.add(ev.sourceReference.split(':')[2] || '');
      }
      if (ev.eventType === 'RX4_TEST_RESULT') {
        testResults[ev.sourceReference] = ev.resultStatus === 'PASS' ? 'PASS' : 'FAIL';
      }
    }

    const masterProvenancePayload = JSON.stringify({
      taskId,
      lifecycleId,
      tenantId,
      eventCount: allEvents.length,
      finalVerdict,
      events: allEvents.map((e) => e.provenanceHash),
    });
    const masterProvenanceHash = crypto.createHash('sha256').update(masterProvenancePayload).digest('hex');

    const summary: PMARxEvidenceSummary = Object.freeze({
      taskId,
      rxLifecycleId: lifecycleId,
      tenantId,
      finalStage: 5 as RxStage,
      totalEvidenceCount: allEvents.length,
      evidenceEventIds: Object.freeze(allEvents.map((e) => e.eventId)),
      involvedFiles: Object.freeze(Array.from(involvedFilesSet).filter(Boolean)),
      involvedCapabilities: Object.freeze(Array.from(involvedCapabilitiesSet).filter(Boolean)),
      testResults: Object.freeze(testResults),
      finalVerdict,
      masterProvenanceHash,
      timestamp: Date.now(),
    });

    this.summaryRegistry.set(taskId, summary);
    return { summary, event: exitEvent };
  }

  // -------------------------------------------------------------------------
  // EVIDENCE EVENT HELPER
  // -------------------------------------------------------------------------

  public recordEvidenceEvent(params: {
    taskId: string;
    rxLifecycleId: string;
    stage: RxStage;
    eventType: PMARxEventType;
    sourceReference: string;
    artifactReference: string;
    contentHash: string;
    tenantId: string;
    cellId?: number;
    resultStatus: 'PASS' | 'PARTIAL_PASS' | 'FAIL' | 'BLOCKED' | 'INFO';
    verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
  }): PMARxEvidenceEvent {
    this.verifyActuationLock();

    let list = this.evidenceRegistry.get(params.rxLifecycleId);
    if (!list) {
      list = [];
      this.evidenceRegistry.set(params.rxLifecycleId, list);
    }

    // Idempotency: check if identical event already recorded
    const existing = list.find(
      (e) =>
        e.eventType === params.eventType &&
        e.sourceReference === params.sourceReference &&
        e.contentHash === params.contentHash
    );
    if (existing) {
      return existing;
    }

    // Bounded queue: evict oldest if limit reached
    if (list.length >= this.maxEvidencePerLifecycle) {
      list.shift();
    }

    const sequence = list.length;
    const timestamp = Date.now();
    const eventId = `EV-${params.taskId}-${params.stage}-${sequence}`;

    const provenancePayload = JSON.stringify({
      eventId,
      taskId: params.taskId,
      rxLifecycleId: params.rxLifecycleId,
      stage: params.stage,
      eventType: params.eventType,
      sourceReference: params.sourceReference,
      contentHash: params.contentHash,
      tenantId: params.tenantId,
      sequence,
    });
    const provenanceHash = crypto.createHash('sha256').update(provenancePayload).digest('hex');

    const event: PMARxEvidenceEvent = Object.freeze({
      eventId,
      taskId: params.taskId,
      rxLifecycleId: params.rxLifecycleId,
      stage: params.stage,
      eventType: params.eventType,
      sequence,
      timestamp,
      sourceReference: params.sourceReference,
      artifactReference: params.artifactReference,
      contentHash: params.contentHash,
      tenantId: params.tenantId,
      ...(params.cellId !== undefined ? { cellId: params.cellId } : {}),
      resultStatus: params.resultStatus,
      verificationStatus: params.verificationStatus,
      provenanceHash,
    });

    list.push(event);
    return event;
  }

  // -------------------------------------------------------------------------
  // QUERY / ACCESS METHODS
  // -------------------------------------------------------------------------

  public getLifecycleIdForTask(taskId: string): string {
    const id = this.taskToLifecycleMap.get(taskId);
    if (!id) {
      throw new Error(`TASK_NOT_ASSOCIATED_WITH_RX_LIFECYCLE: Task "${taskId}" has no registered RX lifecycle.`);
    }
    return id;
  }

  public getEvidenceForLifecycle(lifecycleId: string): readonly PMARxEvidenceEvent[] {
    return this.evidenceRegistry.get(lifecycleId) || [];
  }

  public getEvidenceForTask(taskId: string): readonly PMARxEvidenceEvent[] {
    const lifecycleId = this.taskToLifecycleMap.get(taskId);
    if (!lifecycleId) return [];
    return this.getEvidenceForLifecycle(lifecycleId);
  }

  public getSummaryForTask(taskId: string): PMARxEvidenceSummary | undefined {
    return this.summaryRegistry.get(taskId);
  }

  public getRxEngine(): RxLifecycleIntegrationEngine {
    return this.rxEngine;
  }

  public clearTaskEvidence(taskId: string): void {
    const lifecycleId = this.taskToLifecycleMap.get(taskId);
    if (lifecycleId) {
      this.evidenceRegistry.delete(lifecycleId);
      this.taskToLifecycleMap.delete(taskId);
    }
    this.summaryRegistry.delete(taskId);
  }
}
