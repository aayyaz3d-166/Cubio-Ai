/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-18: In-Memory Observability Repository
 */

import {
  AuditLogEntry,
  TraceSpan,
  NetworkMetricRecord,
  AuditQueryOptions,
} from '../types';
import { IObservabilityRepository } from './types';

export class MemoryObservabilityRepository implements IObservabilityRepository {
  private auditEntries: AuditLogEntry[] = [];
  private auditEntriesById: Map<string, AuditLogEntry> = new Map();
  private spansById: Map<string, TraceSpan> = new Map();
  private spansByTrace: Map<string, TraceSpan[]> = new Map();
  private metrics: NetworkMetricRecord[] = [];

  // --- AUDIT LOGS ---

  public async saveAuditEntry(entry: AuditLogEntry): Promise<void> {
    const frozen = Object.freeze({ ...entry });
    const existingIdx = this.auditEntries.findIndex((e) => e.entryId === entry.entryId);
    if (existingIdx >= 0) {
      this.auditEntries[existingIdx] = frozen;
    } else {
      this.auditEntries.push(frozen);
    }
    this.auditEntriesById.set(entry.entryId, frozen);
  }

  public async getAuditEntry(entryId: string): Promise<AuditLogEntry | undefined> {
    return this.auditEntriesById.get(entryId);
  }

  public async getLatestAuditEntry(): Promise<AuditLogEntry | undefined> {
    if (this.auditEntries.length === 0) return undefined;
    return this.auditEntries[this.auditEntries.length - 1];
  }

  public async listAllAuditEntries(): Promise<readonly AuditLogEntry[]> {
    return Object.freeze([...this.auditEntries]);
  }

  public async queryAuditLogs(options: AuditQueryOptions = {}): Promise<readonly AuditLogEntry[]> {
    let filtered = this.auditEntries;

    if (options.callerCubId) {
      filtered = filtered.filter((e) => e.callerCubId === options.callerCubId);
    }
    if (options.category) {
      filtered = filtered.filter((e) => e.category === options.category);
    }
    if (options.severity) {
      filtered = filtered.filter((e) => e.severity === options.severity);
    }
    if (options.status) {
      filtered = filtered.filter((e) => e.status === options.status);
    }
    if (options.fromTimestamp !== undefined) {
      filtered = filtered.filter((e) => e.timestamp >= options.fromTimestamp!);
    }
    if (options.toTimestamp !== undefined) {
      filtered = filtered.filter((e) => e.timestamp <= options.toTimestamp!);
    }

    if (options.limit && options.limit > 0) {
      filtered = filtered.slice(-options.limit);
    }

    return Object.freeze([...filtered]);
  }

  public async pruneAuditLogs(retentionCutoff: number): Promise<number> {
    const beforeCount = this.auditEntries.length;
    this.auditEntries = this.auditEntries.filter((e) => e.timestamp >= retentionCutoff);
    this.auditEntriesById.clear();
    for (const e of this.auditEntries) {
      this.auditEntriesById.set(e.entryId, e);
    }
    return beforeCount - this.auditEntries.length;
  }

  // --- SPANS & TRACES ---

  public async saveSpan(span: TraceSpan): Promise<void> {
    const frozen = Object.freeze({ ...span });
    this.spansById.set(span.spanId, frozen);

    let traceSpans = this.spansByTrace.get(span.traceId);
    if (!traceSpans) {
      traceSpans = [];
      this.spansByTrace.set(span.traceId, traceSpans);
    }
    const idx = traceSpans.findIndex((s) => s.spanId === span.spanId);
    if (idx >= 0) {
      traceSpans[idx] = frozen;
    } else {
      traceSpans.push(frozen);
    }
  }

  public async getSpan(spanId: string): Promise<TraceSpan | undefined> {
    return this.spansById.get(spanId);
  }

  public async getSpansByTrace(traceId: string): Promise<readonly TraceSpan[]> {
    return Object.freeze([...(this.spansByTrace.get(traceId) || [])]);
  }

  public async listAllSpans(): Promise<readonly TraceSpan[]> {
    return Object.freeze(Array.from(this.spansById.values()));
  }

  // --- METRICS ---

  public async recordMetric(metric: NetworkMetricRecord): Promise<void> {
    this.metrics.push(Object.freeze({ ...metric }));
  }

  public async queryMetrics(
    metricName: string,
    fromTimestamp?: number
  ): Promise<readonly NetworkMetricRecord[]> {
    let filtered = this.metrics.filter((m) => m.metricName === metricName);
    if (fromTimestamp !== undefined) {
      filtered = filtered.filter((m) => m.timestamp >= fromTimestamp);
    }
    return Object.freeze([...filtered]);
  }

  public async listAllMetrics(): Promise<readonly NetworkMetricRecord[]> {
    return Object.freeze([...this.metrics]);
  }
}
