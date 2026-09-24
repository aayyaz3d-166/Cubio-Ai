/**
 * CUBiO AI — 3D Memory Studio
 * Task 27 — Native Project Manager Agent (PMA)
 * src/cubio/language/native/pma/projectManagerAgent.ts
 *
 * Master CUBiO Project Manager Agent (PMA).
 * Orchestrates pre-development intelligence, developer handoff contracts,
 * post-development verification, and sovereign project memory.
 *
 * Task 29: tinyPMA front-layer integrated.
 * interpretRequest() accepts natural-language text and routes through
 * TinyPMA before forwarding to planTask() when approved.
 */

import {
  PMATaskRequest,
  PMAHandoffContract,
  PMAGitChanges,
  PMAReviewVerdict,
  PMATaskMemoryRecord,
  PMAFileChangeRecord,
  PMATaskContext,
  PMAWatcherStatus,
} from './types';
import { PMAPlanner } from './pmaPlanner';
import { PostDevelopmentVerifier } from './postDevelopmentVerifier';
import { ProjectMemory } from './projectMemory';
import { ProjectChangeWatcher } from './projectChangeWatcher';
import { TinyPMA } from './tinyPMA';
import { TinyPMAHandoff } from './tinyPMATypes';
import { PMARxEvidenceEngine, PMARxEvidenceSummary } from './pmaRxEvidenceLifecycle';
import { GlobalTaskEntryGate } from './globalTaskEntryGate';
import {
  TaskIntakeRequest,
  TaskIntakeRoutingResult,
  TaskExecutionAuthorization,
} from './globalEntryGateTypes';

export interface GoldenPathExecutionResult {
  readonly handoff: PMAHandoffContract;
  readonly changes: PMAGitChanges;
  readonly review: PMAReviewVerdict;
  readonly memoryRecord: PMATaskMemoryRecord;
  // Task 30 — RX Evidence Summary
  readonly rxEvidenceSummary?: PMARxEvidenceSummary;
}

/**
 * Result of interpretRequest(): the tinyPMA handoff plus optionally
 * the downstream PMAHandoffContract when isApprovedForPMAHandoff=true
 * and autoPlan=true.
 */
export interface TinyPMAInterpretationResult {
  readonly tinyHandoff: TinyPMAHandoff;
  readonly pmaHandoff?: PMAHandoffContract;
}

export class CubiOProjectManagerAgent {
  public readonly is_actuation_blocked: boolean = true;
  private readonly planner: PMAPlanner;
  private readonly verifier: PostDevelopmentVerifier;
  private readonly memory: ProjectMemory;
  private readonly watcher: ProjectChangeWatcher;
  private readonly tinyPMA: TinyPMA;
  private readonly rxEvidenceEngine: PMARxEvidenceEngine;
  private readonly entryGate: GlobalTaskEntryGate;

  constructor(customRootDir?: string) {
    this.planner = new PMAPlanner(customRootDir);
    this.verifier = new PostDevelopmentVerifier(customRootDir);
    this.memory = new ProjectMemory();
    this.watcher = new ProjectChangeWatcher(customRootDir);
    this.tinyPMA = new TinyPMA(customRootDir);
    this.rxEvidenceEngine = new PMARxEvidenceEngine();
    this.entryGate = new GlobalTaskEntryGate(customRootDir, 256, {
      tinyPMA: this.tinyPMA,
      planner: this.planner,
      verifier: this.verifier,
      memory: this.memory,
      watcher: this.watcher,
      rxEvidenceEngine: this.rxEvidenceEngine,
    });
  }

  /**
   * Pre-Development Gate: Parses request, discovers capabilities, verifies frozen baselines,
   * and generates the strict developer handoff contract.
   */
  public planTask(request: PMATaskRequest): PMAHandoffContract {
    return this.planner.generateHandoffContract(request);
  }

  /**
   * Post-Development Verification Gate: Audits developer git changes against the handoff contract,
   * runs invariant checks, and answers the 9 Final Project Review questions.
   */
  public verifyDevelopment(
    handoff: PMAHandoffContract,
    changes: PMAGitChanges,
    options?: {
      unitTestsPassed?: boolean;
      buildPassed?: boolean;
      regressionPassed?: boolean;
      implementationMatchesRequest?: boolean;
      duplicatesCreated?: boolean;
    }
  ): PMAReviewVerdict {
    return this.verifier.conductFinalReview(handoff, changes, options);
  }

  /**
   * Project Memory Gate: Records completed task into sovereign memory ledger.
   * Task 30: Passes optional rxSummary to recordCompletedTask.
   */
  public recordTask(
    handoff: PMAHandoffContract,
    changes: PMAGitChanges,
    review: PMAReviewVerdict,
    rxSummary?: PMARxEvidenceSummary
  ): PMATaskMemoryRecord {
    return this.memory.recordCompletedTask(handoff, changes, review, rxSummary);
  }

  /**
   * Section 23: Complete PMA Golden Path execution.
   * USER PROMPT -> PMA -> UNDERSTANDING -> PROJECT MAP -> TARGETED EXPLORATION ->
   * CAPABILITY RESOLUTION -> DEPENDENCY CHECK -> PREVIOUS WORK -> FROZEN/SAFETY CHECK ->
   * DEVELOPMENT PLAN -> DEVELOPER HANDOFF -> EXECUTION -> TEST -> BUILD -> REGRESSION ->
   * FINAL REVIEW -> PROJECT MEMORY -> FINAL RESULT.
   */
  public executeGoldenPath(
    request: PMATaskRequest,
    developerAction: (handoff: PMAHandoffContract) => {
      changes: PMAGitChanges;
      unitTestsPassed: boolean;
      buildPassed: boolean;
      regressionPassed: boolean;
      implementationMatchesRequest?: boolean;
      duplicatesCreated?: boolean;
    }
  ): GoldenPathExecutionResult {
    // 1. Pre-development Planning & Handoff
    const handoff = this.planTask(request);

    // Task 30: Start RX0 Birth lifecycle for this task
    this.rxEvidenceEngine.startRx0Birth(handoff, request.tenantId || 'root');

    if (!handoff.isApprovedForDevelopment) {
      const review: PMAReviewVerdict = {
        taskId: handoff.taskId,
        didImplementationMatchRequest: false,
        didReuseExistingCapabilities: false,
        wereDuplicatesCreated: handoff.conflicts.some((c) => c.type === 'DUPLICATE_IMPLEMENTATION'),
        wereProtectedFilesTouched: handoff.conflicts.some((c) => c.type === 'FROZEN_COMPONENT_CONFLICT'),
        wereUnrelatedFilesModified: false,
        didTestsPass: false,
        didBuildPass: false,
        didRegressionPass: false,
        didAnyInvariantDrift: true,
        finalVerdict: 'BLOCKED',
        detailedFindings: Object.freeze([
          `[GATE_BLOCKED] Pre-development gate halted execution: ${handoff.rejectionReason}`,
        ]),
        timestamp: Date.now(),
      };

      const changes: PMAGitChanges = {
        changedFiles: [],
        newFiles: [],
        deletedFiles: [],
        renamedFiles: [],
      };

      // RX5 Exit on blocked handoff
      const { summary: rxSummary } = this.rxEvidenceEngine.advanceRx5Exit(
        handoff.taskId,
        'BLOCKED',
        request.tenantId || 'root'
      );

      const memoryRecord = this.recordTask(handoff, changes, review, rxSummary);

      return {
        handoff,
        changes,
        review,
        memoryRecord,
        rxEvidenceSummary: rxSummary,
      };
    }

    // Task 30: RX1 Superposition (candidate capabilities discovery)
    this.rxEvidenceEngine.advanceRx1Superposition(
      handoff.taskId,
      handoff.existingCapabilities,
      request.tenantId || 'root'
    );

    // Task 30: RX2 Interaction (selected plan and boundaries)
    this.rxEvidenceEngine.advanceRx2Interaction(
      handoff.taskId,
      {
        reuseStrategy: handoff.reuseStrategy,
        allowedFiles: handoff.allowedFiles,
        dependencies: handoff.dependencies,
      },
      request.tenantId || 'root'
    );

    // 2. Developer Implementation
    const devResult = developerAction(handoff);

    // Task 30: RX3 Awareness Growth (subsystem awareness and file changes)
    this.rxEvidenceEngine.advanceRx3AwarenessGrowth(
      handoff.taskId,
      {
        crossSubsystems: handoff.scope.affectedSubsystems,
        watcherChanges: this.memory.getChangesForTask(handoff.taskId),
        constraintNotes: `Primary subsystem: ${handoff.scope.primarySubsystem}`,
      },
      request.tenantId || 'root'
    );

    // 3. Post-Development Verification & Final Review
    const review = this.verifyDevelopment(handoff, devResult.changes, {
      unitTestsPassed: devResult.unitTestsPassed,
      buildPassed: devResult.buildPassed,
      regressionPassed: devResult.regressionPassed,
      implementationMatchesRequest: devResult.implementationMatchesRequest ?? true,
      duplicatesCreated: devResult.duplicatesCreated ?? false,
    });

    // Task 30: RX4 Evolution (changes, review verdict, test outcomes)
    this.rxEvidenceEngine.advanceRx4Evolution(
      handoff.taskId,
      {
        changes: devResult.changes,
        review,
        testOutcomes: {
          unitTests: devResult.unitTestsPassed ? 'PASS' : 'FAIL',
          build: devResult.buildPassed ? 'PASS' : 'FAIL',
          regression: devResult.regressionPassed ? 'PASS' : 'FAIL',
        },
      },
      request.tenantId || 'root'
    );

    // Task 30: RX5 Exit & Final Evidence Aggregation (ephemeral cleanup)
    const { summary: rxSummary } = this.rxEvidenceEngine.advanceRx5Exit(
      handoff.taskId,
      review.finalVerdict,
      request.tenantId || 'root'
    );

    // 4. Project Memory Record (incorporates RX provenance)
    const memoryRecord = this.recordTask(handoff, devResult.changes, review, rxSummary);

    return {
      handoff,
      changes: devResult.changes,
      review,
      memoryRecord,
      rxEvidenceSummary: rxSummary,
    };
  }

  public getMemory(): ProjectMemory {
    return this.memory;
  }

  /**
   * Returns the underlying TinyPMA interpreter instance for direct access.
   */
  public getTinyPMA(): TinyPMA {
    return this.tinyPMA;
  }

  /**
   * Task 30: Returns the underlying PMARxEvidenceEngine instance for direct access.
   */
  public getRxEvidenceEngine(): PMARxEvidenceEngine {
    return this.rxEvidenceEngine;
  }

  /**
   * Task 31: Returns the GlobalTaskEntryGate instance for direct access.
   */
  public getGlobalEntryGate(): GlobalTaskEntryGate {
    return this.entryGate;
  }

  /**
   * Task 31: Mandatory Global Entry Gate intake for any incoming task.
   * Ensures every task enters Global Entry Gate BEFORE tinyPMA, Native PMA,
   * developer/agent execution, or file modifications.
   */
  public intakeTask(request: TaskIntakeRequest): TaskIntakeRoutingResult {
    return this.entryGate.intakeTask(request);
  }

  // ---------------------------------------------------------------------------
  // Task 29 — tinyPMA: Natural-Language Interpretation Front-Layer
  // ---------------------------------------------------------------------------

  /**
   * Interpret a natural-language user request through tinyPMA.
   *
   * @param userPrompt  Raw user text.
   * @param autoPlan    If true and tinyPMA approves the request, automatically
   *                    invokes planTask() and returns the PMAHandoffContract as well.
   *                    Defaults to false (interpretation only).
   *
   * FLOW:
   *   userPrompt → TinyPMA.interpretRequest() → TinyPMAHandoff
   *              → (if autoPlan && isApprovedForPMAHandoff)
   *              → CubiOProjectManagerAgent.planTask() → PMAHandoffContract
   */
  public interpretRequest(
    userPrompt: string,
    autoPlan: boolean = false
  ): TinyPMAInterpretationResult {
    const tinyHandoff = this.tinyPMA.interpretRequest(userPrompt);

    if (autoPlan && tinyHandoff.isApprovedForPMAHandoff) {
      // Build a PMATaskRequest from the tinyPMA handoff
      const pmaRequest: PMATaskRequest = {
        requestId: tinyHandoff.interpretationId,
        userPrompt: tinyHandoff.requestText,
        taskType: tinyHandoff.mappedPMATaskType,
        targetSubsystems: tinyHandoff.pmaStudyScope as string[],
        explicitFullProjectScan: false,
      };
      const pmaHandoff = this.planTask(pmaRequest);
      return { tinyHandoff, pmaHandoff };
    }

    return { tinyHandoff };
  }

  // ---------------------------------------------------------------------------
  // Task 28 — Persistent Project Change Watcher Methods
  // ---------------------------------------------------------------------------

  public getWatcher(): ProjectChangeWatcher {
    return this.watcher;
  }

  public startTaskContext(
    request: PMATaskRequest,
    allowedFiles?: readonly string[],
    conversationId?: string
  ): PMATaskContext {
    return this.watcher.startTaskContext(request, allowedFiles, conversationId);
  }

  public endTaskContext(taskId: string): PMATaskContext | undefined {
    return this.watcher.endTaskContext(taskId);
  }

  public observeFileChange(
    filePath: string,
    currentContent?: Buffer | string,
    options?: { taskId?: string; conversationId?: string; isExplicitDeletion?: boolean }
  ): PMAFileChangeRecord {
    const record = this.watcher.observeFileChange(filePath, currentContent, options);
    this.memory.recordChangeEvent(record);
    return record;
  }

  public reconcileChanges(paths?: readonly string[]): {
    reconciledCount: number;
    status: PMAWatcherStatus;
  } {
    return this.watcher.reconcileBaseline(paths);
  }
}

