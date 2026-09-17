/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F9: CubiO Intelligence Learning Engine (Types & Contracts)
 *
 * Master specification for feedback ingestion, measurable parameter updates,
 * gradient-based weight tuning, and traceable checkpoint ledgers with rollback.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';

export type FeedbackType =
  | 'REWARD'
  | 'PENALTY'
  | 'STATE_CORRECTION'
  | 'HARMONIC_ALIGNMENT'
  | 'EXPLICIT_EVALUATION';

export interface FeedbackEnvelope {
  readonly feedbackId: string;
  readonly type: FeedbackType;
  readonly targetEngineId?: string;
  readonly contextEnvelopeId?: string;
  readonly score: number; // -1.0 to +1.0 or 0.0 to 1.0
  readonly groundTruthState?: CubiOState;
  readonly correctionVector?: readonly number[];
  readonly notes?: string;
  readonly timestamp: number;
}

export interface ModelParameterSet {
  readonly version: number;
  readonly harmonicResonanceBias: number; // [0.01 .. 1.0]
  readonly spatialProximityWeight: number; // [0.01 .. 1.0]
  readonly patternConfidenceWeight: number; // [0.01 .. 1.0]
  readonly entropyDecayRate: number; // [0.001 .. 0.5]
  readonly learningRate: number; // eta [0.001 .. 0.5]
  readonly dimensionWeights: Readonly<Record<CubiODimension, number>>;
  readonly parameterChecksum: string;
}

export interface LearningEpochRecord {
  readonly epochId: string;
  readonly epochIndex: number;
  readonly feedbackCount: number;
  readonly lossBefore: number;
  readonly lossAfter: number;
  readonly lossDelta: number;
  readonly resonanceGain: number;
  readonly parameterDeltas: Readonly<Record<string, number>>;
  readonly previousParameterChecksum: string;
  readonly newParameterChecksum: string;
  readonly timestamp: number;
  readonly epochChecksum: string;
}

export interface LearningCheckpoint {
  readonly checkpointId: string;
  readonly label: string;
  readonly epochIndex: number;
  readonly parameters: ModelParameterSet;
  readonly cumulativeLoss: number;
  readonly auditProof: string;
  readonly timestamp: number;
}

export interface LearningMetricsReport {
  readonly totalEpochs: number;
  readonly totalFeedbackProcessed: number;
  readonly currentLoss: number;
  readonly meanResonanceGain: number;
  readonly checkpointsCount: number;
  readonly isDivergent: boolean;
  readonly currentParameters: ModelParameterSet;
  readonly metricsChecksum: string;
  readonly timestamp: number;
}
