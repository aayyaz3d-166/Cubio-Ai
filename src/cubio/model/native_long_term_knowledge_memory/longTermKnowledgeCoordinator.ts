/**
 * CUBiO AI — Task 190: Native Long-Term Knowledge Memory
 * src/cubio/model/native_long_term_knowledge_memory/longTermKnowledgeCoordinator.ts
 *
 * Long-Term Knowledge Coordinator:
 * Connects L1–L4 memory hierarchy with authoritative VDB persistence,
 * supporting cross-session references, lazy loading, selective caching,
 * and deterministic eviction under strict sovereign safety controls.
 */

import * as crypto from 'crypto';
import {
  TASK_190_ID,
  IS_ACTUATION_BLOCKED,
  KnowledgeMemoryReference,
  L1MaterializedPayload,
  TierCapacityConfig,
  KnowledgeTierStats,
  KnowledgeMemoryTenantViolationError,
} from './types';
import { TierCache } from './tierCache';
import { KnowledgeVdbStore } from '../native_knowledge_architecture/knowledgeVdbStore';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { KnowledgeHasher } from '../native_knowledge_architecture/knowledgeHasher';
import {
  KnowledgeEntity,
  Concept,
  KnowledgeFact,
  Relationship,
  Evidence,
} from '../native_knowledge_architecture/types';

export class LongTermKnowledgeCoordinator {
  public static readonly VERSION = '190.1.0';
  public static readonly IS_ACTUATION_BLOCKED = IS_ACTUATION_BLOCKED;

  private readonly cache: TierCache;
  private readonly vdb: KnowledgeVdbStore;
  private readonly refLookup: Map<string, KnowledgeMemoryReference> = new Map();

  constructor(vdb?: KnowledgeVdbStore, config?: TierCapacityConfig) {
    this.vdb = vdb ?? new KnowledgeVdbStore();
    this.cache = new TierCache(config);
  }

  public getCache(): TierCache {
    return this.cache;
  }

  public getVdb(): KnowledgeVdbStore {
    return this.vdb;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Knowledge Registration & Reference Creation (Single Storage in L4 VDB)
  // ───────────────────────────────────────────────────────────────────────────

  public registerEntity(entity: KnowledgeEntity, isPinned: boolean = false): KnowledgeMemoryReference {
    KnowledgeGovernor.assertActuationBlocked(entity.name);
    // Ensure persisted in authoritative L4 VDB
    if (!this.vdb.getEntity(entity.entityId, entity.tenantId)) {
      this.vdb.saveEntity(entity, 0);
    }

    const ref: KnowledgeMemoryReference = {
      referenceId: `ref_${entity.entityId}`,
      objectId: entity.entityId,
      objectType: 'ENTITY',
      tier: 'L2_SESSION',
      tenantId: entity.tenantId,
      label: entity.name,
      address369: entity.address369,
      cellId343: entity.cellId343,
      checksum: entity.checksum,
      stateVersion: entity.stateVersion,
      epistemicStatus: entity.epistemicStatus,
      accessCount: 1,
      lastAccessTick: this.cache.nextTick(),
      isPinned,
      provenanceSummary: `Entity: ${entity.category}`,
    };

    this.refLookup.set(`${ref.tenantId}:${ref.objectId}`, ref);
    return this.cache.putL2(ref);
  }

  public registerConcept(concept: Concept, isPinned: boolean = false): KnowledgeMemoryReference {
    KnowledgeGovernor.assertActuationBlocked(concept.label);
    if (!this.vdb.getConcept(concept.conceptId, concept.tenantId)) {
      this.vdb.saveConcept(concept, 0);
    }

    const ref: KnowledgeMemoryReference = {
      referenceId: `ref_${concept.conceptId}`,
      objectId: concept.conceptId,
      objectType: 'CONCEPT',
      tier: 'L2_SESSION',
      tenantId: concept.tenantId,
      label: concept.label,
      address369: concept.address369,
      cellId343: concept.cellId343,
      checksum: concept.checksum,
      stateVersion: concept.stateVersion,
      epistemicStatus: concept.epistemicStatus,
      accessCount: 1,
      lastAccessTick: this.cache.nextTick(),
      isPinned,
      provenanceSummary: `Concept: ${concept.domain}`,
    };

    this.refLookup.set(`${ref.tenantId}:${ref.objectId}`, ref);
    return this.cache.putL2(ref);
  }

  public registerFact(fact: KnowledgeFact, isPinned: boolean = false): KnowledgeMemoryReference {
    KnowledgeGovernor.assertActuationBlocked(fact.predicate);
    if (!this.vdb.getFact(fact.factId, fact.tenantId)) {
      this.vdb.saveFact(fact, 0);
    }

    const ref: KnowledgeMemoryReference = {
      referenceId: `ref_${fact.factId}`,
      objectId: fact.factId,
      objectType: 'FACT',
      tier: 'L2_SESSION',
      tenantId: fact.tenantId,
      label: `${fact.subjectId} ${fact.predicate} ${fact.objectId}`,
      address369: fact.address369,
      cellId343: fact.cellId343,
      checksum: fact.checksum,
      stateVersion: fact.stateVersion,
      epistemicStatus: fact.epistemicStatus,
      accessCount: 1,
      lastAccessTick: this.cache.nextTick(),
      isPinned,
      provenanceSummary: `Fact with ${fact.evidenceIds.length} evidence`,
    };

    this.refLookup.set(`${ref.tenantId}:${ref.objectId}`, ref);
    return this.cache.putL2(ref);
  }

  public registerRelationship(rel: Relationship, isPinned: boolean = false): KnowledgeMemoryReference {
    KnowledgeGovernor.assertActuationBlocked(rel.relationType);
    if (!this.vdb.getRelationship(rel.relationshipId, rel.tenantId)) {
      this.vdb.saveRelationship(rel, 0);
    }

    const ref: KnowledgeMemoryReference = {
      referenceId: `ref_${rel.relationshipId}`,
      objectId: rel.relationshipId,
      objectType: 'RELATIONSHIP',
      tier: 'L2_SESSION',
      tenantId: rel.tenantId,
      label: `${rel.sourceId} ${rel.relationType} ${rel.targetId}`,
      address369: 0,
      checksum: rel.checksum,
      stateVersion: rel.stateVersion,
      epistemicStatus: rel.epistemicStatus,
      accessCount: 1,
      lastAccessTick: this.cache.nextTick(),
      isPinned,
      provenanceSummary: `Relationship weight ${rel.weight}`,
    };

    this.refLookup.set(`${ref.tenantId}:${ref.objectId}`, ref);
    return this.cache.putL2(ref);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Cross-Session Promotion (L2 -> L3)
  // ───────────────────────────────────────────────────────────────────────────

  public promoteToLongTerm(objectId: string, callerTenantId: string): KnowledgeMemoryReference {
    KnowledgeGovernor.assertActuationBlocked(objectId);
    const existing = this.cache.getL2(objectId, callerTenantId);
    if (!existing) {
      throw new Error(`[LongTermKnowledgeCoordinator] Object "${objectId}" not found in L2 session memory.`);
    }

    const promoted = this.cache.putL3(existing);
    this.refLookup.set(`${promoted.tenantId}:${promoted.objectId}`, promoted);
    return promoted;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Lazy Loading & Resolution to L1 Working Memory
  // ───────────────────────────────────────────────────────────────────────────

  public resolveToL1(objectId: string, callerTenantId: string): L1MaterializedPayload {
    KnowledgeGovernor.assertActuationBlocked(objectId);

    // 1. Check L1 cache (cache hit)
    const cachedL1 = this.cache.getL1(objectId, callerTenantId);
    if (cachedL1) {
      return cachedL1;
    }

    // 2. Cache miss: Lazy load from authoritative L4 VDB
    let rawPayload: any = this.vdb.getEntity(objectId, callerTenantId);
    let objectType: 'ENTITY' | 'CONCEPT' | 'FACT' | 'RELATIONSHIP' | 'EVIDENCE' = 'ENTITY';
    let computedChecksum = '';

    if (rawPayload) {
      computedChecksum = KnowledgeHasher.computeEntityChecksum(rawPayload);
    } else {
      rawPayload = this.vdb.getConcept(objectId, callerTenantId);
      if (rawPayload) {
        objectType = 'CONCEPT';
        computedChecksum = KnowledgeHasher.computeConceptChecksum(rawPayload);
      } else {
        rawPayload = this.vdb.getFact(objectId, callerTenantId);
        if (rawPayload) {
          objectType = 'FACT';
          computedChecksum = KnowledgeHasher.computeFactChecksum(rawPayload);
        } else {
          rawPayload = this.vdb.getRelationship(objectId, callerTenantId);
          if (rawPayload) {
            objectType = 'RELATIONSHIP';
            computedChecksum = KnowledgeHasher.computeRelationshipChecksum(rawPayload);
          } else {
            rawPayload = this.vdb.getEvidence(objectId, callerTenantId);
            if (rawPayload) {
              objectType = 'EVIDENCE';
              computedChecksum = KnowledgeHasher.computeEvidenceChecksum(rawPayload);
            }
          }
        }
      }
    }

    if (!rawPayload) {
      throw new Error(`[LongTermKnowledgeCoordinator] Object "${objectId}" not found in canonical L4 VDB.`);
    }

    // Checksum verification
    if (computedChecksum !== rawPayload.checksum) {
      throw new Error(`[LongTermKnowledgeCoordinator] Cryptographic checksum mismatch on lazy load for "${objectId}".`);
    }

    const payloadEntry: L1MaterializedPayload = {
      referenceId: `ref_${objectId}`,
      objectId,
      tenantId: callerTenantId,
      payload: Object.freeze({ ...rawPayload }),
      materializedTick: this.cache.nextTick(),
      checksumValid: true,
      occVerified: true,
    };

    // Cache in L1
    this.cache.putL1(payloadEntry, this.refLookup);
    return payloadEntry;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Checkpoint Export (.3dmemory Transport Only)
  // ───────────────────────────────────────────────────────────────────────────

  public exportTransportCheckpoint(
    tenantId: string,
    timestamp?: number
  ): {
    readonly format: '.3dmemory';
    readonly isPrimaryAuthority: false;
    readonly tenantId: string;
    readonly stats: KnowledgeTierStats;
    readonly digest: string;
    readonly timestamp: number;
  } {
    const vdbStats = this.vdb.getStats(tenantId);
    const totalVdbCount =
      vdbStats.entityCount +
      vdbStats.conceptCount +
      vdbStats.factCount +
      vdbStats.relationshipCount +
      vdbStats.evidenceCount;

    const stats = this.cache.getStats(tenantId, totalVdbCount);
    const ts = timestamp ?? 1000;

    const payload = JSON.stringify({
      format: '.3dmemory',
      tenantId,
      stats,
      timestamp: ts,
    });

    const digest = crypto.createHash('sha256').update(payload).digest('hex');

    return Object.freeze({
      format: '.3dmemory',
      isPrimaryAuthority: false,
      tenantId,
      stats,
      digest,
      timestamp: ts,
    });
  }

  public emitAdvisory(message: string): {
    readonly taskId: string;
    readonly status: 'ADVISORY_EMITTED';
    readonly message: string;
    readonly actuationBlocked: boolean;
  } {
    KnowledgeGovernor.assertActuationBlocked(message);
    return Object.freeze({
      taskId: TASK_190_ID,
      status: 'ADVISORY_EMITTED',
      message,
      actuationBlocked: IS_ACTUATION_BLOCKED,
    });
  }
}
