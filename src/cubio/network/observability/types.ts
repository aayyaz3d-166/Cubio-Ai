/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-18: CubiO Observability / Audit Network (Types & Models)
 *
 * Master specification for tamper-resistant cryptographic audit logging,
 * distributed request tracing (spans & traces), and real-time network metrics.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Audit logs are chained via SHA-256 Merkle links (previousHash + contentHash) to guarantee tamper-evidence.
 * - Audit access is strictly governed by NET-03 authorization (AUDIT_READ, AUDIT_ADMIN).
 * - Regular users can only query their own sovereign audit records; SUPER_ADMIN can inspect cluster-wide logs.
 */

export type AuditSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'SECURITY_ALERT';

export type AuditActionCategory =
  | 'AUTH'
  | 'AUTHZ'
  | 'IDENTITY'
  | 'STORAGE'
  | 'SERVICE'
  | 'DEVICE'
  | 'AGENT'
  | 'FILE'
  | 'SEARCH'
  | 'EVENT'
  | 'GATEWAY'
  | 'FEDERATION'
  | 'SYSTEM';

export interface AuditLogEntry {
  readonly entryId: string; // AUD_...
  readonly sequence: number; // 1, 2, 3...
  readonly timestamp: number;
  readonly callerCubId: string; // Sovereign CUB-XXXXXXXX or "SYSTEM"
  readonly category: AuditActionCategory;
  readonly action: string; // e.g. "AUTH_LOGIN_SUCCESS", "AUTHZ_DENIED", "FILE_UPLOAD", "FEDERATION_HANDSHAKE"
  readonly resourceUri: string;
  readonly severity: AuditSeverity;
  readonly status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  readonly details: Readonly<Record<string, any>>;
  readonly traceId?: string;
  readonly previousHash: string; // SHA-256 hash of previous entry (Genesis: "00000000000000000000000000000000")
  readonly entryHash: string; // SHA-256 hash of current entry content + previousHash
}

export interface TraceSpan {
  readonly traceId: string; // TRC_...
  readonly spanId: string; // SPN_...
  readonly parentSpanId?: string;
  readonly operationName: string;
  readonly subsystem: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly durationMs?: number;
  readonly status: 'OK' | 'ERROR';
  readonly tags: Readonly<Record<string, string>>;
  readonly events: readonly { name: string; timestamp: number; data?: any }[];
}

export type MetricType = 'COUNTER' | 'GAUGE' | 'HISTOGRAM';

export interface NetworkMetricRecord {
  readonly metricName: string;
  readonly metricType: MetricType;
  readonly value: number;
  readonly unit: string;
  readonly subsystem: string;
  readonly timestamp: number;
  readonly tags?: Readonly<Record<string, string>>;
}

export interface AuditQueryOptions {
  readonly callerCubId?: string;
  readonly category?: AuditActionCategory;
  readonly severity?: AuditSeverity;
  readonly status?: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  readonly fromTimestamp?: number;
  readonly toTimestamp?: number;
  readonly limit?: number;
}

export interface MetricsSummary {
  readonly totalAuditEntries: number;
  readonly totalSpans: number;
  readonly totalMetrics: number;
  readonly activeTraces: number;
  readonly auditChainLength: number;
  readonly chainIntegrityValid: boolean;
}
