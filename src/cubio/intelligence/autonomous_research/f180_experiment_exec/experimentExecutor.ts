import { ExperimentResult, ExperimentSpec } from '../types';
export class ExperimentExecutor {
  public executeExperiment(spec: ExperimentSpec): ExperimentResult {
    const measurements: number[] = [];
    for (let i = 0; i < spec.repetitions; i++) { measurements.push(100 + Math.sin(i) * 2); }
    const mean = measurements.reduce((a,b) => a+b, 0) / measurements.length;
    const variance = measurements.reduce((a,b) => a + (b-mean)**2, 0) / measurements.length;
    return Object.freeze({ resultId: 'RES_' + Date.now(), experimentId: spec.experimentId, measurements: Object.freeze(measurements), meanValue: parseFloat(mean.toFixed(4)), stdDeviation: parseFloat(Math.sqrt(variance).toFixed(4)), executionTimeMs: 12.5 });
  }
}
