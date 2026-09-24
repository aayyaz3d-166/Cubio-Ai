/**
 * CubiO — Universal Spatial Operating Environment
 * Layer 19: Federated Mission Intelligence & Strategic Continuity (F245–F260) 👑
 *
 * Master Type Definitions & Multi-Mission Strategic Federation Invariants
 */

// ─── F245: MISSION FEDERATION COMPILER ────────────────────────────────────────

export interface FederatedMissionDefinition {
  readonly missionId: string;
  readonly missionTitle: string;
  readonly domainSector: 'AEROSPACE_STRUCTURAL' | 'JEWELRY_PRECISION_CAD' | 'BIOMEDICAL_MICROFLUIDIC' | 'ACOUSTIC_PHOTONIC' | 'CROSS_DOMAIN_MULTI_SOUL';
  readonly assignedSouls: readonly string[];
  readonly targetObjectivesCount: number;
  readonly estimatedExecutionDurationMs: number;
  readonly requestedComputeBudget: {
    readonly vramMb: number;
    readonly wasmSlots: number;
  };
}

export interface CompiledFederationManifest {
  readonly federationId: string;
  readonly compiledTimestamp: number;
  readonly constituentMissions: readonly FederatedMissionDefinition[];
  readonly totalMissionsCount: number;
  readonly canonicalFederationSchemaVersion: '1.0.0-FEDERATION';
  readonly multiMissionCompilationIntegrity: true;
  readonly compilationProofSeal: string;
}

// ─── F246: MISSION GRAPH INTEGRATOR ──────────────────────────────────────────

export interface FederatedMissionGraphNode {
  readonly nodeId: string;
  readonly missionId: string;
  readonly stageIndex: number;
  readonly stageName: string;
  readonly durationMs: number;
  readonly isCriticalPath: boolean;
}

export interface FederatedMissionGraphEdge {
  readonly edgeId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly relationshipType: 'INTRA_MISSION_STAGE' | 'INTER_MISSION_SYNC' | 'SHARED_TOPOLOGICAL_CONSTRAINT';
}

export interface UnifiedFederationGraphReport {
  readonly graphReportId: string;
  readonly federationId: string;
  readonly totalNodes: number;
  readonly totalEdges: number;
  readonly graphNodes: readonly FederatedMissionGraphNode[];
  readonly graphEdges: readonly FederatedMissionGraphEdge[];
  readonly cyclicDependenciesDetected: 0; // Invariant: 0 cycles allowed
  readonly unifiedGraphProofSeal: string;
  readonly timestamp: number;
}


// ─── F247: CROSS-MISSION DEPENDENCY RESOLVER ─────────────────────────────────

export type CrossMissionDependencyCategory =
  | 'TEMPORAL_PRECEDENCE'
  | 'SHARED_COMPUTE_RESOURCE'
  | 'SHARED_TOPOLOGICAL_MANIFOLD'
  | 'INTER_SECTOR_DELIVERABLE';

export interface ResolvedCrossMissionDependency {
  readonly dependencyId: string;
  readonly sourceMissionId: string;
  readonly targetMissionId: string;
  readonly category: CrossMissionDependencyCategory;
  readonly isResolvedInSandbox: boolean;
  readonly resolutionStrategy: string;
}

export interface CrossMissionDependencyResolutionReport {
  readonly resolutionReportId: string;
  readonly federationId: string;
  readonly totalCrossDependencies: number;
  readonly resolvedDependencies: readonly ResolvedCrossMissionDependency[];
  readonly unresolvableDeadlocksDetected: 0; // Invariant: 0 deadlocks
  readonly crossDomainIsolationPreserved: true;
  readonly resolutionProofSeal: string;
  readonly timestamp: number;
}

// ─── F248: STRATEGIC PRIORITY ENGINE ─────────────────────────────────────────

export interface StrategicPriorityRanking {
  readonly missionId: string;
  readonly strategicWeight: number; // 0..1
  readonly criticalityScore: number; // 0..1
  readonly compoundPriorityScore: number; // 0..1
  readonly priorityRank: number; // 1 = highest
  readonly priorityRationale: string;
  readonly priorityDoesNotConferExecutionAuthority: true; // Invariant
}

export interface StrategicPriorityReport {
  readonly priorityReportId: string;
  readonly federationId: string;
  readonly rankings: readonly StrategicPriorityRanking[];
  readonly topStrategicMissionId: string;
  readonly priorityDoesNotConferExecutionAuthority: true; // Permanent Invariant
  readonly priorityProofSeal: string;
  readonly timestamp: number;
}
