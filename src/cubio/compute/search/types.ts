/**
 * CubiO — Universal Spatial Operating Environment
 * Phase 19: Step 13 Superposition Tree Search Types
 *
 * Master specifications for:
 * - Search Nodes with Shared Root + Delta State + CAS Reference
 * - MCTS & TRIADIC_369 Search Strategies
 * - Depth-limited tree expansion, evaluation, backpropagation, and pruning
 * - Low-memory adaptive feedback loop and benchmarking metrics
 */

import { EnvAction } from '../../learning/env/types';
import { CubiOState } from '../../state/types';
import { QuantizationFormat } from '../quantization/types';
import { ExecutionPolicyMode } from '../memory/types';

export type SearchStrategyMode = 'MCTS' | 'TRIADIC_369' | 'GREEDY_BEST_FIRST';
export type SearchNodeStatus = 'UNEXPANDED' | 'EXPANDED' | 'EVALUATED' | 'PRUNED' | 'RESOLVED';

export interface SearchNode {
  readonly nodeId: string;
  readonly parentNodeId: string | null;
  readonly depth: number;
  readonly state: CubiOState;
  readonly action: EnvAction;
  readonly candidateId: string;
  readonly visitCount: number;
  readonly accumulatedValue: number;
  readonly meanValue: number;
  readonly priorProbability: number;
  readonly resonanceScore: number; // 369 harmonic resonance [0..100]
  readonly triadicHarmonicRoot: number; // [1..9]
  readonly status: SearchNodeStatus;
  readonly childrenNodeIds: readonly string[];
  readonly isPinned: boolean;
  readonly memoryBlockId: string;
  readonly checksum: string;
}

export interface TreeSearchConfig {
  readonly maxDepth: number;
  readonly maxIterations: number;
  readonly maxNodes: number;
  readonly branchingFactor: number;
  readonly explorationConstant: number; // Cpuct (default 1.414)
  readonly strategy: SearchStrategyMode;
  readonly pruningThreshold: number; // Discard branches below this threshold
  readonly quantizationFormat: QuantizationFormat;
  readonly resourceMode: ExecutionPolicyMode;
  readonly masterSeed: number;
}

export interface TreeSearchResult {
  readonly searchId: string;
  readonly rootNodeId: string;
  readonly selectedNodeId: string;
  readonly selectedAction: EnvAction;
  readonly totalNodesCreated: number;
  readonly totalNodesEvaluated: number;
  readonly totalNodesPruned: number;
  readonly maxDepthReached: number;
  readonly searchDurationMs: number;
  readonly peakResidentMemoryBytes: number;
  readonly virtualMemoryAllocatedBytes: number;
  readonly cacheHitRatio: number;
  readonly chosenTrajectory: readonly EnvAction[];
  readonly prunedTrajectories: readonly (readonly EnvAction[])[];
  readonly chosenVsRejectedPairs: readonly { chosen: EnvAction; rejected: EnvAction; margin: number }[];
  readonly provenanceHash: string;
}

export interface SearchBenchmarkResult {
  readonly profileName: string;
  readonly resourceMode: ExecutionPolicyMode;
  readonly strategy: SearchStrategyMode;
  readonly quantizationFormat: QuantizationFormat;
  readonly branchingFactor: number;
  readonly maxDepth: number;
  readonly logicalNodesCreated: number;
  readonly evaluatedNodes: number;
  readonly prunedNodes: number;
  readonly peakResidentMb: number;
  readonly virtualMemoryMb: number;
  readonly cacheHitRatio: number;
  readonly pageInCount: number;
  readonly pageOutCount: number;
  readonly searchDurationMs: number;
  readonly nodesPerSecond: number;
  readonly determinismVerified: boolean;
}
