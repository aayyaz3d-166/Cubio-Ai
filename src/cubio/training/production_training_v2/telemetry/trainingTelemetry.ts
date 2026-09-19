/**
 * CubiO — Universal Spatial Operating Environment
 * Step 79: Training Telemetry Aggregator
 *
 * Captures real step-level execution telemetry.
 *
 * Classification: REAL_MEASURED
 */

import { StepTelemetryRecord } from '../types';

export class TrainingTelemetry {
  private records: StepTelemetryRecord[] = [];

  public logStep(record: StepTelemetryRecord): void {
    this.records.push(record);
  }

  public getRecords(): readonly StepTelemetryRecord[] {
    return Object.freeze(this.records);
  }

  public getPeakMemoryBytes(): number {
    if (this.records.length === 0) return 0;
    return Math.max(...this.records.map((r) => r.processResidentMemoryBytes));
  }
}
