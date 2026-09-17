/**
 * CUBiO AI — Phase 2: Virtual Data Layer Contracts
 *
 * Defines the logical data contracts for all 17 system domains.
 * Core Principle: Virtual Database != Physical Storage
 * Application code interacts with these logical contracts.
 */

export type DomainStatus = 'RESOLVED' | 'PARTIAL' | 'UNRESOLVED';

// 1. Identity Domain
export interface LogicalIdentity {
  readonly id: string; // IDENT_*
  readonly type: 'SYSTEM' | 'NODE' | 'SERVICE';
  readonly name: string;
  readonly role: 'admin' | 'user' | 'readonly';
  readonly status: 'ACTIVE' | 'REVOKED';
  readonly createdAt: number;
  readonly updatedAt: number;
}

// 2. Users Domain
export interface LogicalUser {
  readonly id: string; // USER_*
  readonly tenantId: string;
  readonly username: string;
  readonly role: 'admin' | 'user' | 'readonly';
  readonly activeSessions: readonly string[];
  readonly createdAt: number;
}

// 3. Organizations / Tenants Domain
export interface LogicalOrganization {
  readonly id: string; // TENANT_*
  readonly name: string;
  readonly classification: 'GREEN' | 'YELLOW' | 'RED';
  readonly quotaLimit: number;
  readonly createdAt: number;
}

// 4. Projects Domain
export interface LogicalProject {
  readonly id: string; // PROJ_*
  readonly tenantId: string;
  readonly name: string;
  readonly description?: string;
  readonly status: 'ACTIVE' | 'ARCHIVED';
  readonly createdAt: number;
  readonly updatedAt: number;
}

// 5. Entities Domain
export interface LogicalEntity {
  readonly id: string; // ENT_*
  readonly tenantId: string;
  readonly key: string;
  readonly value: string;
  readonly confidence: number;
  readonly sessionId?: string;
  readonly turnIndex?: number;
}

// 6. Memory Domain (Conversational vs Spatial Separation)
export interface LogicalConversationalMemory {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly facts: Readonly<Record<string, string>>;
  readonly historyTurns: number;
  readonly integrityChecksum: string; // SHA-256
  readonly lastPersistedAt: number;
}

export interface LogicalSpatialMemoryState {
  readonly totalCells: 343;
  readonly symbolicAnchors: 26;
  readonly totalAddresses: 369;
  readonly latticeDimensions: readonly [7, 7, 7];
  readonly centerCellIndex: 171;
  readonly center369Address: 197;
  readonly phaseInvariantSatisfied: boolean;
}

// 7. Knowledge Domain
export interface LogicalKnowledgeRecord {
  readonly id: string; // KNOW_*
  readonly category: string;
  readonly queryPattern: string;
  readonly factualAssertion: string;
  readonly verifiedLanguage: 'ENGLISH' | 'ROMAN_URDU';
  readonly provenanceSource: string;
  readonly status: DomainStatus; // Currently PARTIAL
}

// 8. Relationships Domain
export interface LogicalRelationship {
  readonly id: string; // REL_*
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationType: string;
  readonly weight: number;
  readonly classification: 'GREEN' | 'YELLOW' | 'RED';
}

// 9. Files Domain
export interface LogicalFileRecord {
  readonly id: string; // FILE_*
  readonly logicalPath: string;
  readonly byteLength: number;
  readonly sha256: string;
  readonly mimeType: string;
  readonly createdAt: number;
}

// 10. Datasets Domain
export interface LogicalDataset {
  readonly id: string; // DS_*
  readonly name: string;
  readonly version: string;
  readonly totalEpisodes: number;
  readonly trainCount: number;
  readonly valCount: number;
  readonly testCount: number;
  readonly trainTestOverlap: 0;
  readonly manifestHash: string;
  readonly lineageParentDataset?: string;
}

// 11. Training Runs Domain
export interface LogicalTrainingRun {
  readonly runId: string; // TRAIN_RUN_*
  readonly modelId: string;
  readonly datasetHash: string;
  readonly vocabularyHash: string;
  readonly epochs: number;
  readonly seed: number;
  readonly optimizer: string;
  readonly initialLoss: number;
  readonly finalLoss: number;
  readonly status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';
  readonly trainedCheckpointId: string;
  readonly createdAt: number;
}

// 12. Models Domain
export interface LogicalModel {
  readonly modelId: string; // CUBIO-NATIVE-MODEL-V1
  readonly architectureId: string;
  readonly parameterCount: 153472;
  readonly vocabularySize: 478;
  readonly embedDim: 64;
  readonly numLayers: 2;
  readonly numHeads: 4;
  readonly maxSequenceLength: 64;
  readonly numSpatialCells: 343;
  readonly isProductionReady: boolean;
}

// 13. Checkpoints Domain
export interface LogicalCheckpoint {
  readonly checkpointId: string; // CHK_*
  readonly modelId: string;
  readonly sha256: string;
  readonly merkleRoot: string;
  readonly stateHash: string;
  readonly lineageParentHash: string;
  readonly byteLength: number;
  readonly createdAt: number;
}

// 14. Evaluations Domain
export interface LogicalEvaluation {
  readonly evalId: string; // EVAL_*
  readonly runId: string;
  readonly checkpointId: string;
  readonly testBatteryTotal: number;
  readonly testBatteryPassed: number;
  readonly valAccuracy: number;
  readonly testAccuracy: number;
  readonly status: 'PASS' | 'FAIL';
  readonly timestamp: number;
}

// 15. Workflows Domain (UNRESOLVED / CONTRACT DEFINED)
export interface LogicalWorkflow {
  readonly workflowId: string; // WF_*
  readonly name: string;
  readonly version: string;
  readonly steps: readonly {
    readonly stepNumber: number;
    readonly name: string;
    readonly action: string;
    readonly status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  }[];
  readonly status: DomainStatus; // UNRESOLVED
}

// 16. Events Domain (Unified Audit Event)
export interface LogicalEvent {
  readonly eventId: string; // EVT_*
  readonly eventType: string;
  readonly timestamp: number;
  readonly actor: string;
  readonly source: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  readonly status: 'SUCCESS' | 'DENIED' | 'FAILED';
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly integrityHash?: string;
}

// 17. System State Domain
export interface LogicalSystemState {
  readonly uptime: number;
  readonly isActuationBlocked: true; // Permanent invariant
  readonly qwenEradicated: true;
  readonly activeExternalModels: 0;
  readonly nativeInferenceStatus: 'NATIVE_INFERENCE_NOT_YET_AVAILABLE' | 'ACTIVE';
  readonly deterministicPipelineReady: boolean;
  readonly timestamp: string;
}

// Storage Adapter Interface Contract
export interface IStorageAdapter {
  readonly adapterName: string;
  readonly isInitialized: boolean;
  initialize(): Promise<void>;
  get<T>(domain: string, id: string): Promise<T | undefined>;
  getAll<T>(domain: string): Promise<readonly T[]>;
  save<T extends { id: string }>(domain: string, record: T): Promise<T>;
  delete(domain: string, id: string): Promise<boolean>;
  close(): Promise<void>;
}
