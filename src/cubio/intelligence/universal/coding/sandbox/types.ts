/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F54: Secure Code Execution Sandbox Types
 *
 * Enforces the 7-stage sandboxed execution lifecycle:
 * Code -> Security Policy -> Sandbox -> Execute -> Observe -> Verify -> Return Result
 *
 * Invariant: No unrestricted host execution.
 */

export interface SandboxSecurityPolicy {
  readonly maxExecutionTimeMs: number;
  readonly maxMemoryMb: number;
  readonly allowedGlobals: readonly string[];
  readonly forbiddenAPIs: readonly string[];
  readonly allowNetwork: boolean;
  readonly allowDiskWrite: boolean;
  readonly allowSpawn: boolean;
}

export interface SecurityPolicyCheckResult {
  readonly passed: boolean;
  readonly detectedViolations: readonly string[];
  readonly riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL_BLOCKED';
  readonly checkChecksum: string;
}

export interface SandboxExecutionRequest {
  readonly code: string;
  readonly language?: 'typescript' | 'javascript' | 'json';
  readonly inputPayload?: Record<string, unknown>;
  readonly customPolicy?: Partial<SandboxSecurityPolicy>;
}

export interface SandboxObservationRecord {
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly executionTimeMs: number;
  readonly memoryAllocatedKb: number;
  readonly exitCode: number;
}

export interface SandboxVerificationReport {
  readonly verified: boolean;
  readonly determinismPreserved: boolean; // sigma^2 = 0
  readonly anomalousSideEffectsDetected: boolean;
  readonly verificationChecksum: string;
}

export interface SandboxExecutionResult {
  readonly executionId: string;
  readonly success: boolean;
  readonly returnedValue: unknown;
  readonly policyCheck: SecurityPolicyCheckResult;
  readonly observation: SandboxObservationRecord;
  readonly verification: SandboxVerificationReport;
  readonly executionChecksum: string;
  readonly timestamp: number;
}

export interface ISandboxExecutionEngine {
  executeSandboxed(request: SandboxExecutionRequest): Promise<Readonly<SandboxExecutionResult>>;
}
