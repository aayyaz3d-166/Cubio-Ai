/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F7: CubiO Intelligence Pattern Engine (Types & Contracts)
 *
 * Master specification for detecting relational topologies, temporal cycles,
 * spatial trajectories, and harmonic 369 motifs, and storing them in a structured catalog.
 */

import { CubiODimension } from '../../types';
import { CubiOState } from '../../state/types';
import { StateTransitionRecord } from '../state_space/types';

export type PatternType =
  | 'RELATIONAL_TOPOLOGY'
  | 'TEMPORAL_CYCLE'
  | 'SPATIAL_TRAJECTORY'
  | 'HARMONIC_369'
  | 'TRANSITION_MOTIF';

export interface DetectedPatternEntry {
  readonly patternId: string;
  readonly patternType: PatternType;
  readonly name: string;
  readonly confidence: number; // 0.0 <= confidence <= 1.0
  readonly frequency: number; // Occurrence count
  readonly involvedStateIds: readonly string[];
  readonly spatialSignatures: readonly number[];
  readonly periodicity?: number; // e.g. T=6 for vortex doubling
  readonly description: string;
  readonly metadata?: Readonly<Record<string, any>>;
  readonly detectedAt: number;
  readonly patternChecksum: string;
}

export interface PatternAnalysisRequest {
  readonly states: readonly CubiOState[];
  readonly transitions?: readonly StateTransitionRecord[];
  readonly targetDimension?: CubiODimension;
  readonly minConfidence?: number;
}

export interface PatternDetectionResult {
  readonly resultId: string;
  readonly totalPatternsDetected: number;
  readonly patternsByType: Readonly<Record<PatternType, number>>;
  readonly patterns: readonly DetectedPatternEntry[];
  readonly analysisDurationMs: number;
  readonly analysisChecksum: string;
  readonly timestamp: number;
}

export interface PatternCatalogSnapshot {
  readonly catalogId: string;
  readonly patterns: Readonly<Record<string, DetectedPatternEntry>>;
  readonly totalPatternCount: number;
  readonly catalogChecksum: string;
  readonly timestamp: number;
}
