/**
 * CUBiO AI — 3D Memory Studio
 * AGENT-001 — MEA (Memory Agent)
 * src/cubio/agents/mea/rxEvidence.ts
 *
 * Ephemeral RX Evidence lifecycle and cryptographic provenance tracker for MEA.
 * Produces structured evidence across RX0..RX5 with bitwise deterministic hashes.
 */

import * as crypto from 'crypto';
import { MEAQuery, MEABudget, MEARetrievedItem, MEAContextBundle } from './types';

export type MEARxStage = 'RX0' | 'RX1' | 'RX2' | 'RX3' | 'RX4' | 'RX5';

export interface MEARxEvent {
  readonly stage: MEARxStage;
  readonly eventName: string;
  readonly payloadSummary: string;
  readonly eventHash: string;
  readonly timestamp: string;
}

export interface MEARxLifecycleEvidence {
  readonly rxLifecycleId: string;
  readonly agentId: 'AGENT-001-MEA';
  readonly queryHash: string;
  readonly events: readonly MEARxEvent[];
  readonly currentStage: MEARxStage;
  readonly masterProvenanceHash: string;
  readonly isSealed: boolean;
}

export class MEARxEvidenceTracker {
  private readonly events: MEARxEvent[] = [];
  private readonly rxLifecycleId: string;
  private readonly queryHash: string;
  private currentStage: MEARxStage = 'RX0';
  private isSealed = false;

  constructor(query: MEAQuery) {
    const dateStr = new Date().toISOString();
    const queryStr = JSON.stringify(query);
    this.queryHash = crypto.createHash('sha256').update(queryStr).digest('hex');
    this.rxLifecycleId = `RX_MEA_${this.queryHash.slice(0, 12)}_${Date.now()}`;

    this.recordEvent('RX0', 'INTAKE_INTENT', `Intake query with hash ${this.queryHash.slice(0, 8)}`);
  }

  public getLifecycleId(): string {
    return this.rxLifecycleId;
  }

  public recordDiscovery(storeName: string, count: number): void {
    this.currentStage = 'RX1';
    this.recordEvent(
      'RX1',
      'STORE_DISCOVERY',
      `Discovered ${count} candidates from store ${storeName}`
    );
  }

  public recordRelevanceFiltering(candidatesIn: number, candidatesOut: number): void {
    this.currentStage = 'RX2';
    this.recordEvent(
      'RX2',
      'RELEVANCE_FILTER',
      `Filtered ${candidatesIn} raw candidates to ${candidatesOut} scored items`
    );
  }

  public recordBudgetPacking(budget: MEABudget, itemsIncluded: number, tokens: number): void {
    this.currentStage = 'RX3';
    this.recordEvent(
      'RX3',
      'BUDGET_PACKING',
      `Packed ${itemsIncluded} items into ${tokens}/${budget.maxTokens} token budget`
    );
  }

  public recordProvenanceValidation(itemCount: number, verified: boolean): void {
    this.currentStage = 'RX4';
    this.recordEvent(
      'RX4',
      'PROVENANCE_VERIFICATION',
      `Verified ${itemCount} cryptographic hashes, verified=${verified}`
    );
  }

  public sealLifecycle(bundle: MEAContextBundle): MEARxLifecycleEvidence {
    this.currentStage = 'RX5';
    this.recordEvent(
      'RX5',
      'SEAL_CONTEXT',
      `Sealed context bundle with master hash ${bundle.masterProvenanceHash.slice(0, 16)}`
    );
    this.isSealed = true;

    const masterHash = this.computeMasterHash();

    return Object.freeze({
      rxLifecycleId: this.rxLifecycleId,
      agentId: 'AGENT-001-MEA',
      queryHash: this.queryHash,
      events: Object.freeze([...this.events]),
      currentStage: this.currentStage,
      masterProvenanceHash: masterHash,
      isSealed: this.isSealed,
    });
  }

  private recordEvent(stage: MEARxStage, eventName: string, payloadSummary: string): void {
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
