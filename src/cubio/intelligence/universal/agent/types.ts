/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F61: Multi-Agent Problem Solver 8-Stage Architecture Types
 *
 * Problem -> Planner -> Task Graph -> Specialist Agents -> Parallel Execution -> Cross-check -> Validator -> Final Solution
 */

export type AgentRole =
  | 'MASTER_COORDINATOR'
  | 'RESEARCH_AGENT'
  | 'CODING_AGENT'
  | 'SPATIAL_AGENT'
  | 'REASONING_AGENT'
  | 'TESTING_AGENT'
  | 'VALIDATOR_AGENT'
  | 'COORDINATOR'
  | 'CODE_AGENT'
  | 'DESIGN_AGENT'
  | 'CRITIC_AGENT';

export interface UniversalAgentTask {
  readonly taskId: string;
  readonly role: AgentRole;
  readonly title: string;
  readonly description: string;
  readonly dependencies: readonly string[]; // taskIds
  readonly status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface AgentContribution {
  readonly agentId: string;
  readonly role: AgentRole;
  readonly taskId: string;
  readonly summary: string;
  readonly artifactType: string;
  readonly payload: unknown;
  readonly confidence: number; // 0.0 .. 1.0
  readonly executionTimeMs: number;
}

export interface AgentMessage {
  readonly messageId: string;
  readonly fromAgent: string;
  readonly toAgent: string | 'BROADCAST';
  readonly type: 'PROPOSE' | 'CRITIQUE' | 'REFINE' | 'AGREE';
  readonly content: string;
  readonly timestamp: number;
}

export interface ProblemDecomposition {
  readonly problemId: string;
  readonly originalProblem: string;
  readonly normalizedDomain: string;
  readonly tasks: readonly UniversalAgentTask[];
  readonly totalTasks: number;
  readonly decompositionChecksum: string;
}

export interface TaskGraphLayer {
  readonly layerIndex: number;
  readonly tasks: readonly UniversalAgentTask[];
}

export interface TaskGraph {
  readonly graphId: string;
  readonly problemId: string;
  readonly layers: readonly TaskGraphLayer[];
  readonly totalNodes: number;
  readonly criticalPathLength: number;
  readonly graphChecksum: string;
}

export interface CrossCheckReport {
  readonly reconciliationScore: number; // 0.0 .. 1.0
  readonly messagesExchanged: readonly AgentMessage[];
  readonly agreedPoints: readonly string[];
  readonly reconciledDiscrepancies: readonly string[];
  readonly crossCheckChecksum: string;
}

export interface ValidationReport {
  readonly isValid: boolean;
  readonly validationScore: number; // 0.0 .. 1.0
  readonly factGroundingChecked: boolean;
  readonly codeSyntaxChecked: boolean;
  readonly spatialTopologyChecked: boolean;
  readonly feedback: string;
  readonly validationChecksum: string;
}

export interface FinalAnswerResult {
  readonly answerId: string;
  readonly problem: string;
  readonly masterPlan: string;
  readonly researchSummary: string;
  readonly codeSummary: string;
  readonly spatialSummary: string;
  readonly validationSummary: string;
  readonly finalAnswerText: string;
  readonly solutionChecksum: string;
  readonly timestamp: number;
}

export interface ConsensusReport {
  readonly consensusScore: number; // 0.0 .. 1.0
  readonly acceptedContributions: readonly AgentContribution[];
  readonly arbitratedConflicts: readonly string[];
  readonly finalSynthesis: string;
  readonly consensusChecksum: string;
}

export interface MultiAgentSolveResult {
  readonly problemId: string;
  readonly originalProblem: string;
  readonly decomposition: ProblemDecomposition;
  readonly taskGraph?: TaskGraph;
  readonly contributions: readonly AgentContribution[];
  readonly messages: readonly AgentMessage[];
  readonly crossCheckReport?: CrossCheckReport;
  readonly consensus: ConsensusReport;
  readonly validationReport: ValidationReport;
  readonly finalAnswer: FinalAnswerResult;
  readonly totalExecutionTimeMs: number;
  readonly solveChecksum: string;
  readonly timestamp: number;
}

export interface IUniversalMultiAgentSolver {
  decomposeProblem(problem: string): ProblemDecomposition;
  solveProblem(problem: string): Promise<MultiAgentSolveResult>;
}
