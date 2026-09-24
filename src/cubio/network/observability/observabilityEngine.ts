/**
 * CubiO — Universal Spatial Operating Environment
 * Pipeline NET-18: Master Observability, Audit & Distributed Tracing Engine
 *
 * Implements tamper-resistant cryptographic audit logging,
 * distributed request tracing (spans & traces), and real-time network metrics.
 *
 * CRITICAL ARCHITECTURAL INVARIANT:
 * - Audit logs are chained via deterministic Merkle links (previousHash + contentHash) to guarantee tamper-evidence.
 * - Audit access is strictly governed by NET-03 authorization (AUDIT_READ, AUDIT_ADMIN).
 * - Regular users can only query their own sovereign audit records; SUPER_ADMIN can inspect cluster-wide logs.
 */

import { deterministicHash } from '../../state/determinism';
import { CubiOIdentityRegistry } from '../identity/identityRegistry';
import { CubiOAuthEngine } from '../auth/authEngine';
import { CubiOPolicyEngine } from '../authz/policyEngine';
import { CubiORoleManager } from '../authz/roleManager';
import {
  AuditLogEntry,
  TraceSpan,
  NetworkMetricRecord,
  AuditQueryOptions,
  MetricsSummary,
  AuditActionCategory,
  AuditSeverity,
  MetricType,
} from './types';
import { IObservabilityRepository } from './repositories/types';
import { MemoryObservabilityRepository } from './repositories/memoryRepositories';

export class CubiOObservabilityEngine {
  private repository: IObservabilityRepository;
  private identityRegistry?: CubiOIdentityRegistry;
  private authEngine?: CubiOAuthEngine;
  private policyEngine?: CubiOPolicyEngine;
  private roleManager?: CubiORoleManager;

  private currentSequence = 0;
  private genesisHash = '00000000000000000000000000000000';

  constructor(options: {
    repository?: IObservabilityRepository;
    identityRegistry?: CubiOIdentityRegistry;
    authEngine?: CubiOAuthEngine;
    policyEngine?: CubiOPolicyEngine;
    roleManager?: CubiORoleManager;
  } = {}) {
    this.repository = options.repository || new MemoryObservabilityRepository();
    this.identityRegistry = options.identityRegistry;
    this.authEngine = options.authEngine;
    this.policyEngine = options.policyEngine;
    this.roleManager = options.roleManager;
  }

  public getRepository(): IObservabilityRepository {
    return this.repository;
  }

  /**
   * Helper: Authenticates session / token and extracts sovereign caller CUB-ID.
   */
  public async authenticateCaller(tokenOrSession: string): Promise<string> {
    if (tokenOrSession.startsWith('CUB-')) {
      return tokenOrSession;
    }

    if (!this.authEngine) {
      throw new Error('Authentication engine not configured in ObservabilityEngine.');
    }

    let verification;
    if (tokenOrSession.startsWith('CUBTOK.')) {
      verification = await this.authEngine.verifyToken(tokenOrSession);
    } else {
      verification = await this.authEngine.verifySession(tokenOrSession);
    }

    if (!verification.isValid || !verification.identity) {
      throw new Error(`Observability Authentication failed: ${verification.error || 'Invalid session'}`);
    }

    return verification.identity.cubId;
  }

  // ==========================================================================
  // AUDIT LOGGING & TAMPER-RESISTANCE
  // ==========================================================================

  /**
   * Records an immutable, cryptographically chained audit log entry.
   */
  public async recordAudit(input: {
    callerCubId: string;
    category: AuditActionCategory;
    action: string;
    resourceUri: string;
    severity?: AuditSeverity;
    status?: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
    details?: Record<string, any>;
    traceId?: string;
  }): Promise<Readonly<AuditLogEntry>> {
    const latest = await this.repository.getLatestAuditEntry();
    const previousHash = latest ? latest.entryHash : this.genesisHash;
    this.currentSequence = latest ? latest.sequence + 1 : this.currentSequence + 1;

    const now = Date.now();
    const entryId = `AUD_${deterministicHash(`${previousHash}:${this.currentSequence}:${now}`).slice(2, 18)}`;
    const severity: AuditSeverity = input.severity || 'INFO';
    const status = input.status || 'SUCCESS';
    const details = Object.freeze({ ...(input.details || {}) });

    const contentForHash = `${previousHash}:${this.currentSequence}:${input.callerCubId}:${input.category}:${input.action}:${status}:${now}`;
    const entryHash = `HASH_${deterministicHash(contentForHash).slice(2, 26)}`;

    const entry: AuditLogEntry = Object.freeze({
      entryId,
      sequence: this.currentSequence,
      timestamp: now,
      callerCubId: input.callerCubId,
      category: input.category,
      action: input.action,
      resourceUri: input.resourceUri,
      severity,
      status,
      details,
      traceId: input.traceId,
      previousHash,
      entryHash,
    });

    await this.repository.saveAuditEntry(entry);
    return entry;
  }

  /**
   * Queries audit logs with strict privacy and authorization boundaries.
   */
  public async queryAudit(
    tokenOrSession: string,
    options: AuditQueryOptions = {}
  ): Promise<readonly AuditLogEntry[]> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);
    const callerRole = this.roleManager ? this.roleManager.getRole(callerCubId) : 'CONTRIBUTOR';
    const isAdmin = callerRole === 'SUPER_ADMIN' || (this.roleManager?.hasPermission(callerRole, 'AUDIT_ADMIN') ?? false);

    // Regular users can only query their own audit logs
    const effectiveOptions: AuditQueryOptions = isAdmin
      ? options
      : { ...options, callerCubId };

    return this.repository.queryAuditLogs(effectiveOptions);
  }

  /**
   * Verifies the cryptographic integrity of the entire audit hash chain.
   */
  public async verifyAuditChainIntegrity(): Promise<{
    isValid: boolean;
    brokenAtSequence?: number;
    totalChecked: number;
  }> {
    const entries = await this.repository.listAllAuditEntries();
    if (entries.length === 0) {
      return { isValid: true, totalChecked: 0 };
    }

    let expectedPrevHash = this.genesisHash;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // 1. Check previousHash link
      if (entry.previousHash !== expectedPrevHash) {
        return {
          isValid: false,
          brokenAtSequence: entry.sequence,
          totalChecked: i,
        };
      }

      // 2. Recompute expected entry hash
      const contentForHash = `${entry.previousHash}:${entry.sequence}:${entry.callerCubId}:${entry.category}:${entry.action}:${entry.status}:${entry.timestamp}`;
      const recomputedHash = `HASH_${deterministicHash(contentForHash).slice(2, 26)}`;

      if (entry.entryHash !== recomputedHash) {
        return {
          isValid: false,
          brokenAtSequence: entry.sequence,
          totalChecked: i,
        };
      }

      expectedPrevHash = entry.entryHash;
    }

    return { isValid: true, totalChecked: entries.length };
  }

  // ==========================================================================
  // DISTRIBUTED TRACING (SPANS & TRACES)
  // ==========================================================================

  /**
   * Starts a new distributed trace span.
   */
  public async startSpan(
    operationName: string,
    subsystem: string,
    options: {
      traceId?: string;
      parentSpanId?: string;
      tags?: Record<string, string>;
    } = {}
  ): Promise<Readonly<TraceSpan>> {
    const now = Date.now();
    const traceId = options.traceId || `TRC_${deterministicHash(`${operationName}:${now}`).slice(2, 18)}`;
    const spanId = `SPN_${deterministicHash(`${traceId}:${operationName}:${now}`).slice(2, 18)}`;

    const span: TraceSpan = Object.freeze({
      traceId,
      spanId,
      parentSpanId: options.parentSpanId,
      operationName: operationName.trim(),
      subsystem: subsystem.trim().toUpperCase(),
      startTime: now,
      status: 'OK',
      tags: Object.freeze({ ...(options.tags || {}) }),
      events: Object.freeze([]),
    });

    await this.repository.saveSpan(span);
    return span;
  }

  /**
   * Ends an active trace span, computing duration.
   */
  public async endSpan(
    spanId: string,
    status: 'OK' | 'ERROR' = 'OK',
    tags: Record<string, string> = {}
  ): Promise<Readonly<TraceSpan>> {
    const span = await this.repository.getSpan(spanId);
    if (!span) {
      throw new Error(`Trace Error: Span '${spanId}' not found.`);
    }

    const now = Date.now();
    const durationMs = Math.max(0, now - span.startTime);

    const completed: TraceSpan = Object.freeze({
      ...span,
      endTime: now,
      durationMs,
      status,
      tags: Object.freeze({ ...span.tags, ...tags }),
    });

    await this.repository.saveSpan(completed);
    return completed;
  }

  /**
   * Retrieves all spans associated with a trace.
   */
  public async getTraceSpans(traceId: string): Promise<readonly TraceSpan[]> {
    return this.repository.getSpansByTrace(traceId);
  }

  // ==========================================================================
  // METRICS COLLECTION
  // ==========================================================================

  /**
   * Records a network time-series metric.
   */
  public async recordMetric(
    metricName: string,
    metricType: MetricType,
    value: number,
    subsystem: string,
    unit: string = 'count',
    tags: Record<string, string> = {}
  ): Promise<Readonly<NetworkMetricRecord>> {
    const record: NetworkMetricRecord = Object.freeze({
      metricName: metricName.trim(),
      metricType,
      value,
      unit: unit.trim(),
      subsystem: subsystem.trim().toUpperCase(),
      timestamp: Date.now(),
      tags: Object.freeze({ ...tags }),
    });

    await this.repository.recordMetric(record);
    return record;
  }

  /**
   * Retrieves system observability summary.
   */
  public async getMetricsSummary(subsystem?: string): Promise<MetricsSummary> {
    const auditEntries = await this.repository.listAllAuditEntries();
    const spans = await this.repository.listAllSpans();
    const metrics = await this.repository.listAllMetrics();
    const integrity = await this.verifyAuditChainIntegrity();

    const uniqueTraces = new Set(spans.map((s) => s.traceId));

    return Object.freeze({
      totalAuditEntries: auditEntries.length,
      totalSpans: spans.length,
      totalMetrics: metrics.length,
      activeTraces: uniqueTraces.size,
      auditChainLength: auditEntries.length,
      chainIntegrityValid: integrity.isValid,
    });
  }

  /**
   * Prunes audit logs older than retention cutoff (Admin only).
   */
  public async applyRetentionPolicy(
    tokenOrSession: string,
    maxAgeDays: number
  ): Promise<{ prunedCount: number; remainingCount: number }> {
    const callerCubId = await this.authenticateCaller(tokenOrSession);

    if (this.policyEngine) {
      const decision = this.policyEngine.evaluate({
        cubId: callerCubId,
        action: 'AUDIT_ADMIN',
        resourceUri: 'CUBIO://NETWORK/0/01/00000/AUDIT',
      });
      if (!decision.allowed) {
        throw new Error(`Authorization Denied: Identity '${callerCubId}' lacks permission 'AUDIT_ADMIN'.`);
      }
    }

    const cutoff = Date.now() - maxAgeDays * 86400000;
    const prunedCount = await this.repository.pruneAuditLogs(cutoff);
    const remaining = await this.repository.listAllAuditEntries();

    return { prunedCount, remainingCount: remaining.length };
  }
}
