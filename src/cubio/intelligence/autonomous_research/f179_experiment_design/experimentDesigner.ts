import { ExperimentSpec, ResearchPlan } from '../types';
export class ExperimentDesigner {
  public designExperiment(plan: ResearchPlan, sampleSize: number = 100): ExperimentSpec {
    return Object.freeze({ experimentId: 'EXP_' + Date.now(), planId: plan.planId, sampleSize, repetitions: 30, timeoutMs: 5000 });
  }
}
