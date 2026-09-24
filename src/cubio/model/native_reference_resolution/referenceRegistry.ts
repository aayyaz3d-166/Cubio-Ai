/**
 * CUBiO AI — Task 178: Cross-Context Reference Resolution
 * src/cubio/model/native_reference_resolution/referenceRegistry.ts
 *
 * Lightweight In-Memory Reference Registry:
 * Tracks cross-context reference links and citations across context windows,
 * tiles, and segments without duplicating heavy payload text into working memory.
 *
 * STRICT INVARIANTS:
 * 1. Zero-copy metadata indexing; holds references, versions, and checksums only.
 * 2. Multi-tenant indexed isolation: queries partition strictly by tenantId.
 * 3. Deterministic lookup ordering by referenceId ascending.
 */

import {
  CrossContextReference,
  CrossTenantReferenceError,
} from './types.js';

export class ReferenceRegistry {
  private readonly referencesById = new Map<string, CrossContextReference>();
  private readonly referencesBySource = new Map<string, Set<string>>();
  private readonly referencesByTarget = new Map<string, Set<string>>();
  private readonly referencesByTenant = new Map<string, Set<string>>();

  /**
   * Register a cross-context reference.
   */
  public registerReference(ref: CrossContextReference): void {
    if (!ref.referenceId || !ref.sourceContextId || !ref.targetObjectId || !ref.tenantId) {
      throw new Error('[ReferenceRegistry] Missing required fields in CrossContextReference.');
    }

    this.referencesById.set(ref.referenceId, Object.freeze({ ...ref }));

    // Index by source context ID
    let srcSet = this.referencesBySource.get(ref.sourceContextId);
    if (!srcSet) {
      srcSet = new Set<string>();
      this.referencesBySource.set(ref.sourceContextId, srcSet);
    }
    srcSet.add(ref.referenceId);

    // Index by target object ID
    let targetSet = this.referencesByTarget.get(ref.targetObjectId);
    if (!targetSet) {
      targetSet = new Set<string>();
      this.referencesByTarget.set(ref.targetObjectId, targetSet);
    }
    targetSet.add(ref.referenceId);

    // Index by tenant ID
    let tenantSet = this.referencesByTenant.get(ref.tenantId);
    if (!tenantSet) {
      tenantSet = new Set<string>();
      this.referencesByTenant.set(ref.tenantId, tenantSet);
    }
    tenantSet.add(ref.referenceId);
  }

  /**
   * Retrieve a reference by its unique reference ID with tenant check.
   */
  public getReference(referenceId: string, callerTenantId?: string): CrossContextReference | undefined {
    const ref = this.referencesById.get(referenceId);
    if (!ref) return undefined;

    if (callerTenantId && ref.tenantId !== callerTenantId) {
      throw new CrossTenantReferenceError(callerTenantId, ref.tenantId);
    }

    return ref;
  }

  /**
   * Get all references originating from a given source context window/tile.
   */
  public getReferencesForSource(sourceContextId: string, callerTenantId: string): readonly CrossContextReference[] {
    const refIds = this.referencesBySource.get(sourceContextId);
    if (!refIds || refIds.size === 0) return [];

    const results: CrossContextReference[] = [];
    for (const id of refIds) {
      const ref = this.referencesById.get(id);
      if (ref) {
        if (ref.tenantId !== callerTenantId) {
          throw new CrossTenantReferenceError(callerTenantId, ref.tenantId);
        }
        results.push(ref);
      }
    }

    return Object.freeze(results.sort((a, b) => a.referenceId.localeCompare(b.referenceId)));
  }

  /**
   * Get all references pointing to a given target canonical object ID.
   */
  public getReferencesForTarget(targetObjectId: string, callerTenantId: string): readonly CrossContextReference[] {
    const refIds = this.referencesByTarget.get(targetObjectId);
    if (!refIds || refIds.size === 0) return [];

    const results: CrossContextReference[] = [];
    for (const id of refIds) {
      const ref = this.referencesById.get(id);
      if (ref) {
        if (ref.tenantId !== callerTenantId) {
          throw new CrossTenantReferenceError(callerTenantId, ref.tenantId);
        }
        results.push(ref);
      }
    }

    return Object.freeze(results.sort((a, b) => a.referenceId.localeCompare(b.referenceId)));
  }

  /**
   * List all registered references belonging to a specific tenant.
   */
  public listReferences(tenantId: string): readonly CrossContextReference[] {
    const refIds = this.referencesByTenant.get(tenantId);
    if (!refIds || refIds.size === 0) return [];

    const results: CrossContextReference[] = [];
    for (const id of refIds) {
      const ref = this.referencesById.get(id);
      if (ref) results.push(ref);
    }

    return Object.freeze(results.sort((a, b) => a.referenceId.localeCompare(b.referenceId)));
  }

  /**
   * Total registered references in memory.
   */
  public count(): number {
    return this.referencesById.size;
  }

  /**
   * Reset registry memory.
   */
  public clear(): void {
    this.referencesById.clear();
    this.referencesBySource.clear();
    this.referencesByTarget.clear();
    this.referencesByTenant.clear();
  }
}
