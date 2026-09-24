/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-18: Observability Repository Interfaces
 */

import {
  AuditLogEntry,
  TraceSpan,
  NetworkMetricRecord,
  AuditQueryOptions,
} from '../types';

export interface IObservabilityRepository {
  // Audit Logs
  saveAuditEntry(entry: AuditLogEntry): Promise<void>;
  getAuditEntry(entryId: string): Promise<AuditLogEntry | undefined>;
  getLatestAuditEntry(): Promise<AuditLogEntry | undefined>;
  listAllAuditEntries(): Promise<readonly AuditLogEntry[]>;
  queryAuditLogs(options?: AuditQueryOptions): Promise<readonly AuditLogEntry[]>;
  pruneAuditLogs(retentionCutoff: number): Promise<number>;

  // Spans & Traces
  saveSpan(span: TraceSpan): Promise<void>;
  getSpan(spanId: string): Promise<TraceSpan | undefined>;
  getSpansByTrace(traceId: string): Promise<readonly TraceSpan[]>;
  listAllSpans(): Promise<readonly TraceSpan[]>;

  // Metrics
  recordMetric(metric: NetworkMetricRecord): Promise<void>;
  queryMetrics(metricName: string, fromTimestamp?: number): Promise<readonly NetworkMetricRecord[]>;
  listAllMetrics(): Promise<readonly NetworkMetricRecord[]>;
}
