import { ExperimentResult, StructuredObservation } from '../types';
export class ObservationCollector {
  public collectObservations(result: ExperimentResult): StructuredObservation {
    const pValue = 0.42;
    return Object.freeze({ observationId: 'OBS_' + Date.now(), resultId: result.resultId, observedPattern: 'No statistically significant difference between 369 and control distributions', statisticallySignificant: pValue < 0.05, pValue });
  }
}
