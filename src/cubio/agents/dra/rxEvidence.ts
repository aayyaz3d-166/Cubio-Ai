/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-002 — DRA (Dependency & Reuse Agent)
 * src/cubio/agents/dra/rxEvidence.ts
 *
 * Ephemeral RX Evidence lifecycle and cryptographic provenance tracker for DRA.
 * Records RX0..RX5 events with bitwise deterministic hashes.
 */

import * as crypto from 'crypto';
import { DRATaskQuery, DRAReuseReport } from './types';

export type DRARxStage = 'RX0' | 'RX1' | 'RX2' | 'RX3' | 'RX4' | 'RX5';

export interface DRARxEvent {
  readonly stage: DRARxStage;
  readonly eventName: string;
  readonly payloadSummary: string;
  readonly eventHash: string;
  readonly timestamp: string;
}

export interface DRARxLifecycleEvidence {
  readonly rxLifecycleId: string;
  readonly agentId: 'AGENT-002-DRA';
  readonly queryHash: string;
  readonly events: readonly DRARxEvent[];
  readonly currentStage: DRARxStage;
  readonly masterProvenanceHash: string;
  readonly isSealed: boolean;
}

export class DRARxEvidenceTracker {
  private readonly events: DRARxEvent[] = [];
  private readonly rxLifecycleId: string;
  private readonly queryHash: string;
  private currentStage: DRARxStage = 'RX0';
  private isSealed = false;

  constructor(query: DRATaskQuery) {
    const queryStr = JSON.stringify({
      prompt: query.prompt,
      subsystems: query.targetSubsystems,
      proposedFiles: query.proposedFiles,
      taskId: query.taskId,
    });
    this.queryHash = crypto.createHash('sha256').update(queryStr).digest('hex');
    this.rxLifecycleId = `RX_DRA_${this.queryHash.slice(0, 12)}_${Date.now()}`;

    this.recordEvent('RX0', 'INTAKE_INTENT', `Intake DRA task query hash ${this.queryHash.slice(0, 8)}`);
  }

  public getLifecycleId(): string {
    return this.rxLifecycleId;
  }

  public recordDiscovery(nodeCount: number, edgeCount: number): void {
    this.currentStage = 'RX1';
    this.recordEvent(
      'RX1',
      'TOPOLOGY_DISCOVERY',
      `Mapped ${nodeCount} dependency nodes and ${edgeCount} edges from forensic indexes`
    );
  }

  public recordReuseAnalysis(strategy: string, candidateCount: number): void {
    this.currentStage = 'RX2';
    this.recordEvent(
      'RX2',
      'REUSE_STRATEGY',
      `Resolved strategy: ${strategy} across ${candidateCount} candidate capabilities`
    );
  }

  public recordConflictAudit(conflictCount: number, frozenImpactCount: number): void {
    this.currentStage = 'RX3';
    this.recordEvent(
      'RX3',
      'CONFLICT_AUDIT',
      `Identified ${conflictCount} potential conflicts, ${frozenImpactCount} frozen file impacts`
    );
  }

  public recordProvenanceValidation(referenceCount: number, passed: boolean): void {
    this.currentStage = 'RX4';
    this.recordEvent(
      'RX4',
      'PROVENANCE_VERIFICATION',
      `Verified ${referenceCount} exact source references, valid=${passed}`
    );
  }

  public sealLifecycle(report: DRAReuseReport): DRARxLifecycleEvidence {
    this.currentStage = 'RX5';
    this.recordEvent(
      'RX5',
      'SEAL_REUSE_REPORT',
      `Sealed reuse report with master hash ${report.masterProvenanceHash.slice(0, 16)}`
    );
    this.isSealed = true;

    const masterHash = this.computeMasterHash();

    return Object.freeze({
      rxLifecycleId: this.rxLifecycleId,
      agentId: 'AGENT-002-DRA',
      queryHash: this.queryHash,
      events: Object.freeze([...this.events]),
      currentStage: this.currentStage,
      masterProvenanceHash: masterHash,
      isSealed: this.isSealed,
    });
  }

  private recordEvent(stage: DRARxStage, eventName: string, payloadSummary: string): void {
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
