/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F54: Execution Observer
 *
 * Records telemetry, streams logs, and measures sandboxed execution metrics.
 */

import { SandboxObservationRecord } from './types';

export class ExecutionObserver {
  public observe(record: SandboxObservationRecord): SandboxObservationRecord {
    return Object.freeze({
      stdout: Object.freeze([...record.stdout]),
      stderr: Object.freeze([...record.stderr]),
      executionTimeMs: record.executionTimeMs,
      memoryAllocatedKb: record.memoryAllocatedKb,
      exitCode: record.exitCode,
    });
  }
}
