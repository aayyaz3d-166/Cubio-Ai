/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F6: CubiO Intelligence Superposition Engine (Types & Contracts)
 *
 * Master specification for multi-state co-existence, probability distributions,
 * wave-function phase coherence, and deterministic collapse operators.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';

export interface SuperpositionBranch {
  readonly branchId: string;
  readonly state: Readonly<CubiOState>;
  readonly probability: number; // Normalized strictly: 0 <= P <= 1
  readonly phaseAngle: number; // 0 <= phi < 2*PI
  readonly harmonicWeight: number;
  readonly metadata?: Readonly<Record<string, any>>;
}

export interface SuperpositionStateEnvelope {
  readonly superpositionId: string;
  readonly dimension: CubiODimension;
  readonly branches: readonly SuperpositionBranch[];
  readonly totalProbability: number; // Strictly 1.0 (within epsilon 1e-12)
  readonly entropy: number; // Shannon / Von Neumann superposition entropy
  readonly coherenceScore: number; // 0 <= C <= 1 based on phase vector alignment
  readonly interferencePattern: readonly number[]; // Synthesized coordinate vector sum(P_i * x_i)
  readonly isCollapsed: boolean;
  readonly collapsedStateId?: string;
  readonly superpositionChecksum: string;
  readonly timestamp: number;
}

export type CollapseStrategy =
  | 'MAX_PROBABILITY'
  | 'WEIGHTED_INTERFERENCE'
  | 'THRESHOLD_FILTER'
  | 'HARMONIC_RESONANCE';

export interface CollapseResult {
  readonly collapseId: string;
  readonly superpositionId: string;
  readonly strategy: CollapseStrategy;
  readonly resolvedState: Readonly<CubiOState>;
  readonly winningBranchId: string;
  readonly confidence: number;
  readonly entropyLoss: number;
  readonly collapseChecksum: string;
  readonly durationMs: number;
  readonly timestamp: number;
}

export interface StateCombinationConfig {
  readonly strategy?: 'WEIGHTED_AVERAGE' | 'HARMONIC_SUM' | 'CONSTRUCTIVE_INTERFERENCE';
  readonly baseDimension?: CubiODimension;
  readonly label?: string;
}

export interface SuperpositionResolutionReport {
  readonly reportId: string;
  readonly totalEnvelopesProcessed: number;
  readonly collapsedCount: number;
  readonly averageCoherence: number;
  readonly averageEntropy: number;
  readonly resolutionChecksum: string;
  readonly timestamp: number;
}
