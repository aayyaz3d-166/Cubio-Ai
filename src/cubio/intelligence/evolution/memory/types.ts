/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F104: Continuous Learning & Memory Evolution Types
 *
 * Types for structured episodic memory, distilled solution patterns,
 * failure post-mortems, user-approved knowledge grants, and Merkle consolidation.
 */

export type MemoryEntryType =
  | 'EPISODIC_EXPERIENCE'
  | 'SOLUTION_PATTERN'
  | 'FAILURE_POSTMORTEM'
  | 'USER_APPROVED_KNOWLEDGE'
  | 'CONSOLIDATED_HEURISTIC';

export interface EvolutionaryMemoryRecord {
  readonly memoryId: string;
  readonly entryType: MemoryEntryType;
  readonly title: string;
  readonly domain: string;
  readonly keywords: readonly string[];
  readonly payload: Readonly<Record<string, unknown>>;
  readonly resonanceScore: number; // 0.0 .. 1.0 (reinforcement / decay)
  readonly accessCount: number;
  readonly successRate: number; // 0.0 .. 1.0
  readonly sourceProjectId?: string;
  readonly verifiedByOperator: boolean;
  readonly createdAt: number;
  readonly lastAccessedAt: number;
  readonly recordChecksum: string;
}

export interface SolutionPatternIngestRequest {
  readonly title: string;
  readonly domain: string;
  readonly keywords: readonly string[];
  readonly solutionCodeOrOutput: string;
  readonly sourceProjectId: string;
  readonly confidenceScore: number;
}

export interface FailurePostmortemIngestRequest {
  readonly title: string;
  readonly domain: string;
  readonly keywords: readonly string[];
  readonly errorSignature: string;
  readonly rootCause: string;
  readonly remediationPatch: string;
  readonly sourceProjectId?: string;
}

export interface UserApprovedKnowledgeIngestRequest {
  readonly title: string;
  readonly domain: string;
  readonly keywords: readonly string[];
  readonly ruleOrFact: string;
  readonly operatorIdentity: string;
  readonly governanceScope: string;
}

export interface EvolutionaryMemoryQueryFilter {
  readonly query: string;
  readonly entryType?: MemoryEntryType;
  readonly domain?: string;
  readonly minResonance?: number;
  readonly limit?: number;
}

export interface MemoryConsolidationReport {
  readonly reportId: string;
  readonly totalRecordsInMemory: number;
  readonly episodicCount: number;
  readonly solutionPatternsCount: number;
  readonly failurePostmortemsCount: number;
  readonly userApprovedCount: number;
  readonly consolidatedHeuristicsCount: number;
  readonly averageResonanceScore: number;
  readonly merkleRootHash: string;
  readonly timestamp: number;
}

export interface IEvolutionaryMemoryEngine {
  recordEpisodicRun(projectId: string, domain: string, task: string, outcome: unknown, success: boolean): Promise<EvolutionaryMemoryRecord>;
  ingestSolutionPattern(request: SolutionPatternIngestRequest): Promise<EvolutionaryMemoryRecord>;
  ingestFailurePostmortem(request: FailurePostmortemIngestRequest): Promise<EvolutionaryMemoryRecord>;
  ingestUserApprovedKnowledge(request: UserApprovedKnowledgeIngestRequest): Promise<EvolutionaryMemoryRecord>;
  queryMemory(filter: EvolutionaryMemoryQueryFilter): Promise<readonly EvolutionaryMemoryRecord[]>;
  consolidateAndDistillMemory(): Promise<MemoryConsolidationReport>;
}
