/**
 * CUBiO AI — Phase 3 / Task 03: Node Bootstrap & Initialization Types
 * ===================================================================
 *
 * Formal contracts, sequential stages, execution outcomes, and report structures
 * for the canonical CUBiO Node bootstrap pipeline.
 */

import { NodeLifecycleState } from '../protocol/v1/nodeTypes';

/**
 * Sequential canonical stages of the node bootstrap sequence.
 */
export type NodeBootstrapStage =
  | 'CONFIGURATION_VALIDATION'
  | 'IDENTITY_INITIALIZATION'
  | 'LOGGING_INITIALIZATION'
  | 'STATE_INITIALIZATION'
  | 'PROTOCOL_INITIALIZATION'
  | 'TRANSPORT_INITIALIZATION'
  | 'SERVICES_INITIALIZATION'
  | 'READY_CHECK'
  | 'ONLINE_ACTIVATION';

/**
 * Execution status of an individual bootstrap stage.
 */
export type BootstrapStageStatus =
  | 'PENDING'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ROLLED_BACK';

/**
 * Diagnostic result of an individual bootstrap stage execution.
 */
export interface BootstrapStageResult {
  readonly stage: NodeBootstrapStage;
  readonly status: BootstrapStageStatus;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly durationMs: number;
  readonly error?: string;
  readonly details?: Record<string, any>;
}

/**
 * Comprehensive post-bootstrap audit report.
 */
export interface NodeBootstrapReport {
  readonly nodeId: string;
  readonly coordinateUri: string;
  readonly success: boolean;
  readonly targetState: NodeLifecycleState;
  readonly finalState: NodeLifecycleState;
  readonly totalDurationMs: number;
  readonly stages: readonly BootstrapStageResult[];
  readonly rollbackExecuted: boolean;
  readonly rollbackErrors: readonly string[];
  readonly error?: string;
  readonly timestamp: number;
}

/**
 * Options to customize the bootstrap execution.
 */
export interface NodeBootstrapOptions {
  /**
   * If true (default), automatically transitions the node from READY to ONLINE.
   * If false, stops the bootstrap sequence at READY state awaiting an explicit online activation.
   */
  readonly autoActivateOnline?: boolean;

  /**
   * If true (default), subsequent bootstrap calls on an already READY/ONLINE node
   * return immediately with the existing report. If false, throws an error.
   */
  readonly idempotent?: boolean;

  /**
   * Optional custom logging handler for bootstrap stage progress.
   */
  readonly onStageProgress?: (stage: NodeBootstrapStage, status: BootstrapStageStatus, result?: BootstrapStageResult) => void;
}
