/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F78: Production Reality Audit Types & Contracts
 *
 * Covers 11 Production Reality Vectors:
 * DNS/TLS, Production Gateway, Provider Connectivity, Model Responses, Image Gen,
 * Voice Pipeline, Code Sandbox, Research Synthesis, Authentication, UI Bridge, Observability.
 */

export type ProductionRealityVector =
  | 'DNS_TLS'
  | 'PRODUCTION_GATEWAY'
  | 'PROVIDER_CONNECTIVITY'
  | 'MODEL_RESPONSES'
  | 'IMAGE_GENERATION'
  | 'VOICE_PIPELINE'
  | 'CODE_SANDBOX'
  | 'RESEARCH_SYNTHESIS'
  | 'AUTHENTICATION'
  | 'UI_BRIDGE'
  | 'OBSERVABILITY';

export interface ProductionRealityVectorResult {
  readonly vector: ProductionRealityVector;
  readonly name: string;
  readonly isOperational: boolean;
  readonly latencyMs: number;
  readonly proofDetail: string;
}

export interface ProductionRealityAuditReport {
  readonly auditId: string;
  readonly totalVectors: number;
  readonly operationalVectors: number;
  readonly isProductionRealityCertified: boolean;
  readonly overallLatencyP95Ms: number;
  readonly prometheusTelemetryExported: boolean;
  readonly openTelemetrySpansRecorded: number;
  readonly checksum: string;
  readonly timestamp: number;
  readonly vectors: readonly ProductionRealityVectorResult[];
}

export interface IProductionRealityAuditor {
  runProductionRealityAudit(): Promise<Readonly<ProductionRealityAuditReport>>;
}
