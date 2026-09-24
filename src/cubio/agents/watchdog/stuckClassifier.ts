/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent) v2 Supervisor
 * src/cubio/agents/watchdog/stuckClassifier.ts
 *
 * Evaluates process activity across multiple indicators to diagnose
 * whether a task is ACTIVE, LONG_RUNNING, STALLED, or CONFIRMED_STUCK.
 */

import {
  WatchedTask,
  ProcessActivitySample,
  StuckDiagnosis,
  WatchdogConfig,
  TaskHealthRating,
} from './types';

export class StuckClassifier {
  /**
   * Evaluates task history, process metrics, and activity samples to diagnose
   * task liveness and health rating.
   */
  public diagnose(
    task: WatchedTask,
    latestSample: ProcessActivitySample,
    config: WatchdogConfig,
    nowMs: number = Date.now()
  ): StuckDiagnosis {
    // 1. If process is already dead
    if (!latestSample.isRunning) {
      return Object.freeze({
        taskId: task.taskId,
        pid: task.pid,
        isStuck: false,
        isStalled: false,
        confidence: 1.0,
        durationSinceProgressMs: 0,
        reason: 'Process is no longer running (exited or completed).',
        evidenceSummary: 'PID liveness check returned false.',
        recommendation: 'NO_ACTION_REQUIRED',
      });
    }

    const durationSinceProgressMs = Math.max(0, nowMs - task.lastMeaningfulProgressMs);

    const stallWarningThresholdMs =
      config.stallWarningThresholdMs !== undefined
        ? config.stallWarningThresholdMs
        : Math.min(300000, config.inactivityThresholdMs);

    // 2. Check if within normal active window (at or below stall warning threshold)
    if (durationSinceProgressMs <= stallWarningThresholdMs) {
      return Object.freeze({
        taskId: task.taskId,
        pid: task.pid,
        isStuck: false,
        isStalled: false,
        confidence: 0.95,
        durationSinceProgressMs,
        reason: `Task progress elapsed (${durationSinceProgressMs}ms) is within normal active window.`,
        evidenceSummary: 'Active progress observed or within grace period.',
        recommendation: 'MAINTAIN_OBSERVATION',
      });
    }

    // 3. Deep progress examination across all dimensions
    const samples = [...task.samples, latestSample];
    let hasRecentLogGrowth = false;
    let hasChangingOutput = false;
    let hasRecentHeartbeat = false;
    let hasStepAdvancement = false;
    let hasStageAdvancement = false;

    if (samples.length >= 2) {
      const prev = samples[samples.length - 2];
      if (latestSample.logByteSize - prev.logByteSize >= config.minLogGrowthBytes) {
        hasRecentLogGrowth = true;
      }
      if (latestSample.lastOutputSnippet && latestSample.lastOutputSnippet !== prev.lastOutputSnippet) {
        hasChangingOutput = true;
      }
      if (
        latestSample.progressStep !== undefined &&
        prev.progressStep !== undefined &&
        latestSample.progressStep > prev.progressStep
      ) {
        hasStepAdvancement = true;
      }
      if (
        latestSample.currentStage &&
        prev.currentStage &&
        latestSample.currentStage !== prev.currentStage
      ) {
        hasStageAdvancement = true;
      }
    }

    if (
      latestSample.lastHeartbeatMs &&
      nowMs - latestSample.lastHeartbeatMs < config.inactivityThresholdMs
    ) {
      hasRecentHeartbeat = true;
    }

    // Legitimate long-running task detected
    if (
      hasRecentLogGrowth ||
      hasChangingOutput ||
      hasRecentHeartbeat ||
      hasStepAdvancement ||
      hasStageAdvancement
    ) {
      const indicators: string[] = [];
      if (hasRecentLogGrowth) indicators.push('Log file is actively growing');
      if (hasChangingOutput) indicators.push('Process output stream is advancing');
      if (hasRecentHeartbeat) indicators.push('Heartbeat token is active');
      if (hasStepAdvancement) indicators.push('Pipeline step index advanced');
      if (hasStageAdvancement) indicators.push('Runtime stage changed');

      return Object.freeze({
        taskId: task.taskId,
        pid: task.pid,
        isStuck: false,
        isStalled: false,
        confidence: 0.9,
        durationSinceProgressMs,
        reason: `Legitimate long-running operation detected. ${indicators.join(', ')}.`,
        evidenceSummary: `Active long-running task: ${indicators.join('; ')}`,
        recommendation: 'MAINTAIN_OBSERVATION',
      });
    }

    // 4. Stalled vs Confirmed Stuck evaluation
    // If between stall warning (5m) and hard inactivity threshold (10m)
    if (durationSinceProgressMs < config.inactivityThresholdMs) {
      return Object.freeze({
        taskId: task.taskId,
        pid: task.pid,
        isStuck: false,
        isStalled: true,
        confidence: 0.85,
        durationSinceProgressMs,
        reason: `Task progress stalled for ${Math.round(durationSinceProgressMs / 1000)}s (stall warning threshold reached). Under 10-minute hard threshold.`,
        evidenceSummary: `Stall detected: no log or heartbeat updates for ${durationSinceProgressMs}ms. Observation maintained.`,
        recommendation: 'MONITOR_STALL',
      });
    }

    // 5. Inactivity threshold exceeded (>= 10 minutes) AND zero progress = CONFIRMED_STUCK
    return Object.freeze({
      taskId: task.taskId,
      pid: task.pid,
      isStuck: true,
      isStalled: true,
      confidence: 0.98,
      durationSinceProgressMs,
      reason: `Task showed 0 meaningful progress for ${Math.round(durationSinceProgressMs / 1000)}s (exceeded hard threshold ${Math.round(config.inactivityThresholdMs / 1000)}s). Zero log growth, no heartbeat, no step changes.`,
      evidenceSummary: `Confirmed deadlocked/stalled process tree on PID ${task.pid}. Inactive for ${durationSinceProgressMs}ms.`,
      recommendation: 'TERMINATE_AND_RECOVER',
    });
  }

  /**
   * Evaluates overall task health rating.
   */
  public evaluateHealthRating(diagnosis: StuckDiagnosis): TaskHealthRating {
    if (diagnosis.isStuck) return 'STUCK';
    if (diagnosis.isStalled) return 'WARNING';
    return 'HEALTHY';
  }
}
