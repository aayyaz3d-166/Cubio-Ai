/**
 * 3D Memory Studio - Funnel 1: Rule Optimizer Types
 * 
 * Determines which representation (RAW or Candidate Rules) has the lowest
 * REAL serialized byte cost under deterministic serialization assumptions.
 * 
 * Non-destructive simulation: does NOT modify .3dmemory or perform actual compression.
 */

import { Coordinate3D, MemoryBlock, RootMemory } from './memory';
import { PatternType, RuleType, SpatialPatternCandidate } from './patterns';

export type RepresentationType =
  | 'RAW'
  | 'SPATIAL_RUN'
  | 'REPETITION'
  | 'CLUSTER'
  | 'SEQUENCE_PATH'
  | 'REPEATED_SHAPE';

export interface SerializedFieldBreakdown {
  fieldName: string;
  byteOffset: number;
  byteLength: number;
  dataType: string;
  valueDescription: string;
}

export interface CandidateRepresentation {
  candidateId: string;
  patternId: string;
  representationType: RepresentationType;
  displayName: string;
  ruleType?: RuleType;
  
  // Real Serialized Byte Cost
  serializedBytes: number;
  originalBytes: number;
  savingsBytes: number;
  savingsPercent: number; // Clamped <= 0 if serializedBytes >= originalBytes

  // Binary Payload & Framing
  headerBytes: number;
  payloadBytes: number;
  serializedBuffer: Uint8Array;
  hexDump: string;
  fieldBreakdown: SerializedFieldBreakdown[];

  // Deterministic Expansion & Exact Validation
  validationStatus: 'VALID' | 'FAIL';
  isValid: boolean;
  reconstructedCellIds: number[];
  originalCellIds: number[];
  isExactMatch: boolean;
  mismatchesCount: number;
  validationError?: string;
  validationDurationMs: number;

  // Metadata & Syntax
  ruleSyntax: string;
  parameters: Record<string, unknown>;
  coveredCellCount: number;
  blockId: number;
  isCrossBlock: boolean;
}

export interface PatternOptimizationResult {
  patternId: string;
  patternType: PatternType;
  patternTitle: string;
  sourcePattern: SpatialPatternCandidate;

  // Baseline
  originalRawBytes: number;
  coveredCellIds: number[];
  coveredCoords: Coordinate3D[];
  blockId: number;
  isCrossBlock: boolean;

  // Spatial Geometry
  startCellId: number;
  endCellId: number;
  startCoord: Coordinate3D;
  endCoord: Coordinate3D;
  directionName?: string;
  directionVector?: [number, number, number];

  // Candidates Evaluation
  candidates: CandidateRepresentation[];
  
  // Winner Selection
  winningCandidate: CandidateRepresentation;
  winnerType: RepresentationType;
  winnerSerializedBytes: number;
  netSavingsBytes: number;
  netSavingsPercent: number;
  didRuleWinOverRaw: boolean;
  
  // Verification
  isReversible: boolean;
  verifiedExactMatch: boolean;

  // Rule Syntax of Winner
  winnerRuleSyntax: string;
}

export interface RuleOptimizerSummary {
  totalPatternsEvaluated: number;
  totalRawBytes: number;
  totalOptimizedBytes: number;
  totalSavingsBytes: number;
  overallSavingsPercent: number;
  
  // Winning Representation Counts
  rulesWonCount: number;
  rawWonCount: number;
  winBreakdown: Record<RepresentationType, number>;
  
  // Validation Statistics
  totalCandidatesEvaluated: number;
  validCandidatesCount: number;
  rejectedCandidatesCount: number;
  
  // Research Status Labels
  disclaimer: 'SIMULATION — NOT YET SAVED';
  optimizationDurationMs: number;
}

export interface RuleOptimizerReport {
  summary: RuleOptimizerSummary;
  results: PatternOptimizationResult[];
}

export interface OptimizerTestCase {
  testId: string;
  name: string;
  description: string;
  inputDescription: string;
  expectedWinner: RepresentationType;
  actualWinner?: RepresentationType;
  rawBytes: number;
  winnerBytes: number;
  savingsBytes: number;
  savingsPercent: number;
  isValid: boolean;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface OptimizerTestSuiteResult {
  allPassed: boolean;
  passedCount: number;
  totalTests: number;
  rawWinsCount: number;
  ruleWinsCount: number;
  totalDurationMs: number;
  cases: OptimizerTestCase[];
}
