/**
 * CUBiO AI — Task 31: Global PMA Entry Gate & Mandatory Task Routing Layer
 * src/cubio/language/native/pma/globalTaskEntryGate.ts
 *
 * Mandatory top-level task intake, routing, authorization, and bypass protection engine.
 * Sits directly ABOVE tinyPMA and Native PMA in the architecture.
 *
 * Mandatory Flow:
 *   ANY TASK
 *      ↓
 *   GlobalTaskEntryGate.intakeTask()
 *      ↓
 *   tinyPMA.interpretRequest()
 *      ↓
 *   Native PMA (PMAPlanner)
 *      ↓
 *   Execution Authorization Gate
 *      ↓
 *   GlobalTaskEntryGate.executeAuthorizedTask()
 *      ↓
 *   Change Watcher + RX Evidence + Verifier + Project Memory
 *
 * Core Guarantees:
 * 1. HARD RULE: No task may directly reach developer, execution agent, file write,
 *    build, test, or training without passing through GlobalTaskEntryGate.
 * 2. Fail-closed: Ambiguous/unknown/invalid inputs are rejected deterministically.
 * 3. Recursion protection: Cycle detection & call depth tracking prevent infinite loops.
 * 4. Concurrency isolation: Independent intake, authorization, and execution states per task.
 * 5. Permanent hardware actuation lockout (is_actuation_blocked = true).
 * 6. Zero foreign AI / zero cloud dependencies.
 */

import * as crypto from 'crypto';
import {
  TaskIntakeRequest,
  TaskIntakeRecord,
  TaskExecutionAuthorization,
  TaskBypassRecord,
  TaskIntakeRoutingResult,
  TaskRoutingState,
} from './globalEntryGateTypes';
import { TinyPMA } from './tinyPMA';
import { TinyPMARequestType, TinyPMAHandoff } from './tinyPMATypes';
import {
  PMATaskRequest,
  PMAHandoffContract,
  PMAGitChanges,
  PMAReviewVerdict,
  PMATaskMemoryRecord,
} from './types';
import { PMAPlanner } from './pmaPlanner';
import { PostDevelopmentVerifier } from './postDevelopmentVerifier';
import { ProjectMemory } from './projectMemory';
import { ProjectChangeWatcher } from './projectChangeWatcher';
import { PMARxEvidenceEngine, PMARxEvidenceSummary } from './pmaRxEvidenceLifecycle';
import { FrozenProtectionGuard } from './frozenProtectionGuard';

export class GlobalTaskEntryGate {
  public static readonly DEFAULT_MAX_INTAKES = 256;
  public static readonly MAX_EXECUTION_DEPTH = 3;

  public readonly is_actuation_blocked: boolean = true;
  private readonly maxIntakes: number;

  // Existing PMA components (reused, zero duplicate engines)
  private readonly tinyPMA: TinyPMA;
  private readonly planner: PMAPlanner;
  private readonly verifier: PostDevelopmentVerifier;
  private readonly memory: ProjectMemory;
  private readonly watcher: ProjectChangeWatcher;
  private readonly rxEvidenceEngine: PMARxEvidenceEngine;
  private readonly frozenGuard: FrozenProtectionGuard;

  // In-memory bounded intake state
  private readonly intakeRecords = new Map<string, TaskIntakeRecord>();
  private readonly authorizations = new Map<string, TaskExecutionAuthorization>();
  private readonly tokenToTaskIdMap = new Map<string, string>();
  private readonly bypassAttempts: TaskBypassRecord[] = [];

  // Recursion protection: active intake stack
  private readonly activeIntakeStack = new Set<string>();

  constructor(
    customRootDir?: string,
    maxIntakes: number = GlobalTaskEntryGate.DEFAULT_MAX_INTAKES,
    deps?: {
      tinyPMA?: TinyPMA;
      planner?: PMAPlanner;
      verifier?: PostDevelopmentVerifier;
      memory?: ProjectMemory;
      watcher?: ProjectChangeWatcher;
      rxEvidenceEngine?: PMARxEvidenceEngine;
      frozenGuard?: FrozenProtectionGuard;
    }
  ) {
    this.maxIntakes = Math.max(1, maxIntakes);
    this.tinyPMA = deps?.tinyPMA || new TinyPMA(customRootDir);
    this.planner = deps?.planner || new PMAPlanner(customRootDir);
    this.verifier = deps?.verifier || new PostDevelopmentVerifier(customRootDir);
    this.memory = deps?.memory || new ProjectMemory();
    this.watcher = deps?.watcher || new ProjectChangeWatcher(customRootDir);
    this.rxEvidenceEngine = deps?.rxEvidenceEngine || new PMARxEvidenceEngine();
    this.frozenGuard = deps?.frozenGuard || new FrozenProtectionGuard(customRootDir);
  }

  public verifyActuationLock(): void {
    if (this.is_actuation_blocked !== true) {
      throw new Error('ACTUATION_BLOCKED_VIOLATION: Actuation is permanently blocked in sovereign CUBiO architecture.');
    }
  }

  // -------------------------------------------------------------------------
  // 1. INTAKE & MANDATORY ROUTING GATE
  // -------------------------------------------------------------------------

  /**
   * Universal front-door for all incoming tasks.
   * Enforces:
   *   RECEIVED -> ENTRY_VALIDATED -> TINY_PMA_ACTIVE -> NATIVE_PMA_ACTIVE -> HANDOFF_READY -> EXECUTION_AUTHORIZED
   */
  public intakeTask(request: TaskIntakeRequest): TaskIntakeRoutingResult {
    this.verifyActuationLock();

    // 1. Validate prompt
    const prompt = request?.userPrompt?.trim();
    if (!prompt) {
      return this.buildRejectedIntake(request, 'Empty user prompt rejected at Global Entry Gate');
    }

    // 2. Deterministic Intake ID & Task ID
    const receivedAt = Date.now();
    const taskIntakeId = `INTAKE-${crypto.createHash('sha256').update(`${prompt}:${request.requestId || ''}:${receivedAt}`).digest('hex').slice(0, 12).toUpperCase()}`;
    const taskId = request.requestId || `TASK-${crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 10).toUpperCase()}`;

    // 3. Recursion Guard
    if (this.activeIntakeStack.has(taskId)) {
      return this.buildRejectedIntake(
        request,
        `RECURSION_DETECTED: Task "${taskId}" is already actively being processed by GlobalTaskEntryGate.`
      );
    }

    if (this.activeIntakeStack.size >= GlobalTaskEntryGate.MAX_EXECUTION_DEPTH) {
      return this.buildRejectedIntake(
        request,
        `MAX_EXECUTION_DEPTH_EXCEEDED: GlobalTaskEntryGate call depth limit (${GlobalTaskEntryGate.MAX_EXECUTION_DEPTH}) reached.`
      );
    }

    this.activeIntakeStack.add(taskId);

    try {
      // 4. Initial Intake Record in RECEIVED state
      let currentRecord = this.createIntakeRecord({
        taskIntakeId,
        taskId,
        request: prompt,
        requestType: 'UNKNOWN',
        source: request.source || 'USER_DIRECT',
        receivedAt,
        routingState: 'RECEIVED',
        tinyPMAStatus: 'PENDING',
        nativePMAStatus: 'PENDING',
        authorizationState: 'PENDING',
        scope: [],
        allowedFiles: [],
        protectedFiles: [],
        executionState: 'IDLE',
      });

      // 5. Transition to ENTRY_VALIDATED
      currentRecord = this.updateIntakeState(currentRecord, 'ENTRY_VALIDATED');

      // 6. Activate tinyPMA for Interpretation
      currentRecord = this.updateIntakeState(currentRecord, 'TINY_PMA_ACTIVE');
      const tinyHandoff = this.tinyPMA.interpretRequest(prompt);

      if (!tinyHandoff.isApprovedForPMAHandoff) {
        currentRecord = this.updateIntakeState(currentRecord, 'REJECTED', {
          tinyPMAStatus: 'REJECTED',
          finalState: 'REJECTED',
        });
        const authorization = this.buildRejectionAuthorization(
          taskIntakeId,
          taskId,
          tinyHandoff.requestType,
          tinyHandoff.rejectionReason || 'tinyPMA rejected request'
        );
        return { intakeRecord: currentRecord, tinyPMAHandoff: tinyHandoff, authorization };
      }

      // 7. Transition to Native PMA Planning
      currentRecord = this.updateIntakeState(currentRecord, 'NATIVE_PMA_ACTIVE', {
        requestType: tinyHandoff.requestType,
        tinyPMAStatus: 'APPROVED',
        nativePMAStatus: 'ACTIVE',
      });

      const pmaRequest: PMATaskRequest = {
        requestId: taskId,
        userPrompt: prompt,
        taskType: tinyHandoff.mappedPMATaskType,
        targetSubsystems: tinyHandoff.pmaStudyScope as string[],
        explicitFullProjectScan: false,
        tenantId: request.tenantId || 'root',
        allowedFileOverrides: request.allowedFileOverrides,
      };

      const pmaHandoff = this.planner.generateHandoffContract(pmaRequest);

      if (!pmaHandoff.isApprovedForDevelopment) {
        currentRecord = this.updateIntakeState(currentRecord, 'BLOCKED', {
          nativePMAStatus: 'BLOCKED',
          finalState: 'BLOCKED',
        });
        const authorization = this.buildRejectionAuthorization(
          taskIntakeId,
          taskId,
          tinyHandoff.requestType,
          pmaHandoff.rejectionReason || 'Native PMA planning gate blocked task'
        );
        return { intakeRecord: currentRecord, tinyPMAHandoff: tinyHandoff, pmaHandoff, authorization };
      }

      // 8. Transition to HANDOFF_READY
      currentRecord = this.updateIntakeState(currentRecord, 'HANDOFF_READY', {
        nativePMAStatus: 'APPROVED',
        scope: pmaHandoff.scope.affectedSubsystems,
        allowedFiles: pmaHandoff.allowedFiles,
        protectedFiles: pmaHandoff.protectedFiles,
      });

      // 9. Generate Execution Authorization
      const authorizationToken = `AUTH-${crypto.createHash('sha256').update(`${taskIntakeId}:${taskId}:${pmaHandoff.handoffHash}`).digest('hex').slice(0, 16).toUpperCase()}`;

      const authProvenancePayload = JSON.stringify({
        taskIntakeId,
        taskId,
        authorizationToken,
        handoffHash: pmaHandoff.handoffHash,
        allowedFiles: pmaHandoff.allowedFiles,
      });
      const provenanceHash = crypto.createHash('sha256').update(authProvenancePayload).digest('hex');

      const authorization: TaskExecutionAuthorization = Object.freeze({
        isAuthorized: true,
        authorizationToken,
        taskIntakeId,
        taskId,
        requestType: tinyHandoff.requestType,
        allowedFiles: pmaHandoff.allowedFiles,
        protectedFiles: pmaHandoff.protectedFiles,
        scope: pmaHandoff.scope.affectedSubsystems,
        capabilities: pmaHandoff.existingCapabilities.map((c) => c.capabilityName),
        dependencies: pmaHandoff.dependencies,
        safetyConstraints: pmaHandoff.expectedInvariants,
        acceptanceCriteria: pmaHandoff.regressionRequirements,
        handoffHash: pmaHandoff.handoffHash,
        provenanceHash,
        authorizedAt: Date.now(),
      });

      this.authorizations.set(authorizationToken, authorization);
      this.tokenToTaskIdMap.set(authorizationToken, taskId);

      // 10. Update state to EXECUTION_AUTHORIZED
      currentRecord = this.updateIntakeState(currentRecord, 'EXECUTION_AUTHORIZED', {
        authorizationState: 'AUTHORIZED',
      });

      return {
        intakeRecord: currentRecord,
        tinyPMAHandoff: tinyHandoff,
        pmaHandoff,
        authorization,
      };
    } finally {
      this.activeIntakeStack.delete(taskId);
    }
  }

  // -------------------------------------------------------------------------
  // 2. AUTHORIZED EXECUTION ENFORCEMENT
  // -------------------------------------------------------------------------

  /**
   * Executes a developer action ONLY IF backed by a valid, matching TaskExecutionAuthorization.
   * Coordinates Change Watcher, RX Evidence Lifecycle, Post-Dev Verification, and Project Memory.
   */
  public executeAuthorizedTask(
    authorization: TaskExecutionAuthorization,
    handoff: PMAHandoffContract,
    developerAction: (handoff: PMAHandoffContract) => {
      changes: PMAGitChanges;
      unitTestsPassed: boolean;
      buildPassed: boolean;
      regressionPassed: boolean;
      implementationMatchesRequest?: boolean;
      duplicatesCreated?: boolean;
    }
  ): {
    readonly intakeRecord: TaskIntakeRecord;
    readonly changes: PMAGitChanges;
    readonly review: PMAReviewVerdict;
    readonly memoryRecord: PMATaskMemoryRecord;
    readonly rxEvidenceSummary?: PMARxEvidenceSummary;
  } {
    this.verifyActuationLock();

    // 1. Verify Authorization Validity
    const storedAuth = this.authorizations.get(authorization.authorizationToken);
    if (!storedAuth || !storedAuth.isAuthorized || storedAuth.taskId !== handoff.taskId) {
      this.recordBypassAttempt({
        attemptedAction: 'EXECUTE_TASK_WITHOUT_VALID_AUTHORIZATION',
        targetFiles: handoff.allowedFiles as string[],
        authorizationTokenProvided: authorization?.authorizationToken,
        rejectionReason: 'Invalid, missing, or mismatched TaskExecutionAuthorization token.',
      });
      throw new Error('BYPASS_REJECTED: Execution attempted without a valid TaskExecutionAuthorization.');
    }

    let intakeRecord = this.intakeRecords.get(authorization.taskIntakeId);
    if (!intakeRecord) {
      throw new Error(`INTAKE_RECORD_NOT_FOUND: ${authorization.taskIntakeId}`);
    }

    // 2. Transition state to EXECUTING
    intakeRecord = this.updateIntakeState(intakeRecord, 'EXECUTING', {
      executionState: 'EXECUTING',
    });

    // 3. Coordinate RX0 Birth
    this.rxEvidenceEngine.startRx0Birth(handoff, 'root');

    // 4. Associate Task with Change Watcher Context
    this.watcher.startTaskContext(
      { requestId: handoff.taskId, userPrompt: handoff.objective },
      handoff.allowedFiles
    );

    // 5. RX1 Superposition & RX2 Interaction
    this.rxEvidenceEngine.advanceRx1Superposition(handoff.taskId, handoff.existingCapabilities, 'root');
    this.rxEvidenceEngine.advanceRx2Interaction(
      handoff.taskId,
      {
        reuseStrategy: handoff.reuseStrategy,
        allowedFiles: handoff.allowedFiles,
        dependencies: handoff.dependencies,
      },
      'root'
    );

    // 6. Developer Implementation
    const devResult = developerAction(handoff);

    // 7. Verify Scope Boundaries Against Authorization
    const allowedSet = new Set(authorization.allowedFiles.map((f) => f.toLowerCase().replace(/\\/g, '/')));
    const protectedSet = new Set(authorization.protectedFiles.map((f) => f.toLowerCase().replace(/\\/g, '/')));

    const touchedFiles = [
      ...devResult.changes.changedFiles,
      ...devResult.changes.newFiles,
      ...devResult.changes.deletedFiles,
      ...devResult.changes.renamedFiles,
    ];

    for (const file of touchedFiles) {
      const norm = file.toLowerCase().replace(/\\/g, '/');
      if (protectedSet.has(norm) || this.frozenGuard.isProtected(norm)) {
        this.recordBypassAttempt({
          attemptedAction: `MODIFY_PROTECTED_FILE:${file}`,
          targetFiles: [file],
          authorizationTokenProvided: authorization.authorizationToken,
          rejectionReason: `Developer touched protected file: ${file}`,
        });
      }
      if (!allowedSet.has(norm)) {
        this.recordBypassAttempt({
          attemptedAction: `UNAUTHORIZED_SCOPE_VIOLATION:${file}`,
          targetFiles: [file],
          authorizationTokenProvided: authorization.authorizationToken,
          rejectionReason: `Developer modified file outside authorized scope: ${file}`,
        });
      }
    }

    // 8. RX3 Awareness Growth (changes & watcher records)
    this.rxEvidenceEngine.advanceRx3AwarenessGrowth(
      handoff.taskId,
      {
        crossSubsystems: handoff.scope.affectedSubsystems,
        watcherChanges: this.memory.getChangesForTask(handoff.taskId),
        constraintNotes: `Scope: ${handoff.scope.primarySubsystem}`,
      },
      'root'
    );

    // 9. Post-Development Verification Gate
    intakeRecord = this.updateIntakeState(intakeRecord, 'VERIFICATION', {
      executionState: 'VERIFYING',
    });

    const review = this.verifier.conductFinalReview(handoff, devResult.changes, {
      unitTestsPassed: devResult.unitTestsPassed,
      buildPassed: devResult.buildPassed,
      regressionPassed: devResult.regressionPassed,
      implementationMatchesRequest: devResult.implementationMatchesRequest ?? true,
      duplicatesCreated: devResult.duplicatesCreated ?? false,
    });

    // 10. RX4 Evolution
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
      'root'
    );

    // 11. RX5 Exit & Final Evidence Aggregation
    const { summary: rxSummary } = this.rxEvidenceEngine.advanceRx5Exit(
      handoff.taskId,
      review.finalVerdict,
      'root'
    );

    // 12. Transition to FINAL_REVIEW -> MEMORY_COMMIT
    intakeRecord = this.updateIntakeState(intakeRecord, 'FINAL_REVIEW');
    intakeRecord = this.updateIntakeState(intakeRecord, 'MEMORY_COMMIT');

    const memoryRecord = this.memory.recordCompletedTask(
      handoff,
      devResult.changes,
      review,
      rxSummary
    );

    // 13. End Change Watcher Context
    this.watcher.endTaskContext(handoff.taskId);

    // 14. Transition to CLOSED
    intakeRecord = this.updateIntakeState(intakeRecord, 'CLOSED', {
      executionState: 'COMPLETED',
      finalState: review.finalVerdict,
    });

    return {
      intakeRecord,
      changes: devResult.changes,
      review,
      memoryRecord,
      rxEvidenceSummary: rxSummary,
    };
  }

  // -------------------------------------------------------------------------
  // 3. BYPASS DETECTION & PROTECTED SCOPE ENFORCEMENT
  // -------------------------------------------------------------------------

  /**
   * Intercepts and rejects direct execution attempts lacking Global Entry Gate authorization.
   */
  public validateDirectExecution(params: {
    attemptedAction: string;
    targetFiles?: readonly string[];
    authorizationToken?: string;
  }): {
    readonly isAllowed: boolean;
    readonly bypassRecord?: TaskBypassRecord;
  } {
    this.verifyActuationLock();

    const { attemptedAction, targetFiles = [], authorizationToken } = params;

    if (!authorizationToken) {
      const bypassRecord = this.recordBypassAttempt({
        attemptedAction,
        targetFiles: targetFiles as string[],
        rejectionReason: 'NO_AUTHORIZATION_TOKEN: Direct execution attempted without passing Global PMA Entry Gate.',
      });
      return { isAllowed: false, bypassRecord };
    }

    const auth = this.authorizations.get(authorizationToken);
    if (!auth || !auth.isAuthorized) {
      const bypassRecord = this.recordBypassAttempt({
        attemptedAction,
        targetFiles: targetFiles as string[],
        authorizationTokenProvided: authorizationToken,
        rejectionReason: 'INVALID_AUTHORIZATION_TOKEN: Provided token is not active or authorized.',
      });
      return { isAllowed: false, bypassRecord };
    }

    // Check target files against allowed files
    const allowedSet = new Set(auth.allowedFiles.map((f) => f.toLowerCase().replace(/\\/g, '/')));
    for (const file of targetFiles) {
      const norm = file.toLowerCase().replace(/\\/g, '/');
      if (this.frozenGuard.isProtected(norm) || !allowedSet.has(norm)) {
        const bypassRecord = this.recordBypassAttempt({
          attemptedAction,
          targetFiles: [file],
          authorizationTokenProvided: authorizationToken,
          rejectionReason: `UNAUTHORIZED_FILE_ACCESS: File "${file}" is not in authorized allowedFiles list.`,
        });
        return { isAllowed: false, bypassRecord };
      }
    }

    return { isAllowed: true };
  }

  // -------------------------------------------------------------------------
  // 4. PRIVATE HELPERS
  // -------------------------------------------------------------------------

  private createIntakeRecord(params: {
    taskIntakeId: string;
    taskId: string;
    request: string;
    requestType: TinyPMARequestType;
    source: string;
    receivedAt: number;
    routingState: TaskRoutingState;
    tinyPMAStatus: 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'BYPASSED';
    nativePMAStatus: 'PENDING' | 'ACTIVE' | 'APPROVED' | 'BLOCKED' | 'BYPASSED';
    authorizationState: 'UNAUTHORIZED' | 'PENDING' | 'AUTHORIZED' | 'REVOKED' | 'BYPASS_REJECTED';
    scope: readonly string[];
    allowedFiles: readonly string[];
    protectedFiles: readonly string[];
    executionState: 'IDLE' | 'EXECUTING' | 'VERIFYING' | 'COMPLETED' | 'BLOCKED';
  }): TaskIntakeRecord {
    // Evict oldest if limit reached
    if (this.intakeRecords.size >= this.maxIntakes) {
      const oldestKey = this.intakeRecords.keys().next().value;
      if (oldestKey) this.intakeRecords.delete(oldestKey);
    }

    const provenancePayload = JSON.stringify({
      taskIntakeId: params.taskIntakeId,
      taskId: params.taskId,
      request: params.request,
      receivedAt: params.receivedAt,
    });
    const provenanceHash = crypto.createHash('sha256').update(provenancePayload).digest('hex');

    const record: TaskIntakeRecord = Object.freeze({
      ...params,
      provenanceHash,
    });

    this.intakeRecords.set(params.taskIntakeId, record);
    return record;
  }

  private updateIntakeState(
    current: TaskIntakeRecord,
    nextState: TaskRoutingState,
    updates?: Partial<TaskIntakeRecord>
  ): TaskIntakeRecord {
    const updated: TaskIntakeRecord = Object.freeze({
      ...current,
      ...updates,
      routingState: nextState,
    });
    this.intakeRecords.set(current.taskIntakeId, updated);
    return updated;
  }

  private buildRejectedIntake(
    request: TaskIntakeRequest,
    rejectionReason: string
  ): TaskIntakeRoutingResult {
    const receivedAt = Date.now();
    const taskIntakeId = `INTAKE-REJ-${Date.now()}`;
    const taskId = request?.requestId || `TASK-REJ-${Date.now()}`;

    const record = this.createIntakeRecord({
      taskIntakeId,
      taskId,
      request: request?.userPrompt || 'EMPTY',
      requestType: 'UNKNOWN',
      source: request?.source || 'USER_DIRECT',
      receivedAt,
      routingState: 'REJECTED',
      tinyPMAStatus: 'REJECTED',
      nativePMAStatus: 'BLOCKED',
      authorizationState: 'UNAUTHORIZED',
      scope: [],
      allowedFiles: [],
      protectedFiles: [],
      executionState: 'BLOCKED',
    });

    const authorization = this.buildRejectionAuthorization(taskIntakeId, taskId, 'UNKNOWN', rejectionReason);
    return { intakeRecord: record, authorization };
  }

  private buildRejectionAuthorization(
    taskIntakeId: string,
    taskId: string,
    requestType: TinyPMARequestType,
    rejectionReason: string
  ): TaskExecutionAuthorization {
    return Object.freeze({
      isAuthorized: false,
      authorizationToken: `AUTH-REJECTED-${Date.now()}`,
      taskIntakeId,
      taskId,
      requestType,
      allowedFiles: [],
      protectedFiles: [],
      scope: [],
      capabilities: [],
      dependencies: [],
      safetyConstraints: [],
      acceptanceCriteria: [],
      handoffHash: 'REJECTED',
      provenanceHash: crypto.createHash('sha256').update(`${taskId}:${rejectionReason}`).digest('hex'),
      authorizedAt: Date.now(),
      rejectionReason,
    });
  }

  private recordBypassAttempt(params: {
    attemptedAction: string;
    targetFiles: string[];
    authorizationTokenProvided?: string;
    rejectionReason: string;
  }): TaskBypassRecord {
    const bypassId = `BYPASS-${crypto.createHash('sha256').update(`${params.attemptedAction}:${Date.now()}`).digest('hex').slice(0, 12).toUpperCase()}`;
    const timestamp = Date.now();

    const provenancePayload = JSON.stringify({
      bypassId,
      timestamp,
      attemptedAction: params.attemptedAction,
      targetFiles: params.targetFiles,
      rejectionReason: params.rejectionReason,
    });
    const provenanceHash = crypto.createHash('sha256').update(provenancePayload).digest('hex');

    const record: TaskBypassRecord = Object.freeze({
      bypassId,
      timestamp,
      attemptedAction: params.attemptedAction,
      targetFiles: Object.freeze(params.targetFiles),
      authorizationTokenProvided: params.authorizationTokenProvided,
      rejectionReason: params.rejectionReason,
      provenanceHash,
    });

    this.bypassAttempts.push(record);
    return record;
  }

  // -------------------------------------------------------------------------
  // 5. QUERY / INSPECTION METHODS
  // -------------------------------------------------------------------------

  public getIntakeRecord(taskIntakeId: string): TaskIntakeRecord | undefined {
    return this.intakeRecords.get(taskIntakeId);
  }

  public getAuthorization(token: string): TaskExecutionAuthorization | undefined {
    return this.authorizations.get(token);
  }

  public getBypassAttempts(): readonly TaskBypassRecord[] {
    return Object.freeze([...this.bypassAttempts]);
  }

  public getTinyPMA(): TinyPMA {
    return this.tinyPMA;
  }

  public getPlanner(): PMAPlanner {
    return this.planner;
  }

  public getVerifier(): PostDevelopmentVerifier {
    return this.verifier;
  }

  public getMemory(): ProjectMemory {
    return this.memory;
  }

  public getWatcher(): ProjectChangeWatcher {
    return this.watcher;
  }

  public getRxEvidenceEngine(): PMARxEvidenceEngine {
    return this.rxEvidenceEngine;
  }
}
