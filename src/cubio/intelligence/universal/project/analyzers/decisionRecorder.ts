/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F62: Decision Recorder (Dimension 6: ADRs)
 */

import { deterministicHash } from '../../../../state/determinism';
import { ProjectDecisionRecord } from '../types';

export class DecisionRecorder {
  private decisions: Map<string, ProjectDecisionRecord> = new Map();

  constructor() {
    this.seedDefaultDecisions();
  }

  private seedDefaultDecisions() {
    const defaultDecisions: ProjectDecisionRecord[] = [
      {
        decisionId: 'ADR_01_ZERO_VARIANCE',
        title: 'Zero-Variance Determinism Invariant (sigma^2 = 0)',
        status: 'ACCEPTED',
        context: 'AI pipelines require strict deterministic reproducibility for reliable state synchronization.',
        decision: 'Every transformation, provider adapter, and state transition must output identical signed checksums across repeated runs.',
        consequences: ['Zero race conditions', 'Mathematical reproducibility guaranteed'],
        timestamp: Date.now() - 100000,
      },
      {
        decisionId: 'ADR_02_DECOUPLED_ROUTER',
        title: 'Decoupled Universal Capability Router',
        status: 'ACCEPTED',
        context: 'Frontend UI must never couple directly to internal spatial/geometry/369 engines.',
        decision: 'All intelligence routes must pass through the Universal Capability Router.',
        consequences: ['Frontend agnostic to providers', 'Modular hot-swappability'],
        timestamp: Date.now() - 50000,
      },
    ];

    for (const d of defaultDecisions) {
      this.decisions.set(d.decisionId, d);
    }
  }

  public getDecisions(): readonly ProjectDecisionRecord[] {
    return Object.freeze(Array.from(this.decisions.values()));
  }

  public recordDecision(
    decision: Omit<ProjectDecisionRecord, 'decisionId' | 'timestamp'>
  ): ProjectDecisionRecord {
    const decisionId = `ADR_${deterministicHash(`${decision.title}:${Date.now()}`).slice(2, 10)}`;
    const created: ProjectDecisionRecord = Object.freeze({
      ...decision,
      decisionId,
      timestamp: Date.now(),
    });
    this.decisions.set(decisionId, created);
    return created;
  }
}
