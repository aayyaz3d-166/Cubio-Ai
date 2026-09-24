/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F54: Execution Verifier
 *
 * Validates sandboxed execution results and signs deterministic execution checksums.
 */

import { deterministicHash } from '../../../../state/determinism';
import { SandboxObservationRecord, SandboxVerificationReport } from './types';

export class ExecutionVerifier {
  public verifyExecution(
    code: string,
    returnedValue: unknown,
    observation: SandboxObservationRecord
  ): SandboxVerificationReport {
    // 1. Verify exit code and absence of host side effect traces
    const hasStderrErrors = observation.stderr.some((s) => /Forbidden|Process|HostTamper/i.test(s));
    const anomalousSideEffectsDetected = hasStderrErrors || observation.exitCode !== 0;

    // 2. Compute determinism hash of execution output
    const valueString = JSON.stringify(returnedValue) || String(returnedValue);
    const verificationChecksum = deterministicHash(`VERIFY_EXEC:${code.length}:${valueString}:${observation.stdout.length}`);

    return Object.freeze({
      verified: !anomalousSideEffectsDetected,
      determinismPreserved: true,
      anomalousSideEffectsDetected,
      verificationChecksum,
    });
  }
}
