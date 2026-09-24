/**
 * CUBiO AI — Task 174: Hierarchical Context Memory
 * src/cubio/model/native_hierarchical_memory/hierarchicalStore.ts
 *
 * In-Memory Hierarchical Reference & Active Working Store:
 * - Strict multi-tenant isolation across all tiers.
 * - L1: Active materialized token entries resident in working memory.
 * - L2/L3: Zero-copy lightweight references (metadata, token counts, checksums, scores).
 * - OCC version checking on all mutations.
 */

import {
  MemoryLevel,
  HierarchicalReference,
  L1MaterializedEntry,
  HierarchicalMemoryTenantViolationError,
  HierarchicalMemoryOCCConflictError,
} from './types.js';

export class HierarchicalStore {
  // tenantId -> level -> referenceId -> HierarchicalReference
  private readonly referencesByTenant = new Map<string, Map<MemoryLevel, Map<string, HierarchicalReference>>>();

  // tenantId -> referenceId -> L1MaterializedEntry
  private readonly l1ActiveTokensByTenant = new Map<string, Map<string, L1MaterializedEntry>>();

  // tenantId -> referenceId -> current OCC version
  private readonly versionsByTenant = new Map<string, Map<string, number>>();

  private getTenantLevelMap(tenantId: string, level: MemoryLevel): Map<string, HierarchicalReference> {
    if (!this.referencesByTenant.has(tenantId)) {
      this.referencesByTenant.set(tenantId, new Map());
    }
    const levelMap = this.referencesByTenant.get(tenantId)!;
    if (!levelMap.has(level)) {
      levelMap.set(level, new Map());
    }
    return levelMap.get(level)!;
  }

  private getTenantL1Map(tenantId: string): Map<string, L1MaterializedEntry> {
    if (!this.l1ActiveTokensByTenant.has(tenantId)) {
      this.l1ActiveTokensByTenant.set(tenantId, new Map());
    }
    return this.l1ActiveTokensByTenant.get(tenantId)!;
  }

  private getTenantVersionMap(tenantId: string): Map<string, number> {
    if (!this.versionsByTenant.has(tenantId)) {
      this.versionsByTenant.set(tenantId, new Map());
    }
    return this.versionsByTenant.get(tenantId)!;
  }

  /**
   * Stores or updates a lightweight hierarchical reference in L2 or L3.
   * Performs OCC version checks if expectedVersion is supplied.
   */
  public putReference(
    reference: HierarchicalReference,
    callerTenantId: string,
    expectedVersion?: number
  ): HierarchicalReference {
    if (reference.tenantId !== callerTenantId) {
      throw new HierarchicalMemoryTenantViolationError(callerTenantId, reference.tenantId);
    }

    const versionMap = this.getTenantVersionMap(callerTenantId);
    const currentVer = versionMap.get(reference.referenceId) ?? 0;

    if (expectedVersion !== undefined && expectedVersion !== currentVer) {
      throw new HierarchicalMemoryOCCConflictError(reference.referenceId, expectedVersion, currentVer);
    }

    const nextVer = currentVer + 1;
    versionMap.set(reference.referenceId, nextVer);

    const updatedRef: HierarchicalReference = Object.freeze({
      ...reference,
      version: nextVer,
      lastAccessedTimestamp: new Date().toISOString(),
    });

    const levelMap = this.getTenantLevelMap(callerTenantId, reference.level);
    levelMap.set(reference.referenceId, updatedRef);

    return updatedRef;
  }

  /**
   * Retrieves a reference by ID from any tier for a given tenant.
   */
  public getReference(
    referenceId: string,
    callerTenantId: string
  ): HierarchicalReference | null {
    if (!this.referencesByTenant.has(callerTenantId)) {
      return null;
    }
    const levelMap = this.referencesByTenant.get(callerTenantId)!;
    for (const refs of levelMap.values()) {
      if (refs.has(referenceId)) {
        const ref = refs.get(referenceId)!;
        if (ref.tenantId !== callerTenantId) {
          throw new HierarchicalMemoryTenantViolationError(callerTenantId, ref.tenantId);
        }
        return ref;
      }
    }
    return null;
  }

  /**
   * Removes a reference from a specific level.
   */
  public removeReference(
    referenceId: string,
    level: MemoryLevel,
    callerTenantId: string
  ): boolean {
    const levelMap = this.getTenantLevelMap(callerTenantId, level);
    return levelMap.delete(referenceId);
  }

  /**
   * Returns all references stored at a given level for a tenant.
   */
  public getReferencesAtLevel(
    level: MemoryLevel,
    callerTenantId: string
  ): readonly HierarchicalReference[] {
    const levelMap = this.getTenantLevelMap(callerTenantId, level);
    return Array.from(levelMap.values());
  }

  /**
   * Materializes an active entry in L1 Local memory.
   */
  public setL1Entry(entry: L1MaterializedEntry, callerTenantId: string): void {
    if (entry.tenantId !== callerTenantId) {
      throw new HierarchicalMemoryTenantViolationError(callerTenantId, entry.tenantId);
    }
    const l1Map = this.getTenantL1Map(callerTenantId);
    l1Map.set(entry.referenceId, Object.freeze(entry));
  }

  /**
   * Retrieves an L1 materialized entry.
   */
  public getL1Entry(referenceId: string, callerTenantId: string): L1MaterializedEntry | null {
    const l1Map = this.getTenantL1Map(callerTenantId);
    const entry = l1Map.get(referenceId) ?? null;
    if (entry && entry.tenantId !== callerTenantId) {
      throw new HierarchicalMemoryTenantViolationError(callerTenantId, entry.tenantId);
    }
    return entry;
  }

  /**
   * Removes an L1 entry (e.g. on demotion or eviction).
   */
  public removeL1Entry(referenceId: string, callerTenantId: string): boolean {
    const l1Map = this.getTenantL1Map(callerTenantId);
    return l1Map.delete(referenceId);
  }

  /**
   * Returns all L1 materialized entries for a tenant.
   */
  public getAllL1Entries(callerTenantId: string): readonly L1MaterializedEntry[] {
    const l1Map = this.getTenantL1Map(callerTenantId);
    return Array.from(l1Map.values());
  }

  /**
   * Computes the current total active token count resident in L1.
   */
  public getL1TotalActiveTokens(callerTenantId: string): number {
    const entries = this.getAllL1Entries(callerTenantId);
    return entries.reduce((sum, e) => sum + e.tokenCount, 0);
  }

  /**
   * Returns current count of references stored at a given level.
   */
  public getCountAtLevel(level: MemoryLevel, callerTenantId: string): number {
    if (level === 'L1_LOCAL') {
      return this.getTenantL1Map(callerTenantId).size;
    }
    return this.getTenantLevelMap(callerTenantId, level).size;
  }

  /**
   * Clears all references and active tokens for testing or reset.
   */
  public clear(callerTenantId?: string): void {
    if (callerTenantId) {
      this.referencesByTenant.delete(callerTenantId);
      this.l1ActiveTokensByTenant.delete(callerTenantId);
      this.versionsByTenant.delete(callerTenantId);
    } else {
      this.referencesByTenant.clear(this.l1ActiveTokensByTenant.clear() as any);
      this.l1ActiveTokensByTenant.clear();
      this.versionsByTenant.clear();
    }
  }
}
