/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-005 — TheMG (Evidence & Solution Planning Agent)
 * src/cubio/agents/themg/rxEvidence.ts
 *
 * Self-evidence tracker for AGENT-005 TheMG.
 * Tracks internal RX0 -> RX5 lifecycle progression and seals
 * deterministic cryptographic hashes for solution planning operations.
 */

import * as crypto from 'crypto';
import { TheMGPlanReport, TheMGPlanningScope } from './types';

export interface TheMGRxEvent {
  readonly stage: number;
  readonly stageName: string;
  readonly eventType: string;
  readonly description: string;
  readonly contentHash: string;
  readonly timestamp: number;
}

export interface TheMGRxLifecycleSummary {
  readonly lifecycleId: string;
  readonly taskId: string;
  readonly finalStage: number;
  readonly eventCount: number;
  readonly events: readonly TheMGRxEvent[];
  readonly masterProvenanceHash: string;
}

export class TheMGRxEvidenceTracker {
  private readonly lifecycleId: string;
  private readonly taskId: string;
  private readonly events: TheMGRxEvent[] = [];
  private currentStage: number = 0;

  constructor(taskId: string = 'ANONYMOUS_TASK') {
    this.taskId = taskId;
    this.lifecycleId = `RX-MG-${taskId}-${Date.now().toString(36)}`;
  }

  public getLifecycleId(): string {
    return this.lifecycleId;
  }

  public recordStage(
    stage: number,
    eventType: string,
    description: string,
    payloadData?: unknown
  ): TheMGRxEvent {
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

    const event: TheMGRxEvent = Object.freeze({
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

  public recordRx0Intake(scope: TheMGPlanningScope): TheMGRxEvent {
    return this.recordStage(0, 'RX0_INTAKE', `Planning intake accepted for: ${scope.objective}`);
  }

  public recordRx1EvidenceSynthesis(factCount: number, failureCount: number): TheMGRxEvent {
    return this.recordStage(1, 'RX1_EVIDENCE_SYNTHESIS', `Synthesized ${factCount} facts and ${failureCount} failures`);
  }

  public recordRx2GapAnalysis(questionCount: number): TheMGRxEvent {
    return this.recordStage(2, 'RX2_GAP_ANALYSIS', `Formulated ${questionCount} unresolved questions`);
  }

  public recordRx3SolutionGeneration(solutionCount: number): TheMGRxEvent {
    return this.recordStage(3, 'RX3_SOLUTION_GENERATION', `Generated ${solutionCount} candidate solutions`);
  }

  public recordRx4PlanConstruction(stepCount: number): TheMGRxEvent {
    return this.recordStage(4, 'RX4_PLAN_CONSTRUCTION', `Constructed execution plan with ${stepCount} steps`);
  }

  public sealLifecycle(report: TheMGPlanReport): TheMGRxLifecycleSummary {
    this.recordStage(
      5,
      'RX5_SEALED_PLAN',
      `Planning sealed with plan ID ${report.executionPlan.planId}, master hash ${report.masterPlanningHash.slice(0, 16)}`
    );

    const masterPayload = JSON.stringify({
      lifecycleId: this.lifecycleId,
      taskId: this.taskId,
      eventCount: this.events.length,
      masterPlanningHash: report.masterPlanningHash,
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
