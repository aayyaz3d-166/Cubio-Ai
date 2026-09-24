/**
 * CUBiO AI — Task 192: Native Knowledge Contradiction Detection and Resolution
 * src/cubio/model/native_knowledge_contradiction/quarantineStore.ts
 *
 * Isolated In-Memory Quarantine Registry:
 * Holds conflicted, unresolved knowledge records in explicit CONTRADICTION_QUARANTINED state.
 * Strictly partitioned by tenant. Zero silent overwrites.
 */

import * as crypto from 'crypto';
import {
  ConflictRecord,
  QuarantineRecord,
  KnowledgeContradictionTenantViolationError,
} from './types';

export class QuarantineStore {
  // Tenant -> Map<quarantineId, QuarantineRecord>
  private static readonly registries = new Map<string, Map<string, QuarantineRecord>>();

  /**
   * Registers a detected, unresolved conflict into quarantine.
   */
  public static register(conflict: ConflictRecord, reasonNotes?: string): QuarantineRecord {
    const tenantReg = this.getOrCreateTenantRegistry(conflict.tenantId);

    const conflictingPayloadStr = JSON.stringify(conflict.records);
    const checksum = crypto
      .createHash('sha256')
      .update(`${conflict.conflictType}:::${conflictingPayloadStr}`)
      .digest('hex');

    const quarantineId = `QUARANTINE-${checksum.slice(0, 16)}`;

    const quarantineRecord: QuarantineRecord = {
      quarantineId,
      tenantId: conflict.tenantId,
      conflictType: conflict.conflictType,
      conflictingRecordIds: [...conflict.conflictingRecordIds],
      conflictingRecords: conflict.records,
      quarantineState: 'CONTRADICTION_QUARANTINED',
      reason: reasonNotes ? `${conflict.reason} | ${reasonNotes}` : conflict.reason,
      checksum,
      quarantinedAt: 1000,
    };

    tenantReg.set(quarantineId, quarantineRecord);
    return quarantineRecord;
  }

  /**
   * Retrieves a quarantine record by ID with tenant isolation.
   */
  public static get(quarantineId: string, tenantId: string): QuarantineRecord | undefined {
    const tenantReg = this.registries.get(tenantId);
    if (!tenantReg) return undefined;
    return tenantReg.get(quarantineId);
  }

  /**
   * Lists all quarantined records for a tenant.
   */
  public static list(tenantId: string): readonly QuarantineRecord[] {
    const tenantReg = this.registries.get(tenantId);
    if (!tenantReg) return [];
    return Array.from(tenantReg.values());
  }

  /**
   * Checks whether a specific record ID is currently locked in quarantine.
   */
  public static isRecordQuarantined(recordId: string, tenantId: string): boolean {
    const tenantReg = this.registries.get(tenantId);
    if (!tenantReg) return false;

    for (const q of tenantReg.values()) {
      if (q.conflictingRecordIds.includes(recordId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns count of quarantined records for a tenant.
   */
  public static count(tenantId: string): number {
    const tenantReg = this.registries.get(tenantId);
    return tenantReg ? tenantReg.size : 0;
  }

  /**
   * Computes a deterministic SHA-256 digest of the quarantine state for a tenant.
   */
  public static computeDigest(tenantId: string): string {
    const records = this.list(tenantId);
    const sorted = [...records].sort((a, b) => a.quarantineId.localeCompare(b.quarantineId));
    const serialized = sorted
      .map(
        (r) =>
          `${r.quarantineId}:${r.conflictType}:${r.checksum}:${r.conflictingRecordIds.join(',')}`
      )
      .join('||');

    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Resets the registry for a specific tenant (or all for testing).
   */
  public static reset(tenantId?: string): void {
    if (tenantId) {
      this.registries.delete(tenantId);
    } else {
      this.registries.clear();
    }
  }

  private static getOrCreateTenantRegistry(tenantId: string): Map<string, QuarantineRecord> {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new KnowledgeContradictionTenantViolationError('Tenant ID cannot be empty');
    }
    let reg = this.registries.get(tenantId);
    if (!reg) {
      reg = new Map<string, QuarantineRecord>();
      this.registries.set(tenantId, reg);
    }
    return reg;
  }
}
