/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-003 — TGA (Test & Gate Agent)
 * src/cubio/agents/tga/rxEvidence.ts
 *
 * Ephemeral RX Evidence lifecycle and cryptographic provenance tracker for TGA.
 * Tracks gate discovery, prerequisite validation, and execution across RX0..RX5.
 */

import * as crypto from 'crypto';
import { TGATaskScope, TGAGateReport } from './types';

export type TGARxStage = 'RX0' | 'RX1' | 'RX2' | 'RX3' | 'RX4' | 'RX5';

export interface TGARxEvent {
  readonly stage: TGARxStage;
  readonly eventName: string;
  readonly payloadSummary: string;
  readonly eventHash: string;
  readonly timestamp: string;
}

export interface TGARxLifecycleEvidence {
  readonly rxLifecycleId: string;
  readonly agentId: 'AGENT-003-TGA';
  readonly scopeHash: string;
  readonly events: readonly TGARxEvent[];
  readonly currentStage: TGARxStage;
  readonly masterProvenanceHash: string;
  readonly isSealed: boolean;
}

export class TGARxEvidenceTracker {
  private readonly events: TGARxEvent[] = [];
  private readonly rxLifecycleId: string;
  private readonly scopeHash: string;
  private currentStage: TGARxStage = 'RX0';
  private isSealed = false;

  constructor(scope: TGATaskScope) {
    const scopeStr = JSON.stringify({
      objective: scope.objective,
      subsystems: scope.targetSubsystems,
      touchedFiles: scope.touchedFiles,
      taskId: scope.taskId,
    });
    this.scopeHash = crypto.createHash('sha256').update(scopeStr).digest('hex');
    this.rxLifecycleId = `RX_TGA_${this.scopeHash.slice(0, 12)}_${Date.now()}`;

    this.recordEvent(
      'RX0',
      'INTAKE_SCOPE',
      `Intake TGA task scope with hash ${this.scopeHash.slice(0, 8)}`
    );
  }

  public getLifecycleId(): string {
    return this.rxLifecycleId;
  }

  public recordGateDiscovery(count: number): void {
    this.currentStage = 'RX1';
    this.recordEvent('RX1', 'GATE_DISCOVERY', `Discovered ${count} required acceptance gates`);
  }

  public recordPrerequisiteValidation(ready: boolean, reasons: readonly string[]): void {
    this.currentStage = 'RX2';
    this.recordEvent(
      'RX2',
      'PREREQUISITE_CHECK',
      `Prerequisite validation status: ready=${ready}, issues=${reasons.length}`
    );
  }

  public recordGateExecution(passed: number, total: number): void {
    this.currentStage = 'RX3';
    this.recordEvent(
      'RX3',
      'GATE_EXECUTION',
      `Executed ${total} gates: ${passed} PASSED, ${total - passed} FAILED/BLOCKED`
    );
  }

  public recordRegressionAudit(status: string): void {
    this.currentStage = 'RX4';
    this.recordEvent('RX4', 'REGRESSION_AUDIT', `Baseline status: ${status}`);
  }

  public sealLifecycle(report: TGAGateReport): TGARxLifecycleEvidence {
    this.currentStage = 'RX5';
    this.recordEvent(
      'RX5',
      'SEAL_GATE_REPORT',
      `Sealed gate report with final verdict ${report.verdict.finalStatus}, master hash ${report.masterProvenanceHash.slice(0, 16)}`
    );
    this.isSealed = true;

    const masterHash = this.computeMasterHash();

    return Object.freeze({
      rxLifecycleId: this.rxLifecycleId,
      agentId: 'AGENT-003-TGA',
      scopeHash: this.scopeHash,
      events: Object.freeze([...this.events]),
      currentStage: this.currentStage,
      masterProvenanceHash: masterHash,
      isSealed: this.isSealed,
    });
  }

  private recordEvent(stage: TGARxStage, eventName: string, payloadSummary: string): void {
    const timestamp = new Date().toISOString();
    const eventHash = crypto
      .createHash('sha256')
      .update(`${this.rxLifecycleId}:${stage}:${eventName}:${payloadSummary}`)
      .digest('hex');

    this.events.push(
      Object.freeze({
        stage,
        eventName,
        payloadSummary,
        eventHash,
        timestamp,
      })
    );
  }

  private computeMasterHash(): string {
    const joined = this.events.map((e) => e.eventHash).join(':');
    return crypto.createHash('sha256').update(joined).digest('hex');
  }
}
