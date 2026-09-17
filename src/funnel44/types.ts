/**
 * 3D Memory Studio — Funnel 44
 * Internet Data Capture, 369 Encoding & Multi-Dimensional Projection Types
 *
 * Strongly typed deterministic structures for controlled Internet capture,
 * source allowlisting and restrictions, canonicalization, integrity verification,
 * 369 ternary encoding/decoding, BigInt numeric states, spatial coordinates,
 * lower- and higher-dimensional projections, dimensional information states,
 * provenance tracing, closure encapsulation, binary serialization, reconstruction,
 * deterministic replay, and collision verification across Z1..Z16.
 */

// ─── Enums & Classifications ────────────────────────────────────────────────

export type CaptureStatus =
  | 'CAPTURED'
  | 'CAPTURE_REJECTED'
  | 'CAPTURE_SKIPPED'
  | 'CAPTURE_TRUNCATED'
  | 'CAPTURE_FAILED';

export type CaptureSourceType =
  | 'ALLOWLISTED_PUBLIC_WEB'
  | 'STANDARDS_DOCUMENT'
  | 'TECHNICAL_SPEC'
  | 'SCHEMA_REPOSITORY'
  | 'TAXONOMY_ARCHIVE';

export type ProjectionDirection =
  | 'LOWER_DIMENSIONAL'
  | 'HIGHER_DIMENSIONAL'
  | 'SAME_DIMENSIONAL';

export type ProjectionStrategy =
  | 'COORDINATE_TRUNCATION'
  | 'AXIS_FOLDING'
  | 'DIMENSIONAL_EXPANSION'
  | 'CANONICAL_ISOMORPHISM';

export type TernarySymbol369 = '3' | '6' | '9';

// ─── 1. Controlled Capture & Source Metadata ────────────────────────────────

export interface CaptureRestriction {
  readonly allowlistedDomains: readonly string[];
  readonly maxDocuments: number;
  readonly maxCrawlDepth: number;
  readonly maxPayloadBytes: number;
  readonly maxRequestsPerSecond: number;
  readonly disallowAuthBypass: boolean;
  readonly disallowPrivateResources: boolean;
  readonly disallowUnrestrictedCrawling: boolean;
}

export interface CapturePolicy {
  readonly policyId: string;
  readonly name: string;
  readonly restrictions: CaptureRestriction;
  readonly userAgent: string;
  readonly enforceChecksumIntegrity: boolean;
  readonly creationOrder: number;
}

export interface SourceMetadata {
  readonly sourceId: string;
  readonly sourceDomain: string;
  readonly sourceUrl: string;
  readonly normalizedUrl: string;
  readonly sourceType: CaptureSourceType;
  readonly contentType: string;
  readonly title: string;
  readonly depth: number;
  readonly observedTimestampIso: string;
  readonly isAllowlisted: boolean;
}

export interface CaptureRequest {
  readonly requestId: string;
  readonly targetUrl: string;
  readonly expectedDomain: string;
  readonly depth: number;
  readonly policy: CapturePolicy;
  readonly simulatedResponseData?: {
    readonly statusCode: number;
    readonly headers: Record<string, string>;
    readonly body: string;
  };
}

export interface CaptureResponse {
  readonly responseId: string;
  readonly requestId: string;
  readonly status: CaptureStatus;
  readonly statusCode: number;
  readonly rawPayload: string;
  readonly payloadBytes: number;
  readonly rejectionReason?: string;
  readonly sourceMetadata: SourceMetadata;
}

export interface CapturedDocument<V = any> {
  readonly documentId: string;
  readonly source: SourceMetadata;
  readonly status: CaptureStatus;
  readonly rawText: string;
  readonly structuredData: V;
  readonly byteLength: number;
  readonly payloadChecksum: string;
  readonly capturePolicyId: string;
  readonly creationOrder: number;
}

export interface CapturedRecord<V = any> {
  readonly recordId: string;
  readonly documentId: string;
  readonly recordKey: string;
  readonly category: string;
  readonly rawValue: V;
  readonly payloadChecksum: string;
  readonly dimension: number;
  readonly creationOrder: number;
}

// ─── 2. Canonicalization & Integrity ────────────────────────────────────────

export interface CanonicalDocument<V = any> {
  readonly canonicalId: string;
  readonly document: CapturedDocument<V>;
  readonly canonicalText: string;
  readonly canonicalJson: string;
  readonly canonicalChecksum: string;
  readonly canonicalByteLength: number;
}

export interface CanonicalRecord<V = any> {
  readonly canonicalRecordId: string;
  readonly record: CapturedRecord<V>;
  readonly canonicalJson: string;
  readonly canonicalChecksum: string;
  readonly canonicalByteLength: number;
}

export interface IntegrityRecord {
  readonly integrityId: string;
  readonly recordId: string;
  readonly payloadChecksum: string;
  readonly canonicalChecksum: string;
  readonly isValid: boolean;
  readonly failureReason?: string;
  readonly byteLength: number;
}

export interface CaptureError {
  readonly errorId: string;
  readonly targetUrl: string;
  readonly reason: string;
  readonly restrictionViolated?: keyof CaptureRestriction;
  readonly timestampIso: string;
}

export interface CaptureStatistics {
  readonly totalRequested: number;
  readonly totalCaptured: number;
  readonly totalRejected: number;
  readonly totalSkipped: number;
  readonly totalPayloadBytes: number;
  readonly totalCanonicalBytes: number;
  readonly averageByteRatio: number;
  readonly domainsAccessed: readonly string[];
}

// ─── 3. 369 Encoding, Numeric States & Coordinates ──────────────────────────

export interface TernarySequence369 {
  readonly sequenceId: string;
  readonly symbols: string;
  readonly symbolCount: number;
  readonly sourceByteLength: number;
  readonly sourceChecksum: string;
}

export interface NumericState369 {
  readonly numericStateId: string;
  readonly dimension: number;
  readonly ternaryValueBigIntString: string;
  readonly symbolCount: number;
  readonly checksum: string;
}

export interface InformationCoordinate {
  readonly coordinateId: string;
  readonly dimension: number;
  readonly axisValues: readonly number[];
  readonly formattedCoordinate: string;
  readonly anchor: string;
  readonly context: string;
}

// ─── 4. Dimensional Projections (Lower & Higher) ────────────────────────────

export interface DimensionalTransform {
  readonly transformId: string;
  readonly sourceDimension: number;
  readonly targetDimension: number;
  readonly direction: ProjectionDirection;
  readonly strategy: ProjectionStrategy;
  readonly preservedFields: readonly string[];
  readonly transformedFields: readonly string[];
  readonly discardedFields: readonly string[];
  readonly informationLossDetected: boolean;
  readonly description: string;
}

export interface LowerDimensionalProjection {
  readonly projectionId: string;
  readonly sourceDimension: number;
  readonly targetDimension: number;
  readonly originalCoordinate: InformationCoordinate;
  readonly projectedCoordinate: InformationCoordinate;
  readonly transform: DimensionalTransform;
  readonly payloadChecksum: string;
  readonly preservedInvariantChecksum: string;
}

export interface HigherDimensionalProjection {
  readonly projectionId: string;
  readonly sourceDimension: number;
  readonly targetDimension: number;
  readonly originalCoordinate: InformationCoordinate;
  readonly projectedCoordinate: InformationCoordinate;
  readonly transform: DimensionalTransform;
  readonly derivedAxes: readonly {
    readonly axisIndex: number;
    readonly axisValue: number;
    readonly label: 'DERIVED' | 'PROJECTED';
    readonly derivationFormula: string;
  }[];
  readonly payloadChecksum: string;
}

export interface DimensionalProjection {
  readonly projectionId: string;
  readonly direction: ProjectionDirection;
  readonly lowerProjection?: LowerDimensionalProjection;
  readonly higherProjection?: HigherDimensionalProjection;
  readonly sourceDimension: number;
  readonly targetDimension: number;
  readonly payloadChecksum: string;
}

// ─── 5. Information State & Provenance ──────────────────────────────────────

export interface DimensionalInformationState<V = any> {
  readonly stateId: string;
  readonly dimension: number;
  readonly universeId: string;
  readonly record: CapturedRecord<V>;
  readonly canonicalRecord: CanonicalRecord<V>;
  readonly integrity: IntegrityRecord;
  readonly sequence369: TernarySequence369;
  readonly numericState: NumericState369;
  readonly coordinate: InformationCoordinate;
  readonly payloadChecksum: string;
  readonly creationOrder: number;
}

export interface CaptureProvenance {
  readonly provenanceId: string;
  readonly stateId: string;
  readonly sourceUrl: string;
  readonly sourceDomain: string;
  readonly sourceRecordId: string;
  readonly capturePolicyId: string;
  readonly rawPayloadChecksum: string;
  readonly canonicalChecksum: string;
  readonly sequenceId: string;
  readonly numericStateId: string;
  readonly coordinateId: string;
  readonly dimension: number;
  readonly lineage: readonly string[];
}

// ─── 6. Capture Closure, Serialization & Replay ─────────────────────────────

export interface CaptureClosure<V = any> {
  readonly closureId: string;
  readonly dimension: number;
  readonly universeId: string;
  readonly policy: CapturePolicy;
  readonly documents: Readonly<Record<string, CapturedDocument<V>>>;
  readonly records: Readonly<Record<string, CapturedRecord<V>>>;
  readonly canonicalRecords: Readonly<Record<string, CanonicalRecord<V>>>;
  readonly integrityRecords: Readonly<Record<string, IntegrityRecord>>;
  readonly informationStates: Readonly<Record<string, DimensionalInformationState<V>>>;
  readonly lowerProjections: Readonly<Record<string, LowerDimensionalProjection>>;
  readonly higherProjections: Readonly<Record<string, HigherDimensionalProjection>>;
  readonly provenances: Readonly<Record<string, CaptureProvenance>>;
  readonly statistics: CaptureStatistics;
  readonly errors: readonly CaptureError[];
  readonly isClosureComplete: boolean;
  readonly fullClosureLineage: readonly string[];
  readonly shannonReferenceCapacityBigIntString: string;
  readonly creationOrder: number;
}

export interface CaptureSerializationPayload<V = any> {
  readonly format: '44_INTERNET_DATA_CAPTURE_CLOSURE_V1';
  readonly closureId: string;
  readonly dimension: number;
  readonly universeId: string;
  readonly totalDocuments: number;
  readonly totalRecords: number;
  readonly totalInformationStates: number;
  readonly totalLowerProjections: number;
  readonly totalHigherProjections: number;
  readonly documents: readonly {
    readonly documentId: string;
    readonly sourceUrl: string;
    readonly sourceDomain: string;
    readonly status: CaptureStatus;
    readonly payloadChecksum: string;
    readonly byteLength: number;
  }[];
  readonly records: readonly {
    readonly recordId: string;
    readonly documentId: string;
    readonly recordKey: string;
    readonly category: string;
    readonly payloadChecksum: string;
    readonly value: V;
  }[];
  readonly informationStates: readonly {
    readonly stateId: string;
    readonly dimension: number;
    readonly formattedCoordinate: string;
    readonly sequence369: string;
    readonly numericStateBigIntString: string;
    readonly payloadChecksum: string;
  }[];
  readonly lowerProjections: readonly {
    readonly projectionId: string;
    readonly sourceDimension: number;
    readonly targetDimension: number;
    readonly formattedProjectedCoord: string;
    readonly payloadChecksum: string;
  }[];
  readonly higherProjections: readonly {
    readonly projectionId: string;
    readonly sourceDimension: number;
    readonly targetDimension: number;
    readonly formattedProjectedCoord: string;
    readonly payloadChecksum: string;
  }[];
  readonly statistics: CaptureStatistics;
  readonly isClosureComplete: boolean;
  readonly fullClosureLineage: readonly string[];
  readonly creationOrder: number;
}

export interface CaptureEqualityComparison {
  readonly closureIdMatch: boolean;
  readonly universeIdMatch: boolean;
  readonly documentCountMatch: boolean;
  readonly recordCountMatch: boolean;
  readonly stateCountMatch: boolean;
  readonly lowerProjectionCountMatch: boolean;
  readonly higherProjectionCountMatch: boolean;
  readonly documentsMatch: boolean;
  readonly recordsMatch: boolean;
  readonly statesMatch: boolean;
  readonly isExactMatch: boolean;
}

// ─── 7. Collision & Determinism Records ──────────────────────────────────────

export interface F44CollisionRecord {
  readonly totalConfigurations: number;
  readonly uniqueCaptureIds: number;
  readonly uniqueDocIds: number;
  readonly uniqueRecordIds: number;
  readonly uniqueSourceIds: number;
  readonly uniqueCanonicalIds: number;
  readonly uniqueIntegrityIds: number;
  readonly uniqueSequenceIds: number;
  readonly uniqueNumericStateIds: number;
  readonly uniqueCoordinateIds: number;
  readonly uniqueLowerProjIds: number;
  readonly uniqueHigherProjIds: number;
  readonly uniqueStateIds: number;
  readonly uniqueProvenanceIds: number;
  readonly uniqueClosureIds: number;
  readonly captureCollisions: number;
  readonly docCollisions: number;
  readonly recordCollisions: number;
  readonly sourceCollisions: number;
  readonly canonicalCollisions: number;
  readonly integrityCollisions: number;
  readonly sequenceCollisions: number;
  readonly numericStateCollisions: number;
  readonly coordinateCollisions: number;
  readonly lowerProjCollisions: number;
  readonly higherProjCollisions: number;
  readonly stateCollisions: number;
  readonly provenanceCollisions: number;
  readonly closureCollisions: number;
  readonly serializedCollisions: number;
}

export interface F44DeterminismRecord {
  readonly trials: number;
  readonly dimension: number;
  readonly universeId: string;
  readonly closureId: string;
  readonly serializedBytes: number;
  readonly variance: number;
  readonly allIdentical: boolean;
}

export interface F44TestResult {
  readonly testId: string;
  readonly name: string;
  readonly passed: boolean;
  readonly details: string;
  readonly durationMs: number;
  readonly totalEvaluations?: number;
  readonly collisions?: number;
  readonly variance?: number;
  readonly fullBytes?: number;
  readonly sharedBytes?: number;
  readonly byteSavings?: number;
  readonly ratio?: number;
}

export interface F44SuiteReport {
  readonly suiteName: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly allPassed: boolean;
  readonly totalDurationMs: number;
  readonly results: readonly F44TestResult[];
}
