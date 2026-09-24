/**
 * CUBiO AI — Task 178: Cross-Context Reference Resolution
 * src/cubio/model/native_reference_resolution/referenceResolutionCoordinator.ts
 *
 * Master coordinator orchestrating lazy cross-context reference resolution,
 * registry indexing, multi-hop chain traversal, and safety enforcement.
 *
 * STRICT INVARIANTS:
 * 1. Zero full-context loading; resolves targeted records lazily from Primary VDB.
 * 2. Strict OCC state version checking and SHA-256 tamper detection.
 * 3. Immediate fail-closed rejection of missing, stale, contradictory, or cross-tenant references.
 * 4. Multi-hop lineage provenance preservation with cycle detection.
 * 5. Permanent hardware actuation lockout: IS_ACTUATION_BLOCKED === true.
 */

import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';
import { ReferenceRegistry } from './referenceRegistry.js';
import { ReferenceResolver } from './referenceResolver.js';
import { ResolutionGovernor } from './resolutionGovernor.js';
import {
  CrossContextReference,
  IS_ACTUATION_BLOCKED,
  MAX_REFERENCE_CHAIN_DEPTH,
  MissingReferenceError,
  ResolutionQuery,
  ResolvedReference,
  TASK_178_ID,
} from './types.js';

export class ReferenceResolutionCoordinator {
  public readonly taskId: string = TASK_178_ID;
  public readonly isActuationBlocked: boolean = IS_ACTUATION_BLOCKED;

  private readonly registry: ReferenceRegistry;
  private readonly resolver: ReferenceResolver;
  private readonly governor: ResolutionGovernor;
  private readonly memoryCoord: ModelMemoryCoordinator;

  constructor(memoryCoord?: ModelMemoryCoordinator) {
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
    this.governor = new ResolutionGovernor();
    this.resolver = new ReferenceResolver(this.memoryCoord, this.governor);
    this.registry = new ReferenceRegistry();
  }

  public getRegistry(): ReferenceRegistry {
    return this.registry;
  }

  public getResolver(): ReferenceResolver {
    return this.resolver;
  }

  public getGovernor(): ResolutionGovernor {
    return this.governor;
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  /**
   * Register a cross-context reference link in the tracking registry.
   */
  public registerReference(ref: CrossContextReference): void {
    this.governor.assertActuationBlocked();
    this.registry.registerReference(ref);
  }

  /**
   * Lazily resolve a single cross-context reference.
   */
  public resolveReference(query: ResolutionQuery): ResolvedReference {
    this.governor.assertActuationBlocked();

    let targetRef = query.reference;
    if (!targetRef && query.referenceId) {
      targetRef = this.registry.getReference(query.referenceId, query.callerTenantId);
    }

    if (!targetRef) {
      throw new MissingReferenceError(query.referenceId ?? 'UNKNOWN_REFERENCE');
    }

    return this.resolver.resolve(targetRef, query);
  }

  /**
   * Resolve an entire multi-hop reference chain starting from a root reference.
   * Traverses links where targetObjectId becomes sourceContextId of downstream references.
   */
  public resolveChain(query: ResolutionQuery): readonly ResolvedReference[] {
    this.governor.assertActuationBlocked();

    let rootRef = query.reference;
    if (!rootRef && query.referenceId) {
      rootRef = this.registry.getReference(query.referenceId, query.callerTenantId);
    }

    if (!rootRef) {
      throw new MissingReferenceError(query.referenceId ?? 'UNKNOWN_REFERENCE');
    }

    const resolvedList: ResolvedReference[] = [];
    const visitedObjects: string[] = [];
    let currentRef: CrossContextReference | undefined = rootRef;
    const maxDepth = query.maxChainDepth ?? MAX_REFERENCE_CHAIN_DEPTH;

    while (currentRef) {
      this.governor.assertChainDepth(visitedObjects.length, maxDepth);
      this.governor.assertNoCycle(currentRef.targetObjectId, visitedObjects);

      const resolved = this.resolver.resolve(currentRef, query, visitedObjects);
      resolvedList.push(resolved);
      visitedObjects.push(currentRef.targetObjectId);

      // Look for next hop in registry: references originating from currentRef.targetObjectId
      const nextHops = this.registry.getReferencesForSource(currentRef.targetObjectId, query.callerTenantId);
      if (nextHops.length > 0) {
        currentRef = nextHops[0];
      } else {
        currentRef = undefined;
      }
    }

    return Object.freeze(resolvedList);
  }
}
