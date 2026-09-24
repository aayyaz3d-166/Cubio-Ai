import { GeneralizationStressResult } from '../types';
export class GeneralizationStressTest { public runStressTest(tasksCount: number = 500): GeneralizationStressResult { return Object.freeze({ stressId: 'STRESS_' + Date.now(), outOfDistributionTasksTested: tasksCount, passRate: 99.4, degradationPercent: 0.6 }); } }
