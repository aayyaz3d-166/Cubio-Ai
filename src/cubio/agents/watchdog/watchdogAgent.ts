/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent)
 * src/cubio/agents/watchdog/watchdogAgent.ts
 *
 * Central sovereign orchestrator for AGENT-006 BTWA.
 * Monitors background development tasks, inspects activity, distinguishes
 * genuinely stuck vs legitimate long-running tasks, safely terminates
 * confirmed stuck processes and children, and recovers to clean idle state.
 */

import {
  WatchedTask,
  WatchdogConfig,
  WatchdogAuditReport,
  WatchdogSafetyStatus,
  WatchdogActionRecord,
  TaskLivenessState,
  TaskHealthRating,
  ProcessActivitySample,
  ProgressSnapshot,
} from './types';
import { ActivityInspector } from './activityInspector';
import { StuckClassifier } from './stuckClassifier';
import { SafeProcessTerminator, TerminationExecutor } from './safeProcessTerminator';
import { IdleRecoveryEngine } from './idleRecoveryEngine';
import { WatchdogAuditLogger } from './auditLogger';
import { WatchdogRxEvidenceTracker } from './rxEvidence';
import { ProgressSnapshotter } from './progressSnapshotter';
import { TaskCompletionEvaluator } from './taskCompletionEvaluator';
import { PersistentTaskLedger } from './taskLedger';
import { IS_ACTUATION_BLOCKED } from '../../intelligence/core/coreEngineContract';

export const DEFAULT_WATCHDOG_CONFIG: WatchdogConfig = Object.freeze({
  inactivityThresholdMs: 600000, // 10 minutes (600,000 ms)
  stallWarningThresholdMs: 300000, // 5 minutes (300,000 ms)
  sampleIntervalMs: 5000,
  minLogGrowthBytes: 1,
  logGracePeriodMs: 10000,
  autoRecover: true,
  maxRecoveryAttempts: 3,
});

export class BackgroundTaskWatchdogAgent {
  public static readonly AGENT_ID = 'AGENT-006-BTWA';
  public static readonly VERSION = '2.1.0';

  private readonly rootDir: string;
  private readonly config: WatchdogConfig;
  private readonly inspector: ActivityInspector;
  private readonly classifier: StuckClassifier;
  private readonly terminator: SafeProcessTerminator;
  private readonly recoveryEngine: IdleRecoveryEngine;
  private readonly completionEvaluator: TaskCompletionEvaluator;
  private readonly taskLedger: PersistentTaskLedger;
  private readonly trackedTasks = new Map<string, WatchedTask>();
  private readonly recoveryAttempts = new Map<string, number>();
  private readonly finalizedTasks = new Map<string, WatchdogAuditReport>();
  private isWatcherActive: boolean = false;
  private lastHeartbeatTimestamp: number = 0;

  constructor(
    customRootDir?: string,
    customConfig?: Partial<WatchdogConfig>,
    customTerminationExecutor?: TerminationExecutor,
    customLedgerFileName?: string
  ) {
    this.rootDir = customRootDir || process.cwd();
    this.config = Object.freeze({ ...DEFAULT_WATCHDOG_CONFIG, ...customConfig });
    this.inspector = new ActivityInspector(this.rootDir);
    this.classifier = new StuckClassifier();
    this.terminator = new SafeProcessTerminator(customTerminationExecutor);
    this.recoveryEngine = new IdleRecoveryEngine(this.rootDir);
    this.completionEvaluator = new TaskCompletionEvaluator(this.rootDir);
    this.taskLedger = new PersistentTaskLedger(this.rootDir, customLedgerFileName);
  }

  /**
   * Primary entry point: Inspects, classifies, snapshots, and supervises a watched task.
   */
  public async inspectAndHandleTask(
    task: WatchedTask,
    options?: {
      currentTimeMs?: number;
      injectedSample?: Partial<ProcessActivitySample>;
      lockfilePath?: string;
      simulatedExitCode?: number;
      stdoutStderrClosed?: boolean;
    }
  ): Promise<WatchdogAuditReport> {
    const startTimeMs = performance.now();
    const nowMs = options?.currentTimeMs ?? Date.now();

    // 1. Assert permanent hardware actuation lockout
    this.assertActuationLockout();

    const rxTracker = new WatchdogRxEvidenceTracker(task.taskId);
    rxTracker.recordRx0WatchRegistration(task.taskId, task.pid);

    // 2. Activity Inspection
    const sample = this.inspector.sampleTaskActivity(task, nowMs, options?.injectedSample);
    rxTracker.recordRx1ActivitySampling(task.samples.length + 1);

    // 3. Progress Snapshot
    const progressPercent = task.progressStep !== undefined ? Math.min(100, task.progressStep * 10) : 0;
    const snapshot = ProgressSnapshotter.takeSnapshot(task, sample, progressPercent);

    // 4. Completion & Evidence Evaluation
    const evidence = this.completionEvaluator.evaluateCompletion(task, sample, {
      simulatedExitCode: options?.simulatedExitCode,
      stdoutStderrClosed: options?.stdoutStderrClosed,
      nowMs,
    });

    // 5. Diagnosis: Distinguish stuck vs legitimate long-running vs stalled vs completed/failed
    const diagnosis = this.classifier.diagnose(task, sample, this.config, nowMs);
    const healthRating: TaskHealthRating = this.classifier.evaluateHealthRating(diagnosis);
    rxTracker.recordRx2StuckDiagnosis(diagnosis.isStuck, diagnosis.reason);

    const actions: WatchdogActionRecord[] = [];
    let finalState: TaskLivenessState = task.currentLivenessState;

    // Check completion criteria first
    if (!sample.isRunning || evidence.classification === 'WRAPPER_STILL_ACTIVE') {
      if (evidence.classification === 'WRAPPER_STILL_ACTIVE') {
        // Evidence produced, wrapper process still active -> clean wrapper process tree safely
        const termAction = this.terminator.terminateProcessTree(
          task.taskId,
          task.pid,
          sample.activeChildPids
        );
        actions.push(termAction);
        rxTracker.recordRx3ActionExecution('TERMINATION', termAction.affectedPids);

        if (this.config.autoRecover && options?.lockfilePath) {
          const recoveryAction = this.recoveryEngine.recoverToIdle(task.taskId, options?.lockfilePath);
          actions.push(recoveryAction);
        }

        finalState = 'COMPLETED';
      } else if (evidence.classification === 'SUCCESS') {
        finalState = 'COMPLETED';
      } else {
        // Process dead but missing evidence or non-zero exit
        finalState = 'FAILED';
      }
    } else if (diagnosis.isStuck && diagnosis.recommendation === 'TERMINATE_AND_RECOVER') {
      finalState = 'CONFIRMED_STUCK';

      // Increment recovery attempt counter
      const attempts = (this.recoveryAttempts.get(task.taskId) || 0) + 1;
      this.recoveryAttempts.set(task.taskId, attempts);

      if (attempts <= (this.config.maxRecoveryAttempts || 3)) {
        finalState = 'RECOVERING';

        // Safe process tree termination
        const termAction = this.terminator.terminateProcessTree(
          task.taskId,
          task.pid,
          sample.activeChildPids
        );
        actions.push(termAction);
        rxTracker.recordRx3ActionExecution('TERMINATION', termAction.affectedPids);

        // Clean recovery to idle state
        if (this.config.autoRecover) {
          const recoveryAction = this.recoveryEngine.recoverToIdle(task.taskId, options?.lockfilePath);
          actions.push(recoveryAction);
          rxTracker.recordRx4IdleRecovery('SUCCESS');
          finalState = 'RECOVERED_IDLE';
        } else {
          finalState = 'TERMINATED';
        }
      } else {
        finalState = 'FAILED';
      }
    } else if (diagnosis.isStalled) {
      // Stalled warning state
      finalState = 'STALLED';
    } else {
      // Process is alive and progressing
      if (nowMs - task.startTimeMs >= this.config.inactivityThresholdMs) {
        finalState = task.currentLivenessState === 'LONG_RUNNING' ? 'LONG_RUNNING' : 'LEGITIMATE_LONG_RUNNING';
      } else {
        if (task.currentLivenessState === 'STARTING') {
          finalState = 'RUNNING';
        } else if (task.currentLivenessState === 'RUNNING' || task.currentLivenessState === 'ACTIVE') {
          finalState = task.currentLivenessState;
        } else {
          finalState = 'ACTIVE_PROGRESSING';
        }
      }
    }

    const executionTimeMs = Number((performance.now() - startTimeMs).toFixed(2));

    // Record in ledger if task reached terminal or idle state
    let ledgerRecord;
    const isTerminal = ['COMPLETED', 'FAILED', 'BLOCKED', 'RECOVERED_IDLE', 'TERMINATED'].includes(finalState);
    if (isTerminal) {
      ledgerRecord = this.taskLedger.recordTaskCompletion({
        taskId: task.taskId,
        command: task.command,
        pid: task.pid,
        initialState: task.currentLivenessState,
        finalState,
        exitCode: evidence.exitCode,
        runtimeMs: Math.max(0, nowMs - task.startTimeMs),
        startTimeMs: task.startTimeMs,
        endTimeMs: nowMs,
        healthRating,
        evidence,
        wrapperCleanupSuccess: actions.some((a) => a.actionType === 'TERMINATION') ? actions.every((a) => a.success) : true,
        nextTaskReadiness: finalState === 'COMPLETED' || finalState === 'RECOVERED_IDLE',
        ledgerTimestamp: nowMs,
      });
    }

    // 5. Seal Audit Report
    const report = WatchdogAuditLogger.sealAuditReport({
      taskId: task.taskId,
      initialState: task.currentLivenessState,
      finalState,
      healthRating,
      latestSnapshot: snapshot,
      evidence,
      ledgerRecord,
      diagnosis,
      actions,
      rxLifecycleId: rxTracker.getLifecycleId(),
      executionTimeMs,
      version: '2.1.0',
    });

    rxTracker.sealLifecycle(report);
    return report;
  }

  /**
   * Deterministic END_TASK lifecycle finalizer.
   * Fully idempotent: Calling multiple times never corrupts state or affects unrelated tasks.
   */
  public async endTask(
    taskId: string,
    options?: {
      exitCode?: number;
      stdoutStderrClosed?: boolean;
      lockfilePath?: string;
      injectedSample?: Partial<ProcessActivitySample>;
      nowMs?: number;
    }
  ): Promise<WatchdogAuditReport> {
    this.assertActuationLockout();

    // Idempotency: Return existing finalized report if already closed
    const alreadyFinalized = this.finalizedTasks.get(taskId);
    if (alreadyFinalized) {
      return alreadyFinalized;
    }

    const nowMs = options?.nowMs ?? Date.now();
    const task = this.trackedTasks.get(taskId);
    if (!task) {
      throw new Error(`[BTWA_TASK_NOT_FOUND] Cannot finalize unmonitored task: ${taskId}`);
    }

    // Transition to FINALIZING
    const finalizingTask: WatchedTask = Object.freeze({
      ...task,
      currentLivenessState: 'FINALIZING',
    });
    this.trackedTasks.set(taskId, finalizingTask);

    // Run inspection and handling with simulated exit / completion
    const report = await this.inspectAndHandleTask(finalizingTask, {
      currentTimeMs: nowMs,
      injectedSample: options?.injectedSample ?? { isRunning: false },
      lockfilePath: options?.lockfilePath,
      simulatedExitCode: options?.exitCode ?? 0,
      stdoutStderrClosed: options?.stdoutStderrClosed ?? true,
    });

    // Cache finalized report for idempotency
    this.finalizedTasks.set(taskId, report);
    return report;
  }

  /**
   * Retrieves persistent task ledger instance.
   */
  public getTaskLedger(): PersistentTaskLedger {
    return this.taskLedger;
  }

  /**
   * Helper to inspect process liveness.
   */
  public isProcessAlive(pid: number): boolean {
    return this.inspector.isProcessAlive(pid);
  }

  /**
   * Returns current safety posture.
   */
  public getSafetyStatus(): WatchdogSafetyStatus {
    return Object.freeze({
      isActuationBlocked: IS_ACTUATION_BLOCKED === true,
      isOfflineOnly: true,
      externalAiDetected: false,
      protectedAssetsProtected: true,
    });
  }

  /**
   * Activates the watchdog agent.
   */
  public startWatching(): void {
    this.assertActuationLockout();
    this.isWatcherActive = true;
    this.lastHeartbeatTimestamp = Date.now();
  }

  /**
   * Registers a task for continuous monitoring.
   */
  public registerTask(task: WatchedTask): void {
    this.assertActuationLockout();
    this.trackedTasks.set(task.taskId, task);
  }

  /**
   * Emits a heartbeat to confirm watchdog operational liveness.
   */
  public emitHeartbeat(): number {
    this.assertActuationLockout();
    this.lastHeartbeatTimestamp = Date.now();
    return this.lastHeartbeatTimestamp;
  }

  /**
   * Returns all currently monitored tasks.
   */
  public getMonitoredTasks(): readonly WatchedTask[] {
    return Object.freeze(Array.from(this.trackedTasks.values()));
  }

  /**
   * Returns active status summary for BTWA.
   */
  public getActiveStatus(): {
    readonly agentId: string;
    readonly version: string;
    readonly status: 'ACTIVE' | 'IDLE';
    readonly monitoredTaskCount: number;
    readonly lastHeartbeatTimestamp: number;
    readonly heartbeatState: 'HEALTHY' | 'STALE' | 'INACTIVE';
    readonly inactivityThresholdMs: number;
    readonly isActuationBlocked: boolean;
  } {
    const isHealthy = this.isWatcherActive && (Date.now() - this.lastHeartbeatTimestamp) < 30000;
    return Object.freeze({
      agentId: BackgroundTaskWatchdogAgent.AGENT_ID,
      version: BackgroundTaskWatchdogAgent.VERSION,
      status: this.isWatcherActive ? 'ACTIVE' : 'IDLE',
      monitoredTaskCount: this.trackedTasks.size,
      lastHeartbeatTimestamp: this.lastHeartbeatTimestamp,
      heartbeatState: this.isWatcherActive ? (isHealthy ? 'HEALTHY' : 'STALE') : 'INACTIVE',
      inactivityThresholdMs: this.config.inactivityThresholdMs,
      isActuationBlocked: IS_ACTUATION_BLOCKED === true,
    });
  }

  private assertActuationLockout(): void {
    if (IS_ACTUATION_BLOCKED !== true) {
      throw new Error(
        '[BTWA_SAFETY_BREACH] Actuation lockout invariant violated: IS_ACTUATION_BLOCKED must be true.'
      );
    }
  }
}

