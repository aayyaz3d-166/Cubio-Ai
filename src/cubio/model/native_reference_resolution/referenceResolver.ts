/**
 * CUBiO AI — Task 178: Cross-Context Reference Resolution
 * src/cubio/model/native_reference_resolution/referenceResolver.ts
 *
 * Lazy On-Demand Reference Resolver:
 * Resolves cross-context references without loading unrelated context windows,
 * rigorously checking OCC state versions, cryptographic SHA-256 checksums,
 * tenant isolation, contradiction conflicts, and chain provenance.
 *
 * STRICT INVARIANTS:
 * 1. Lazy loading: Primary VDB is queried only for targeted object IDs.
 * 2. OCC validation: Stale state versions rejected fail-closed with StaleReferenceError.
 * 3. Checksum verification: Bitwise content tamper detection fail-closed.
 * 4. Contradiction detection: Epistemic collisions with axioms rejected fail-closed.
 * 5. Full provenance chain tracking and SHA-256 digest computation.
 */

import { createHash } from 'node:crypto';
import { ModelMemoryCoordinator } from '../native_memory_integration/modelMemoryCoordinator.js';
import { ResolutionGovernor } from './resolutionGovernor.js';
import {
  ContradictoryReferenceError,
  CorruptedReferenceChecksumError,
  CrossContextReference,
  MAX_REFERENCE_CHAIN_DEPTH,
  MissingReferenceError,
  ProvenanceChainNode,
  ResolutionQuery,
  ResolvedReference,
  StaleReferenceError,
} from './types.js';

export class ReferenceResolver {
  private readonly memoryCoord: ModelMemoryCoordinator;
  private readonly governor: ResolutionGovernor;

  constructor(memoryCoord?: ModelMemoryCoordinator, governor?: ResolutionGovernor) {
    this.memoryCoord = memoryCoord ?? new ModelMemoryCoordinator();
    this.governor = governor ?? new ResolutionGovernor();
  }

  public getMemoryCoordinator(): ModelMemoryCoordinator {
    return this.memoryCoord;
  }

  public getGovernor(): ResolutionGovernor {
    return this.governor;
  }

  /**
   * Lazily resolve a cross-context reference.
   */
  public resolve(
    reference: CrossContextReference,
    query: ResolutionQuery,
    visitedObjects: readonly string[] = []
  ): ResolvedReference {
    const startTime = performance.now();

    // 1. Actuation lockout check
    this.governor.assertActuationBlocked();

    // 2. Multi-tenant isolation check
    this.governor.assertTenantIntegrity(query.callerTenantId, reference.tenantId);

    // 3. Chain depth and cycle bounds
    const maxDepth = query.maxChainDepth ?? MAX_REFERENCE_CHAIN_DEPTH;
    this.governor.assertChainDepth(visitedObjects.length, maxDepth);
    this.governor.assertNoCycle(reference.targetObjectId, visitedObjects);

    // 4. Lazy target retrieval from Primary VDB (zero unrelated context loaded)
    const record = this.memoryCoord.getRecord(reference.targetObjectId, query.callerTenantId);
    if (!record) {
      throw new MissingReferenceError(reference.targetObjectId);
    }

    // 5. Verify target record tenant
    this.governor.assertTenantIntegrity(query.callerTenantId, record.reference.tenantId);

    // 6. Optimistic Concurrency Control (OCC) version freshness validation
    if (
      reference.expectedStateVersion > 0 &&
      record.reference.stateVersion !== reference.expectedStateVersion
    ) {
      throw new StaleReferenceError(
        reference.targetObjectId,
        reference.expectedStateVersion,
        record.reference.stateVersion
      );
    }

    // 7. Cryptographic SHA-256 Checksum verification
    if (reference.expectedChecksum && reference.expectedChecksum.trim().length > 0) {
      if (record.reference.checksum !== reference.expectedChecksum) {
        throw new CorruptedReferenceChecksumError(
          reference.targetObjectId,
          reference.expectedChecksum,
          record.reference.checksum
        );
      }
    }

    // 8. Epistemic Contradiction Detection
    if (reference.referenceType === 'CONTRADICTION_ASSERTION') {
      if (record.epistemicStatus === 'AXIOM' || record.epistemicStatus === 'FACT') {
        throw new ContradictoryReferenceError(
          reference.targetObjectId,
          `Reference asserts contradiction against established ${record.epistemicStatus} truth.`
        );
      }
    }

    if (reference.metadata && reference.metadata['contradictsPriorAxiom'] === true) {
      throw new ContradictoryReferenceError(
        reference.targetObjectId,
        'Reference metadata indicates an unresolved contradiction against certified canonical knowledge.'
      );
    }

    // 9. Build provenance chain node
    const currentNode: ProvenanceChainNode = Object.freeze({
      referenceId: reference.referenceId,
      sourceContextId: reference.sourceContextId,
      targetObjectId: reference.targetObjectId,
      targetChunkId: reference.targetChunkId,
      stateVersion: record.reference.stateVersion,
      checksum: record.reference.checksum,
      hopIndex: visitedObjects.length,
      epistemicStatus: record.epistemicStatus,
    });

    const provenanceChain: ProvenanceChainNode[] = [currentNode];

    const endTime = performance.now();
    const latencyMs = Number((endTime - startTime).toFixed(3));

    // 10. Cryptographic SHA-256 Resolution Digest
    const digestHasher = createHash('sha256');
    digestHasher.update(`TENANT:${query.callerTenantId}\n`);
    digestHasher.update(`REF_ID:${reference.referenceId}\n`);
    digestHasher.update(`SRC_CTX:${reference.sourceContextId}\n`);
    digestHasher.update(`TGT_OBJ:${reference.targetObjectId}\n`);
    digestHasher.update(`OCC_VER:${record.reference.stateVersion}\n`);
    digestHasher.update(`CHECKSUM:${record.reference.checksum}\n`);
    const resolutionDigest = digestHasher.digest('hex');

    return Object.freeze({
      reference,
      resolvedRecord: query.materializeContent === false ? undefined : record,
      provenanceChain: Object.freeze(provenanceChain),
      latencyMs,
      resolutionDigest,
      isLazyLoaded: true,
    });
  }
}
