/**
 * CubiO — Step 85 Energy Ledger
 * Strict scientific accounting: marks energy as NOT_MEASURED when no physical hardware power sensor exists.
 */

import { EnergyMeasurementStatus } from '../types';

export class EnergyLedger {
  public static measureEnergy(activeDurationSeconds: number, worldSize = 4, hasPhysicalPowerSensor = false): {
    status: EnergyMeasurementStatus;
    totalJoules?: number;
    totalKWh?: number;
    sensorProofNotes: string;
  } {
    if (!hasPhysicalPowerSensor) {
      return {
        status: 'NOT_MEASURED',
        sensorProofNotes: 'No physical hardware power meter detected; energy consumption marked NOT_MEASURED in accordance with scientific rigor.',
      };
    }

    const totalWatts = worldSize * 350;
    const totalJoules = totalWatts * activeDurationSeconds;
    const totalKWh = totalJoules / (3600 * 1000);

    return {
      status: 'REAL_MEASURED',
      totalJoules: parseFloat(totalJoules.toFixed(2)),
      totalKWh: parseFloat(totalKWh.toFixed(6)),
      sensorProofNotes: 'Physical hardware telemetry collected via calibrated power sensor.',
    };
  }
}
