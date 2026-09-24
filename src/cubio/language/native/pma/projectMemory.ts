/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/projectMemory.ts
 *
 * Sovereign Project Memory & Task Ledger.
 * Records completed engineering tasks with cryptographic provenance,
 * subsystem lineage, and invariant status without creating redundant storage.
 */

import * as crypto from 'crypto';
import {
  PMATaskMemoryRecord,
  PMAHandoffContract,
  PMAGitChanges,
  PMAReviewVerdict,
  PMAFileChangeRecord,
} from './types';
import { PMARxEvidenceSummary } from './pmaRxEvidenceLifecycle';

export class ProjectMemory {
  private readonly records = new Map<string, PMATaskMemoryRecord>();
  private readonly rxSummaries = new Map<string, PMARxEvidenceSummary>();

  /**
   * Constructs and stores a persistent task memory record.
   * Task 30: Accepts optional PMARxEvidenceSummary to anchor RX provenance.
   */
  public recordCompletedTask(
    handoff: PMAHandoffContract,
    changes: PMAGitChanges,
    review: PMAReviewVerdict,
    rxSummary?: PMARxEvidenceSummary
  ): PMATaskMemoryRecord {
    const date = new Date().toISOString();

    const capabilitiesReused = handoff.existingCapabilities.map((c) => c.capabilityName);
    const newCapabilities = handoff.reuseStrategy === 'NEW' ? [handoff.objective] : [];

    const filesChanged = [
      ...changes.changedFiles,
      ...changes.newFiles,
      ...changes.renamedFiles,
    ];

    const provenance = `CUBIO_PMA_TASK:${handoff.taskId}:${date}:SUBSYS=${handoff.scope.primarySubsystem}${
      rxSummary ? `:RX_LIFE=${rxSummary.rxLifecycleId}` : ''
    }`;

    const recordPayload = JSON.stringify({
      taskId: handoff.taskId,
      date,
      userObjective: handoff.objective,
      subsystem: handoff.scope.primarySubsystem,
      filesChanged,
      finalStatus: review.finalVerdict,
      provenance,
      rxLifecycleId: rxSummary?.rxLifecycleId,
      rxMasterHash: rxSummary?.masterProvenanceHash,
    });

    const recordHash = crypto.createHash('sha256').update(recordPayload).digest('hex');

    const record: PMATaskMemoryRecord = Object.freeze({
      taskId: handoff.taskId,
      date,
      userObjective: handoff.objective,
      subsystem: handoff.scope.primarySubsystem,
      relevantFiles: handoff.relevantFiles,
      filesChanged: Object.freeze(filesChanged),
      capabilitiesReused: Object.freeze(capabilitiesReused),
      newCapabilities: Object.freeze(newCapabilities),
      dependencies: handoff.dependencies,
      tests: handoff.requiredTests,
      build: review.didBuildPass ? 'PASS' : 'FAIL',
      regression: review.didRegressionPass ? 'PASS' : 'FAIL',
      invariantStatus: !review.didAnyInvariantDrift ? 'LOCKED_ZERO_DRIFT' : 'DRIFT_DETECTED',
      securityStatus: handoff.securityImpact.externalAiDetected ? 'VIOLATION' : 'SOVEREIGN_NATIVE',
      databaseStatus: handoff.databaseImpact === 'DATABASE_READ_ONLY' ? 'READ_ONLY_PRESERVED' : 'MUTATION_FLAGGED',
      spatial369Status: handoff.spatial369Impact === 'BLOCKED_MODIFICATION' ? 'BLOCKED' : 'CANONICAL_FORMULA_A',
      finalStatus: review.finalVerdict,
      provenance,
      recordHash,
      // Task 30 — RX Evidence Lifecycle Integration
      ...(rxSummary
        ? {
            rxLifecycleId: rxSummary.rxLifecycleId,
            rxStageReached: rxSummary.finalStage,
            rxEvidenceSummaryHash: rxSummary.masterProvenanceHash,
            rxEvidenceCount: rxSummary.totalEvidenceCount,
          }
        : {}),
    });

    this.records.set(handoff.taskId, record);
    if (rxSummary) {
      this.rxSummaries.set(handoff.taskId, rxSummary);
    }
    return record;
  }

  /**
   * Retrieves an RX evidence summary by TaskId.
   */
  public getRxEvidenceSummary(taskId: string): PMARxEvidenceSummary | undefined {
    return this.rxSummaries.get(taskId);
  }

  /**
   * Retrieves a task record by TaskId.
   */
  public getRecord(taskId: string): PMATaskMemoryRecord | undefined {
    return this.records.get(taskId);
  }

  /**
   * Returns all recorded tasks.
   */
  public getAllRecords(): readonly PMATaskMemoryRecord[] {
    return Object.freeze(Array.from(this.records.values()));
  }

  /**
   * Queries tasks by subsystem.
   */
  public getRecordsBySubsystem(subsystem: string): readonly PMATaskMemoryRecord[] {
    return Object.freeze(
      Array.from(this.records.values()).filter((r) => r.subsystem === subsystem)
    );
  }

  // ---------------------------------------------------------------------------
  // Task 28 — Persistent Change Events
  // ---------------------------------------------------------------------------

  private readonly changeEvents = new Map<string, PMAFileChangeRecord>();

  /**
   * Records a filesystem change event into project memory.
   */
  public recordChangeEvent(change: PMAFileChangeRecord): void {
    this.changeEvents.set(change.changeId, change);
  }

  /**
   * Retrieves all recorded change events.
   */
  public getAllChangeEvents(): readonly PMAFileChangeRecord[] {
    return Object.freeze(Array.from(this.changeEvents.values()));
  }

  /**
   * Retrieves change events for a specific task ID.
   */
  public getChangesForTask(taskId: string): readonly PMAFileChangeRecord[] {
    return Object.freeze(
      Array.from(this.changeEvents.values()).filter((c) => c.taskId === taskId)
    );
  }
}

