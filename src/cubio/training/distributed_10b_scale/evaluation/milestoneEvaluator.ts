/**
 * CubiO — Step 85 Milestone Evaluator
 * Evaluates verified token count against milestones (1B -> 2B -> 3B -> 5B -> 7.5B -> 10B+).
 */

import { TenBillionMilestone } from '../types';

export class MilestoneEvaluator {
  public static readonly MILESTONE_THRESHOLDS: Readonly<Record<TenBillionMilestone, number>> = Object.freeze({
    MILESTONE_C85_1B_INHERITED: 1_000_000_000,
    MILESTONE_C85_2B: 2_000_000_000,
    MILESTONE_C85_3B: 3_000_000_000,
    MILESTONE_C85_5B: 5_000_000_000,
    MILESTONE_C85_7_5B: 7_500_000_000,
    MILESTONE_C85_10B_TARGET: 10_000_000_000,
    MILESTONE_C85_100B_THEORETICAL: 100_000_000_000,
    MILESTONE_C85_1T_THEORETICAL: 1_000_000_000_000,
  });

  public static evaluateMilestones(cumulativeTokens: number): Record<TenBillionMilestone, 'VERIFIED' | 'PENDING' | 'NOT_EXECUTED'> {
    const statuses: Record<string, 'VERIFIED' | 'PENDING' | 'NOT_EXECUTED'> = {};

    for (const [ms, target] of Object.entries(this.MILESTONE_THRESHOLDS)) {
      if (ms.includes('THEORETICAL')) {
        statuses[ms] = 'NOT_EXECUTED';
      } else if (cumulativeTokens >= target) {
        statuses[ms] = 'VERIFIED';
      } else {
        statuses[ms] = 'PENDING';
      }
    }

    return statuses as Record<TenBillionMilestone, 'VERIFIED' | 'PENDING' | 'NOT_EXECUTED'>;
  }
}
