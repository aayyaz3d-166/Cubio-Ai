/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-004 — EIA (Evidence & Audit Agent)
 * src/cubio/agents/eia/rxEvidence.ts
 *
 * Self-evidence tracker for AGENT-004 EIA.
 * Tracks EIA's internal RX0 -> RX5 lifecycle progression and seals
 * deterministic cryptographic hashes for audit operations.
 */

import * as crypto from 'crypto';
import { EIAAuditReport, EIAAuditScope } from './types';

export interface EIARxEvent {
  readonly stage: number;
  readonly stageName: string;
  readonly eventType: string;
  readonly description: string;
  readonly contentHash: string;
  readonly timestamp: number;
}

export interface EIARxLifecycleSummary {
  readonly lifecycleId: string;
  readonly taskId: string;
  readonly finalStage: number;
  readonly eventCount: number;
  readonly events: readonly EIARxEvent[];
  readonly masterProvenanceHash: string;
}

export class EIARxEvidenceTracker {
  private readonly lifecycleId: string;
  private readonly taskId: string;
  private readonly events: EIARxEvent[] = [];
  private currentStage: number = 0;

  constructor(taskId: string = 'ANONYMOUS_TASK') {
    this.taskId = taskId;
    this.lifecycleId = `RX-EIA-${taskId}-${Date.now().toString(36)}`;
  }

  public getLifecycleId(): string {
    return this.lifecycleId;
  }

  public getCurrentStage(): number {
    return this.currentStage;
  }

  public recordStage(
    stage: number,
    eventType: string,
    description: string,
    payloadData?: unknown
  ): EIARxEvent {
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

    const event: EIARxEvent = Object.freeze({
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

  public recordRx0Intake(scope: EIAAuditScope): EIARxEvent {
    return this.recordStage(0, 'RX0_INTAKE', `Audit scope accepted: ${scope.objective}`, {
      taskId: scope.taskId,
      objective: scope.objective,
    });
  }

  public recordRx1ArtifactDiscovery(count: number): EIARxEvent {
    return this.recordStage(1, 'RX1_ARTIFACT_DISCOVERY', `Identified ${count} evidence artifacts`);
  }

  public recordRx2ChainValidation(stepCount: number): EIARxEvent {
    return this.recordStage(2, 'RX2_CHAIN_VALIDATION', `Validated ${stepCount} chain-of-custody steps`);
  }

  public recordRx3DiscrepancyAudit(discrepancyCount: number): EIARxEvent {
    return this.recordStage(3, 'RX3_DISCREPANCY_AUDIT', `Detected ${discrepancyCount} discrepancies`);
  }

  public recordRx4Synthesis(status: string): EIARxEvent {
    return this.recordStage(4, 'RX4_AUDIT_SYNTHESIS', `Audit synthesized with status: ${status}`);
  }

  public sealLifecycle(report: EIAAuditReport): EIARxLifecycleSummary {
    this.recordStage(
      5,
      'RX5_SEALED_AUDIT',
      `Audit sealed with status ${report.status}, master hash ${report.masterAuditHash.slice(0, 16)}`
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
