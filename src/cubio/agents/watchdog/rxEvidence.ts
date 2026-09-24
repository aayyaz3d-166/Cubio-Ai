/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-006 — BTWA (Background Task Watchdog Agent)
 * src/cubio/agents/watchdog/rxEvidence.ts
 *
 * Self-evidence tracker for AGENT-006 BTWA.
 * Tracks internal RX0 -> RX5 lifecycle progression for watchdog activities.
 */

import * as crypto from 'crypto';
import { WatchdogAuditReport } from './types';

export interface WatchdogRxEvent {
  readonly stage: number;
  readonly stageName: string;
  readonly eventType: string;
  readonly description: string;
  readonly contentHash: string;
  readonly timestamp: number;
}

export interface WatchdogRxLifecycleSummary {
  readonly lifecycleId: string;
  readonly taskId: string;
  readonly finalStage: number;
  readonly eventCount: number;
  readonly events: readonly WatchdogRxEvent[];
  readonly masterProvenanceHash: string;
}

export class WatchdogRxEvidenceTracker {
  private readonly lifecycleId: string;
  private readonly taskId: string;
  private readonly events: WatchdogRxEvent[] = [];
  private currentStage: number = 0;

  constructor(taskId: string = 'ANONYMOUS_TASK') {
    this.taskId = taskId;
    this.lifecycleId = `RX-WD-${taskId}-${Date.now().toString(36)}`;
  }

  public getLifecycleId(): string {
    return this.lifecycleId;
  }

  public recordStage(
    stage: number,
    eventType: string,
    description: string,
    payloadData?: unknown
  ): WatchdogRxEvent {
    this.currentStage = stage;
    const stageNames = [
      'RX0_BIRTH',
      'RX1_SUPERPOSITION',
      'RX2_INTERACTION',
      'RX3_AWARENESS',
      'RX4_EVOLUTION',
      'RX5_EXIT',
    ];
    const stageName = stageNames[stage] || `RX${stage}`;

    const contentPayload = payloadData
      ? typeof payloadData === 'string'
        ? payloadData
        : JSON.stringify(payloadData)
      : `${stageName}:${eventType}:${description}`;

    const contentHash = crypto.createHash('sha256').update(contentPayload).digest('hex');

    const event: WatchdogRxEvent = Object.freeze({
      stage,
      stageName,
      eventType,
      description,
      contentHash,
      timestamp: Date.now(),
    });

    this.events.push(event);
    return event;
  }

  public recordRx0WatchRegistration(taskId: string, pid: number): WatchdogRxEvent {
    return this.recordStage(0, 'RX0_WATCH_REGISTER', `Watchdog registered task ${taskId} on PID ${pid}`);
  }

  public recordRx1ActivitySampling(sampleCount: number): WatchdogRxEvent {
    return this.recordStage(1, 'RX1_ACTIVITY_SAMPLE', `Collected ${sampleCount} process activity samples`);
  }

  public recordRx2StuckDiagnosis(isStuck: boolean, reason: string): WatchdogRxEvent {
    return this.recordStage(2, 'RX2_STUCK_DIAGNOSIS', `Diagnosed stuck=${isStuck}: ${reason}`);
  }

  public recordRx3ActionExecution(actionType: string, affectedPids: readonly number[]): WatchdogRxEvent {
    return this.recordStage(3, 'RX3_ACTION_EXECUTE', `Executed ${actionType} on PIDs [${affectedPids.join(',')}]`);
  }

  public recordRx4IdleRecovery(status: string): WatchdogRxEvent {
    return this.recordStage(4, 'RX4_IDLE_RECOVERY', `System recovered to idle: ${status}`);
  }

  public sealLifecycle(report: WatchdogAuditReport): WatchdogRxLifecycleSummary {
    this.recordStage(
      5,
      'RX5_SEALED_AUDIT',
      `Audit report sealed with status ${report.finalLivenessState}, master hash ${report.masterAuditHash.slice(0, 16)}`
    );

    const masterPayload = JSON.stringify({
      lifecycleId: this.lifecycleId,
      taskId: this.taskId,
      eventCount: this.events.length,
      masterAuditHash: report.masterAuditHash,
      events: this.events.map((e) => `${e.stage}:${e.eventType}:${e.contentHash}`),
    });

    const masterProvenanceHash = crypto
      .createHash('sha256')
      .update(masterPayload)
      .digest('hex');

    return Object.freeze({
      lifecycleId: this.lifecycleId,
      taskId: this.taskId,
      finalStage: 5,
      eventCount: this.events.length,
      events: Object.freeze([...this.events]),
      masterProvenanceHash,
    });
  }
}
