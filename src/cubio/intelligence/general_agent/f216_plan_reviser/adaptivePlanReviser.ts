import { AdaptivePlanRevision } from '../types';
export class AdaptivePlanReviser {
  public revisePlan(originalPlanId: string): AdaptivePlanRevision {
    return Object.freeze({ revisionId: 'REV_' + Date.now(), originalPlanId, revisedStepsCount: 2, improvementDelta: 0.15 });
  }
}
