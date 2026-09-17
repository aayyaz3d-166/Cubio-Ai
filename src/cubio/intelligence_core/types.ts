/**
 * CUBiO AI — Phase 25: Intelligence Core Genesis
 * Sovereign Type Definitions & Interfaces
 * Protocol: CUBIO-P25-INTELLIGENCE-CORE-GENESIS-001
 */

// ============================================================================
// 1. 3D Spatial Map & 343-Cell HCP Lattice Types
// ============================================================================

export type Coordinate3D = [x: number, y: number, z: number];
export type HCPCoordinate = [u: number, v: number, w: number];

export type LatticeCellState =
  | 'ACTIVE'
  | 'IDLE'
  | 'HOT'
  | 'COLD'
  | 'LOCKED'
  | 'CONTRADICTION';

export type Address369Triad = 'TRIAD_3' | 'TRIAD_6' | 'TRIAD_9' | 'MODULAR_BASE';

export interface LatticeCell343 {
  readonly id: string; // e.g.  CELL_0_0_0
  readonly x: number;  // 0..6
  readonly y: number;  // 0..6
  readonly z: number;  // 0..6
  readonly linearIndex: number; // 0..342
  readonly address369: number;  // 1..369 modular address
  readonly harmonicRoot: 3 | 6 | 9 | number;
  readonly triadType: Address369Triad;
  readonly density: number;     // 0.0 .. 1.0
  readonly state: LatticeCellState;
  readonly label: string;
  readonly activeTrajectory: boolean;
  readonly knowledgeClusterId?: string;
}

export interface TrajectoryPathVector {
  readonly id: string;
  readonly sourceCellId: string;
  readonly targetCellId: string;
  readonly waypoints: readonly Coordinate3D[];
  readonly progress: number; // 0.0 .. 1.0
  readonly stage: string;
  readonly active: boolean;
}

// ============================================================================
// 2. Node Inspector 9-Field Deep Schema
// ============================================================================

export type EpistemicTier =
  | 'FACT'
  | 'OBSERVATION'
  | 'DERIVATION'
  | 'HYPOTHESIS'
  | 'PREDICTION'
  | 'ASSUMPTION'
  | 'UNKNOWN';

export interface NodeRelationEdge {
  readonly targetId: string;
  readonly relationType: string;
  readonly weight: number;
}

export interface NodeHistoryRecord {
  readonly timestamp: number;
  readonly event: string;
  readonly delta: string;
}

export interface DeepNodeInspectionData {
  readonly address369: number;
  readonly cellId: string;
  readonly stateT: string;
  readonly memory: {
    readonly shortTerm: number;
    readonly longTerm: number;
    readonly summary: string;
  };
  readonly evidence: EpistemicTier;
  readonly provenance: string; // SHA-256
  readonly relations: readonly NodeRelationEdge[];
  readonly confidence: number; // 0.0 .. 1.0
  readonly history: readonly NodeHistoryRecord[];
}

// ============================================================================
// 3. Live Intelligence State Telemetry Types
// ============================================================================

export interface ModelTelemetry {
  readonly modelId: string;
  readonly checkpointId: string;
  readonly status: 'INITIALIZING' | 'READY' | 'INFERENCE' | 'OFFLINE';
  readonly vocabularySize: number;
  readonly totalParameters: number;
  readonly externalModelCalls: number; // Strictly 0
  readonly activeQwenDependency: number; // Strictly 0 (QWEN_REMOVED: eradicated)
  readonly epistemicLocked: boolean; // Strictly true
  readonly inferenceLatencyMs: number;
  readonly tokensProcessed: number;
}

export interface MemoryTelemetry {
  readonly shortTermCount: number;
  readonly longTermCount: number;
  readonly semanticCount: number;
  readonly relationalCount: number;
  readonly temporalCount: number;
  readonly totalActiveBytes: number;
}

export interface ReasoningTelemetry {
  readonly activeChainDepth: number;
  readonly activeHypotheses: number;
  readonly evidenceDistribution: Record<EpistemicTier, number>;
  readonly averageConfidence: number; // 0.0 .. 1.0
  readonly unknownCount: number;
  readonly nonFactLockoutEnforced: boolean;
}

export interface SystemTelemetry {
  readonly cpuLoadPct: number;
  readonly heapUsageBytes: number;
  readonly maxHeapBytes: number;
  readonly latencyMs: number;
  readonly throughputOpsPerSec: number;
  readonly errorCount: number;
  readonly securityStatus: 'LOCKED_FAIL_CLOSED' | 'GUARDED';
  readonly actuationBlocked: boolean; // Strictly true
  readonly networkAccess: number;     // Strictly 0
}

export interface LiveIntelligenceStateSnapshot {
  readonly timestamp: number;
  readonly model: ModelTelemetry;
  readonly memory: MemoryTelemetry;
  readonly reasoning: ReasoningTelemetry;
  readonly system: SystemTelemetry;
}

// ============================================================================
// 4. Dynamic Coverage & Expansion Metrics
// ============================================================================

export interface DynamicCoverageMetrics {
  readonly cellCount: 343;
  readonly activeCellCount: number;
  readonly cellCoveragePct: number;      // e.g. 100.0%
  readonly addressSpaceTotal: 369;
  readonly mappedAddressCount: number;
  readonly addressCoveragePct: number;   // e.g. 100.0%
  readonly memoryCoveragePct: number;    // Computed dynamically
  readonly knowledgeCoveragePct: number; // Computed dynamically
  readonly activeReasoningPct: number;   // Computed dynamically
  readonly calculatedAt: number;
}

// ============================================================================
// 5. Autonomous Intelligence Builder Types
// ============================================================================

export type BuilderCandidateStatus =
  | 'PROPOSED'
  | 'SANDBOXED'
  | 'TESTING'
  | 'REJECTED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'DEPLOYED';

export interface LimitationTicket {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly domain: 'RETRIEVAL' | 'REASONING' | 'LATENCY' | 'MEMORY' | 'VOCABULARY';
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly detectedAt: number;
}

export interface BuilderProposal {
  readonly id: string;
  readonly ticketId: string;
  readonly title: string;
  readonly rationale: string;
  readonly proposedDiff: string;
  readonly targetSubsystem: string;
  readonly generatedAt: number;
}

export interface SandboxExecutionReport {
  readonly proposalId: string;
  readonly executionSuccess: boolean;
  readonly testsPassed: number;
  readonly testsTotal: number;
  readonly sandboxMemoryBytes: number;
  readonly baselineAccuracyDelta: number;
  readonly baselineLatencyDeltaMs: number;
  readonly regressionsCount: number;
  readonly logs: readonly string[];
}

export interface BuilderCandidate {
  readonly id: string;
  readonly proposal: BuilderProposal;
  readonly sandboxReport: SandboxExecutionReport;
  readonly isApprovedByHuman: boolean;
  readonly isPolicyCompliant: boolean;
  readonly status: BuilderCandidateStatus;
  readonly candidateChecksum: string;
  readonly createdAt: number;
}

// ============================================================================
// 6. Self-Optimization Center Types
// ============================================================================

export type OptimizationCandidateStatus = 'BASE' | 'BEST' | 'CANDIDATE' | 'REJECT';

export interface OptimizationCandidateRow {
  readonly id: string;
  readonly label: string;
  readonly accuracyPct: number;
  readonly latencyMs: number;
  readonly memoryMb: number;
  readonly regressions: number;
  readonly status: OptimizationCandidateStatus;
}

export interface SelfOptimizationMatrix {
  readonly currentBaseline: OptimizationCandidateRow;
  readonly candidates: readonly OptimizationCandidateRow[];
  readonly bestCandidateId: string;
  readonly timestamp: number;
}

// ============================================================================
// 7. Live Tracking Event Stream Types
// ============================================================================

export type TrackingEventType =
  | 'OBSERVATION_RECEIVED'
  | 'ADDRESS_MAPPED'
  | 'MEMORY_LOOKUP'
  | 'REASONING_CHAIN_STARTED'
  | 'EVIDENCE_CLASSIFIED'
  | 'CANDIDATE_HYPOTHESIS'
  | 'VERIFICATION_PASS'
  | 'STATE_COMMITTED';

export interface LiveTrackingEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly timeFormatted: string; // HH:MM:SS.mmm
  readonly type: TrackingEventType;
  readonly address369: number;
  readonly cellId: string;
  readonly description: string;
  readonly trajectoryCoords: readonly Coordinate3D[];
}

// ============================================================================
// 8. Product Factory Pipeline Types
// ============================================================================

export type ProductFactoryStage =
  | 'PROBLEM'
  | 'RESEARCH'
  | 'HYPOTHESIS'
  | 'DESIGN'
  | 'PROTOTYPE'
  | 'SIMULATION'
  | 'TEST'
  | 'VALIDATION'
  | 'PRODUCT_CANDIDATE';

export interface ProductFactoryPipelineItem {
  readonly id: string;
  readonly productName: string;
  readonly currentStage: ProductFactoryStage;
  readonly progressPct: number;
  readonly hypothesisSummary: string;
  readonly validationPassed: boolean;
  readonly stagesCompleted: readonly ProductFactoryStage[];
}

// ============================================================================
// 9. Intelligence Graph Visualizer Types
// ============================================================================

export type GraphNodeType = 'KNOWLEDGE' | 'MEMORY' | 'REASONING' | 'STATE';

export interface IntelligenceGraphNode {
  readonly id: string;
  readonly label: string;
  readonly type: GraphNodeType;
  readonly address369: number;
  readonly latticeCellId: string;
  readonly position3D: Coordinate3D;
  readonly weight: number;
  readonly confidence: number;
}

export interface IntelligenceGraphEdge {
  readonly source: string;
  readonly target: string;
  readonly relation: string;
  readonly weight: number;
}

export interface IntelligenceGraphData {
  readonly nodes: readonly IntelligenceGraphNode[];
  readonly edges: readonly IntelligenceGraphEdge[];
}

// ============================================================================
// 10. Navigation & Shell View Types
// ============================================================================

export type IntelligenceCoreView =
  | 'VISUAL_CORTEX'
  | 'LIVE_STATE'
  | 'AUTONOMOUS_BUILDER'
  | 'OPTIMIZATION_CENTER'
  | 'INTELLIGENCE_GRAPH'
  | 'LIVE_TRACKING'
  | 'PRODUCT_FACTORY'
  | 'PRODUCT_BRANCHES';
