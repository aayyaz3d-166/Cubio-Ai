/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F54: Master Secure Code Execution Engine
 *
 * Implements the full 7-stage sandboxed execution lifecycle:
 * Code -> Security Policy -> Sandbox -> Execute -> Observe -> Verify -> Return Result
 *
 * Zero unrestricted host execution.
 */

import { deterministicHash } from '../../../../state/determinism';
import {
  ISandboxExecutionEngine,
  SandboxExecutionRequest,
  SandboxExecutionResult,
  SecurityPolicyCheckResult,
  SandboxObservationRecord,
  SandboxVerificationReport,
} from './types';
import { SecurityPolicyEnforcer } from './securityPolicy';
import { VirtualSandbox } from './virtualSandbox';
import { ExecutionObserver } from './observer';
import { ExecutionVerifier } from './verifier';

export class CubiOSecureCodeExecutionEngine implements ISandboxExecutionEngine {
  private policyEnforcer = new SecurityPolicyEnforcer();
  private sandbox = new VirtualSandbox();
  private observer = new ExecutionObserver();
  private verifier = new ExecutionVerifier();

  /**
   * Executes code through the 7-stage sandboxed pipeline.
   */
  public async executeSandboxed(
    request: SandboxExecutionRequest
  ): Promise<Readonly<SandboxExecutionResult>> {
    const { code, inputPayload, customPolicy } = request;

    // Stage 1 & 2: Code -> Security Policy
    const policyCheck: SecurityPolicyCheckResult = this.policyEnforcer.evaluateCode(code, customPolicy);

    if (!policyCheck.passed) {
      const observation: SandboxObservationRecord = Object.freeze({
        stdout: Object.freeze([]),
        stderr: Object.freeze([
          `[CRITICAL_BLOCKED] Execution halted by Security Policy: ${policyCheck.detectedViolations.join('; ')}`,
        ]),
        executionTimeMs: 0,
        memoryAllocatedKb: 0,
        exitCode: 126, // Command invoked cannot execute
      });

      const verification: SandboxVerificationReport = Object.freeze({
        verified: false,
        determinismPreserved: true,
        anomalousSideEffectsDetected: true,
        verificationChecksum: deterministicHash(`BLOCKED:${policyCheck.checkChecksum}`),
      });

      const executionId = `SEC_EXEC_${deterministicHash(`BLOCKED:${code.length}:${Date.now()}`).slice(2, 10)}`;

      return Object.freeze({
        executionId,
        success: false,
        returnedValue: undefined,
        policyCheck,
        observation,
        verification,
        executionChecksum: deterministicHash(`${executionId}:FAILED`),
        timestamp: Date.now(),
      });
    }

    // Stage 3 & 4: Sandbox -> Execute
    const outcome = await this.sandbox.executeIsolated(code, inputPayload, customPolicy);

    // Stage 5: Observe
    const observation = this.observer.observe(outcome.observation);

    // Stage 6: Verify
    const verification = this.verifier.verifyExecution(code, outcome.returnedValue, observation);

    // Stage 7: Return Result
    const executionId = `SEC_EXEC_${deterministicHash(`EXEC:${code.length}:${observation.executionTimeMs}`).slice(2, 10)}`;
    const executionChecksum = deterministicHash(
      `${executionId}:${outcome.success}:${verification.verificationChecksum}`
    );

    return Object.freeze({
      executionId,
      success: outcome.success && verification.verified,
      returnedValue: outcome.returnedValue,
      policyCheck,
      observation,
      verification,
      executionChecksum,
      timestamp: Date.now(),
    });
  }
}
