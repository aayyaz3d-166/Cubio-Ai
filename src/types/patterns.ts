/**
 * 3D Memory Studio - Spatial Pattern Discovery Engine Types
 * 
 * Two-Funnel Research Types:
 * Funnel 1: Pattern Detection (Runs, Repetitions, Clusters, Sequence Paths, Repeated Shapes)
 * Funnel 2: Non-Destructive Rule Generation, Verification, & Storage Saving Estimation
 */

import { Coordinate3D, MemoryCell, MemoryBlock, RootMemory } from './memory';

export type PatternType =
  | 'SPATIAL_RUN'
  | 'REPETITION'
  | 'CLUSTER'
  | 'SEQUENCE_PATH'
  | 'REPEATED_SHAPE';

export type RuleType =
  | 'SPATIAL_RUN_RULE'
  | 'REPETITION_RULE'
  | 'CLUSTER_RULE'
  | 'SEQUENCE_PATH_RULE'
  | 'REPEATED_SHAPE_RULE';

/**
 * 1. SPATIAL RUN PATTERN
 * Consecutive active cells along +X/-X, +Y/-Y, +Z/-Z or diagonals
 */
export interface SpatialRunPattern {
  id: string;
  type: 'SPATIAL_RUN';
  startCell: number; // 0..342 (or global ID)
  endCell: number;
  direction: [number, number, number]; // e.g. [1, 0, 0]
  directionName: string; // e.g. "+X", "-Y", "+Z"
  length: number;
  cells: number[]; // Cell IDs in order
  coords: Coordinate3D[];
  symbols: string[];
  blockId: number;
  isCrossBlock: boolean;
  stepIndices: number[];
}

/**
 * 2. SPATIAL REPETITION PATTERN
 * Repeated token/state patterns (e.g. ABABABAB) and spatial periodicities
 */
export interface SpatialRepetitionPattern {
  id: string;
  type: 'REPETITION';
  pattern: string[]; // e.g. ["A", "B"]
  patternString: string; // e.g. "AB"
  repetitions: number; // e.g. 4
  totalTokens: number; // 8
  periodLength: number; // 2
  cells: number[];
  coords: Coordinate3D[];
  startStep: number;
  endStep: number;
  blockIds: number[];
  spatialPeriodicityVector: [number, number, number] | null;
}

/**
 * 3. SPATIAL CLUSTER PATTERN
 * Grouped nearby active cells in 6-direction or 26-direction neighborhoods
 */
export interface SpatialClusterPattern {
  id: string;
  type: 'CLUSTER';
  clusterId: number;
  cells: number[];
  coords: Coordinate3D[];
  symbols: string[];
  cellCount: number;
  density: number; // active / boundingBoxVolume
  centroid: [number, number, number]; // [meanX, meanY, meanZ]
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    dimensions: [number, number, number];
    volume: number;
  };
  activeRatio: number;
  entropy: number;
  neighborhoodType: 'ORTHOGONAL_6' | 'MOORE_26';
  blockId: number;
}

/**
 * 4. SEQUENCE PATTERN
 * Token sequence order compared with spatial movement vectors
 */
export interface SequencePathPattern {
  id: string;
  type: 'SEQUENCE_PATH';
  pathId: string;
  startCell: number;
  endCell: number;
  startToken: string;
  endToken: string;
  tokenCount: number;
  cells: number[];
  coords: Coordinate3D[];
  symbols: string[];
  movements: [number, number, number][]; // Step delta vectors: [[1,0,0], [1,0,0], [0,1,0]]
  movementNames: string[];
  isPredictableTrajectory: boolean;
  predictabilityScore: number; // 0..100
  trajectoryDescription: string;
  stepIndices: number[];
  blockId: number;
}

/**
 * 5. REPEATED SPATIAL SHAPE PATTERN
 * Identical topological configurations occurring at different spatial locations
 */
export interface ShapeOccurrence {
  occurrenceIndex: number;
  originCellId: number;
  originCoord: Coordinate3D;
  blockId: number;
  cells: number[];
  coords: Coordinate3D[];
  symbols: string[];
}

export interface RepeatedSpatialShapePattern {
  id: string;
  type: 'REPEATED_SHAPE';
  shapeSignature: string; // Canonical relative offsets hash: e.g. "0,0,0|1,0,0|0,1,0"
  shapeName: string;
  cellsPerOccurrence: number;
  occurrences: ShapeOccurrence[];
  occurrenceCount: number;
  totalCellsCovered: number;
  relativeOffsets: [number, number, number][];
}

export type SpatialPatternCandidate =
  | SpatialRunPattern
  | SpatialRepetitionPattern
  | SpatialClusterPattern
  | SequencePathPattern
  | RepeatedSpatialShapePattern;

/**
 * Score Breakdown (0-100)
 */
export interface PatternScoreBreakdown {
  repetition: number; // 0..20
  spatialContinuity: number; // 0..20
  density: number; // 0..15
  ruleSimplicity: number; // 0..15
  estimatedSavings: number; // 0..20
  reconstructionConfidence: number; // 0..10
  totalScore: number; // 0..100
}

/**
 * Funnel 2: Candidate Compression Rule & Non-Destructive Estimation
 */
export interface PatternRule {
  ruleId: string;
  patternId: string;
  patternType: PatternType;
  ruleType: RuleType;
  sourcePattern: SpatialPatternCandidate;
  title: string;
  ruleSyntax: string; // e.g. "START=120, DIR=+X, LEN=5"
  parameters: Record<string, unknown>;

  // Storage Estimation (Non-Destructive)
  currentRecords: number; // e.g. 5
  estimatedRecords: number; // e.g. 1
  estimatedBytesBefore: number; // e.g. 160 bytes
  estimatedBytesAfter: number; // e.g. 32 bytes
  estimatedSavingsBytes: number; // e.g. 128 bytes
  estimatedSavingsPercent: number; // e.g. 80%

  // Rule Validation (Deterministic Expand & Compare)
  validationStatus: 'PASS' | 'FAIL';
  isValid: boolean;
  validationDetails: {
    originalCellIds: number[];
    reconstructedCellIds: number[];
    isExactMatch: boolean;
    mismatchesCount: number;
    errorReason?: string;
    validationDurationMs: number;
  };

  // Pattern Quality Score (0..100)
  score: number;
  scoreBreakdown: PatternScoreBreakdown;
}

/**
 * Complete Discovery & Estimation Report
 */
export interface SpatialPatternDiscoveryReport {
  summary: {
    totalPatternsFound: number;
    spatialRunsCount: number;
    repetitionsCount: number;
    clustersCount: number;
    sequencePathsCount: number;
    repeatedShapesCount: number;
    validRulesCount: number;
    invalidRulesCount: number;
    meanScore: number;
    topScore: number;
    activeCellsCount: number;
    activeCellsCoveredByRules: number;
    ruleCoveragePercent: number;
    estimatedRawBytesBefore: number;
    estimatedRuleBytesAfter: number;
    estimatedSavingsPercent: number;
    disclaimer: 'ESTIMATED — NOT YET APPLIED';
    analysisDurationMs: number;
  };
  runs: SpatialRunPattern[];
  repetitions: SpatialRepetitionPattern[];
  clusters: SpatialClusterPattern[];
  sequencePaths: SequencePathPattern[];
  repeatedShapes: RepeatedSpatialShapePattern[];
  rules: PatternRule[];
}

/**
 * 8-Test Automated Test Result
 */
export interface PatternEngineTestCase {
  testId: string;
  name: string;
  description: string;
  inputDescription: string;
  expectedPatternType: PatternType | 'FEW_NO_PATTERNS' | 'CROSS_BLOCK' | 'REJECT_INVALID';
  passed: boolean;
  patternsFound: number;
  topRuleScore: number;
  validationRate: number; // 0..100%
  details: string;
  durationMs: number;
}
