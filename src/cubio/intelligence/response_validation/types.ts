/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F28: CubiO Intelligence Response Validation Engine (Types & Contracts)
 *
 * Master specification for multi-pillar validation, accuracy checks,
 * state consistency, contextual alignment, safety guardrails, and self-correcting fallbacks.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';

export type ValidationPillar =
  | 'ACCURACY_MATHEMATICAL'
  | 'STATE_CONSISTENCY'
  | 'CONTEXT_ALIGNMENT'
  | 'SAFETY_GUARDRAILS';

export type ValidationStatus =
  | 'VALID'
  | 'DEGRADED'
  | 'INVALID'
  | 'UNSAFE';

export interface PillarCheckResult {
  readonly pillar: ValidationPillar;
  readonly passed: boolean;
  readonly score: number; // 0 .. 100
  readonly details: string;
  readonly detectedIssues: readonly string[];
}

export interface ValidationRequest {
  readonly prompt: string;
  readonly response: string;
  readonly activeDimension?: CubiODimension;
  readonly baseState?: CubiOState;
  readonly sovereignCubId?: string;
  readonly maxRetryAttempts?: number;
}

export interface ResponseValidationReport {
  readonly reportId: string;
  readonly overallStatus: ValidationStatus;
  readonly overallConfidence: number; // 0.0 .. 1.0
  readonly pillarResults: readonly PillarCheckResult[];
  readonly autoCorrectionAttempted: boolean;
  readonly correctionAttempts: number;
  readonly fallbackApplied: boolean;
  readonly sanitizedResponse: string;
  readonly validationChecksum: string;
  readonly timestamp: number;
}
