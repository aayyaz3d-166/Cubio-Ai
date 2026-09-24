/**
 * CUBiO AI — Task 189: Native Knowledge Indexing and Retrieval
 * src/cubio/model/native_knowledge_retrieval/knowledgeMaterializer.ts
 *
 * On-Demand Knowledge Payload Materializer:
 * Fetches authoritative full-payload records from VDB only on demand,
 * verifying cryptographic SHA-256 checksums and OCC state versions fail-closed.
 */

import {
  KnowledgeIndexEntry,
  MaterializedKnowledgePayload,
  RetrievalChecksumMismatchError,
  RetrievalOCCCollisionError,
  RetrievalTenantViolationError,
} from './types';
import { KnowledgeVdbStore } from '../native_knowledge_architecture/knowledgeVdbStore';
import { KnowledgeHasher } from '../native_knowledge_architecture/knowledgeHasher';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';

export class KnowledgeMaterializer {
  /**
   * Materializes a single knowledge payload on-demand with integrity verification.
   */
  public static materialize(
    ref: KnowledgeIndexEntry,
    store: KnowledgeVdbStore,
    callerTenantId: string
  ): MaterializedKnowledgePayload {
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, ref.tenantId);

    let rawRecord: any = null;
    let computedChecksum = '';

    switch (ref.objectType) {
      case 'ENTITY': {
        const entity = store.getEntity(ref.objectId, callerTenantId);
        if (!entity) throw new Error(`[KnowledgeMaterializer] Entity "${ref.objectId}" not found in VDB.`);
        computedChecksum = KnowledgeHasher.computeEntityChecksum(entity);
        rawRecord = entity;
        break;
      }
      case 'CONCEPT': {
        const concept = store.getConcept(ref.objectId, callerTenantId);
        if (!concept) throw new Error(`[KnowledgeMaterializer] Concept "${ref.objectId}" not found in VDB.`);
        computedChecksum = KnowledgeHasher.computeConceptChecksum(concept);
        rawRecord = concept;
        break;
      }
      case 'FACT': {
        const fact = store.getFact(ref.objectId, callerTenantId);
        if (!fact) throw new Error(`[KnowledgeMaterializer] Fact "${ref.objectId}" not found in VDB.`);
        computedChecksum = KnowledgeHasher.computeFactChecksum(fact);
        rawRecord = fact;
        break;
      }
      case 'RELATIONSHIP': {
        const rel = store.getRelationship(ref.objectId, callerTenantId);
        if (!rel) throw new Error(`[KnowledgeMaterializer] Relationship "${ref.objectId}" not found in VDB.`);
        computedChecksum = KnowledgeHasher.computeRelationshipChecksum(rel);
        rawRecord = rel;
        break;
      }
      case 'EVIDENCE': {
        const ev = store.getEvidence(ref.objectId, callerTenantId);
        if (!ev) throw new Error(`[KnowledgeMaterializer] Evidence "${ref.objectId}" not found in VDB.`);
        computedChecksum = KnowledgeHasher.computeEvidenceChecksum(ev);
        rawRecord = ev;
        break;
      }
      default:
        throw new Error(`[KnowledgeMaterializer] Unknown object type "${ref.objectType}".`);
    }

    // 1. Validate OCC version consistency
    if (rawRecord.stateVersion !== ref.stateVersion) {
      throw new RetrievalOCCCollisionError(ref.objectId, ref.stateVersion, rawRecord.stateVersion);
    }

    // 2. Validate cryptographic checksum integrity fail-closed
    if (computedChecksum !== ref.checksum || rawRecord.checksum !== ref.checksum) {
      throw new RetrievalChecksumMismatchError(ref.objectId, ref.checksum, computedChecksum);
    }

    return Object.freeze({
      ref,
      payload: Object.freeze({ ...rawRecord }),
      checksumValid: true,
      occVerified: true,
    });
  }

  /**
   * Materializes a batch of references on-demand.
   */
  public static materializeBatch(
    refs: readonly KnowledgeIndexEntry[],
    store: KnowledgeVdbStore,
    callerTenantId: string
  ): readonly MaterializedKnowledgePayload[] {
    return Object.freeze(refs.map((ref) => this.materialize(ref, store, callerTenantId)));
  }
}
