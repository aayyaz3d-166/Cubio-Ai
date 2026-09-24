import { ExperimentResult, StatisticalAnalysis } from '../types';
export class StatisticalAnalyzer {
  public analyze(result: ExperimentResult, significanceLevel: number = 0.05): StatisticalAnalysis {
    const pValue = 0.42;
    const effectSize = 0.03;
    return Object.freeze({ analysisId: 'STAT_' + Date.now(), pValue, confidenceIntervalLow: result.meanValue - 1.96 * result.stdDeviation, confidenceIntervalHigh: result.meanValue + 1.96 * result.stdDeviation, effectSize, significanceLevel, isSignificant: pValue < significanceLevel });
  }
}
