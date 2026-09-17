/**
 * 3D Memory Studio — Phase 6: User Workspace
 * Funnel P6.2: Mutation Audit & Causality Log
 *
 * Records deterministic audit records and verifies causal separation:
 * Reality Mutation -> Frame Change
 * Observer Mutation -> Frame Change WITHOUT Reality Mutation
 */

import { RealityMutationRecord, InteractiveActionType, CausalityVerificationRecord } from './types';
import { generateDeterministicMutationId } from './determinism';

export class MutationAuditLogger {
  private records: RealityMutationRecord[] = [];
  private stepCounter = 0;

  constructor() {
    this.records = [];
    this.stepCounter = 0;
  }

  public logMutation(
    action: InteractiveActionType,
    targetObjectId: string | null,
    oldPosition: readonly [number, number, number] | null,
    newPosition: readonly [number, number, number] | null,
    realityBefore: string,
    realityAfter: string,
    frameBefore: string,
    frameAfter: string,
    observerChecksum: string
  ): RealityMutationRecord {
    this.stepCounter++;
    const record: RealityMutationRecord = Object.freeze({
      mutationId: generateDeterministicMutationId(this.stepCounter, action),
      action,
      targetObjectId,
      oldPosition,
      newPosition,
      realityChecksumBefore: realityBefore,
      realityChecksumAfter: realityAfter,
      frameChecksumBefore: frameBefore,
      frameChecksumAfter: frameAfter,
      observerChecksum,
      timestamp: this.stepCounter * 1000, // Deterministic timestamp progression
      stepIndex: this.stepCounter,
    });

    this.records.push(record);
    return record;
  }

  public getRecords(): readonly RealityMutationRecord[] {
    return Object.freeze([...this.records]);
  }

  public getLatestRecord(): RealityMutationRecord | null {
    return this.records.length > 0 ? this.records[this.records.length - 1] : null;
  }

  public verifyCausality(
    mutationType: 'REALITY_MUTATION' | 'OBSERVER_MUTATION',
    realityBefore: string,
    realityAfter: string,
    observerBefore: string,
    observerAfter: string,
    frameBefore: string,
    frameAfter: string
  ): CausalityVerificationRecord {
    const realityChanged = realityBefore !== realityAfter;
    const observerChanged = observerBefore !== observerAfter;
    const frameChanged = frameBefore !== frameAfter;

    let isCausalityPreserved = false;
    if (mutationType === 'REALITY_MUTATION') {
      // Reality changed while observer stayed same -> frame must change
      isCausalityPreserved = realityChanged && !observerChanged && frameChanged;
    } else {
      // Observer changed while reality stayed same -> frame changes but reality invariant
      isCausalityPreserved = !realityChanged && observerChanged && frameChanged;
    }

    return Object.freeze({
      testId: `CAUSAL_TEST_${this.stepCounter}`,
      mutationType,
      realityChanged,
      observerChanged,
      frameChanged,
      reconstructionChanged: frameChanged,
      isCausalityPreserved,
    });
  }

  public clear(): void {
    this.records = [];
    this.stepCounter = 0;
  }
}
