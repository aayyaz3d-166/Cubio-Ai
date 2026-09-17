/**
 * 3D Memory Studio — Funnel 47
 * Data Classification & Green/Red Processing Boundary Types
 *
 * Formal types for deterministic classification, processing authorization,
 * security boundaries, guard evaluations, and audit provenance.
 */

export type DataClassification = 'GREEN' | 'RED';

export type ClassificationStatus = 'CLASSIFIED' | 'RESTRICTED' | 'UNKNOWN';

export interface ClassificationRule {
  readonly ruleId: string;
  readonly priority: number;
  readonly description: string;
  readonly classification: DataClassification;
  readonly reason: string;
  readonly condition: (input: RawInputRecord) => boolean;
}

export interface RawInputRecord {
  readonly recordId: string;
  readonly documentId?: string;
  readonly sourceDomain: string;
  readonly sourceUrl?: string;
  readonly category: string;
  readonly rawValue: unknown;
  readonly payloadChecksum: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ClassifiedRecord {
  readonly classificationId: string;
  readonly recordIdentity: string;
  readonly sourceIdentity: string;
  readonly category: string;
  readonly classification: DataClassification;
  readonly status: ClassificationStatus;
  readonly classificationReason: string;
  readonly classificationRuleId: string;
  readonly classificationTimestamp: number;
  readonly originalChecksum: string;
  readonly processingAllowed: boolean;
  readonly rawRecord: RawInputRecord;
}

export interface ClassificationAuditEntry {
  readonly auditId: string;
  readonly timestamp: number;
  readonly recordId: string;
  readonly operationAttempted: string;
  readonly classification: DataClassification;
  readonly outcome: 'PERMITTED' | 'BLOCKED';
  readonly reason: string;
  readonly checksum: string;
}

export interface ProcessingBatch {
  readonly batchId: string;
  readonly timestamp: number;
  readonly totalSubmitted: number;
  readonly greenCount: number;
  readonly redCount: number;
  readonly greenRecords: readonly ClassifiedRecord[];
  readonly rejectedAuditEntries: readonly ClassificationAuditEntry[];
  readonly batchChecksum: string;
}

export interface GuardEvaluationResult<T = unknown> {
  readonly success: boolean;
  readonly classification: DataClassification;
  readonly recordId: string;
  readonly payload?: T;
  readonly blockedReason?: string;
  readonly auditEntry: ClassificationAuditEntry;
}

export interface Guarded369Encoding {
  readonly sequence369: string;
  readonly symbolCount: number;
  readonly numericStateBigIntString: string;
}

export interface GuardedDimensionalProjection {
  readonly dimension: number;
  readonly formattedCoordinate: string;
  readonly coordinateValues: readonly number[];
  readonly checksumInvariant: string;
}

export interface ClassificationDatasetSummary {
  readonly totalRecords: number;
  readonly greenCount: number;
  readonly redCount: number;
  readonly unknownBlockedCount: number;
  readonly greenPercentage: number;
  readonly redPercentage: number;
}

export interface F47TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly collisions?: number;
  readonly variance?: number;
  readonly greenCount?: number;
  readonly redCount?: number;
}

export interface F47SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F47TestResult[];
}
