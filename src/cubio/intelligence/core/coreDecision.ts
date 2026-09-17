/**
 * CUBiO AI — Phase 8: CUBiO AI Core Engine
 * coreDecision.ts
 *
 * Immutable, auditable decision trace encapsulating:
 * - Strategy selection and rationale
 * - Inferred intent and capabilities
 * - Data sources consulted (Context, Memory, DB, Neural, Deterministic)
 * - Tool invocations and results
 * - Neural telemetry and shadow comparison
 * - Safety validation results & Epistemic classification
 * - Memory write proposal & approval audit
 * - Cryptographic checksum for complete auditability
 */

import * as crypto from 'crypto';
import { deterministicHash } from '../../state/determinism';
import { EpistemicStatus } from '../../model/native_foundation/native_model_types';
import { ReasoningStrategy } from './coreEngineContract';
import { NeuralTelemetryRecord, ShadowComparisonReport } from '../neural/neuralRuntimeContract';

export interface ToolInvocationRecord {
  readonly toolId: string;
  readonly success: boolean;
  readonly executionTimeMs: number;
  readonly error?: string;
}

export interface CoreDecisionInit {
  readonly decisionId: string;
  readonly strategy: ReasoningStrategy;
  readonly intent: string;
  readonly sourcesConsulted: readonly string[];
  readonly toolsInvoked?: readonly ToolInvocationRecord[];
  readonly neuralTelemetry?: NeuralTelemetryRecord | null;
  readonly shadowTelemetry?: ShadowComparisonReport | null;
  readonly fallbackInvoked: boolean;
  readonly fallbackReason?: string | null;
  readonly epistemicStatus: EpistemicStatus;
  readonly safetyPassed: boolean;
  readonly memoryWritesProposed: number;
  readonly memoryWritesApproved: number;
  readonly timestamp?: number;
}

export interface CoreDecision {
  readonly decisionId: string;
  readonly strategy: ReasoningStrategy;
  readonly intent: string;
  readonly sourcesConsulted: readonly string[];
  readonly toolsInvoked: readonly ToolInvocationRecord[];
  readonly neuralTelemetry: NeuralTelemetryRecord | null;
  readonly shadowTelemetry: ShadowComparisonReport | null;
  readonly fallbackInvoked: boolean;
  readonly fallbackReason: string | null;
  readonly epistemicStatus: EpistemicStatus;
  readonly safetyPassed: boolean;
  readonly memoryWritesProposed: number;
  readonly memoryWritesApproved: number;
  readonly checksum: string;
  readonly timestamp: number;
}

export function createCoreDecision(init: CoreDecisionInit): CoreDecision {
  const timestamp = init.timestamp ?? Date.now();
  const toolsInvoked = init.toolsInvoked ?? [];
  const fallbackReason = init.fallbackReason ?? null;
  const neuralTelemetry = init.neuralTelemetry ?? null;
  const shadowTelemetry = init.shadowTelemetry ?? null;

  const checksumPayload = JSON.stringify({
    decisionId: init.decisionId,
    strategy: init.strategy,
    intent: init.intent,
    sourcesConsulted: init.sourcesConsulted,
    toolsInvoked,
    fallbackInvoked: init.fallbackInvoked,
    fallbackReason,
    epistemicStatus: init.epistemicStatus,
    safetyPassed: init.safetyPassed,
    memoryWritesProposed: init.memoryWritesProposed,
    memoryWritesApproved: init.memoryWritesApproved,
    timestamp,
  });

  const checksum = crypto.createHash('sha256').update(checksumPayload).digest('hex');

  return Object.freeze({
    decisionId: init.decisionId,
    strategy: init.strategy,
    intent: init.intent,
    sourcesConsulted: Object.freeze([...init.sourcesConsulted]),
    toolsInvoked: Object.freeze([...toolsInvoked]),
    neuralTelemetry,
    shadowTelemetry,
    fallbackInvoked: init.fallbackInvoked,
    fallbackReason,
    epistemicStatus: init.epistemicStatus,
    safetyPassed: init.safetyPassed,
    memoryWritesProposed: init.memoryWritesProposed,
    memoryWritesApproved: init.memoryWritesApproved,
    checksum,
    timestamp,
  });
}
