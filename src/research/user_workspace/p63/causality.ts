/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.3: Causality Audit & Event Logger
 *
 * Verifies strict causal separation:
 * Reality Mutation -> Frame Changes across all observers
 * Observer Mutation -> Target Frame Changes without Reality Mutation
 */

import { P63CausalityAuditRecord } from './types';

export class CausalityAuditManager {
  private auditLog: P63CausalityAuditRecord[] = [];
  private stepCounter = 0;

  constructor() {
    this.auditLog = [];
    this.stepCounter = 0;
  }

  public recordEvent(
    eventType: 'REALITY_MUTATION' | 'OBSERVER_MUTATION' | 'COMBINATION_CHANGE',
    description: string,
    rBefore: string,
    rAfter: string,
    obsBefore: readonly [string, string, string],
    obsAfter: readonly [string, string, string],
    framesBefore: readonly [string, string, string],
    framesAfter: readonly [string, string, string],
    reconstructionAccuracy: number
  ): P63CausalityAuditRecord {
    this.stepCounter++;

    let isCausallySeparated = false;
    const realityChanged = rBefore !== rAfter;
    const observersChanged = obsBefore.some((c, i) => c !== obsAfter[i]);
    const framesChanged = framesBefore.some((c, i) => c !== framesAfter[i]);

    if (eventType === 'REALITY_MUTATION') {
      isCausallySeparated = realityChanged && !observersChanged && framesChanged;
    } else if (eventType === 'OBSERVER_MUTATION') {
      isCausallySeparated = !realityChanged && observersChanged && framesChanged;
    } else {
      isCausallySeparated = !realityChanged && !observersChanged;
    }

    const record: P63CausalityAuditRecord = Object.freeze({
      stepIndex: this.stepCounter,
      eventType,
      description,
      realityChecksumBefore: rBefore,
      realityChecksumAfter: rAfter,
      observerChecksumsBefore: obsBefore,
      observerChecksumsAfter: obsAfter,
      frameChecksumsBefore: framesBefore,
      frameChecksumsAfter: framesAfter,
      reconstructionAccuracy,
      isCausallySeparated,
    });

    this.auditLog.push(record);
    return record;
  }

  public getRecords(): readonly P63CausalityAuditRecord[] {
    return Object.freeze([...this.auditLog]);
  }

  public getLatestRecord(): P63CausalityAuditRecord | null {
    return this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1] : null;
  }

  public clear(): void {
    this.auditLog = [];
    this.stepCounter = 0;
  }
}
