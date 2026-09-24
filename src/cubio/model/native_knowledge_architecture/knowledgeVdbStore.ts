/**
 * CUBiO AI — Task 184: Native Knowledge Architecture
 * src/cubio/model/native_knowledge_architecture/knowledgeVdbStore.ts
 *
 * Authoritative Persistent Vector Database (VDB) Knowledge Store.
 * The sole authoritative persistent knowledge store in CUBiO AI runtime.
 * Implements strict tenant isolation, OCC state validation, multi-index lookups,
 * and zero-copy reference descriptor generation.
 */

import {
  KnowledgeEntity,
  Concept,
  Relationship,
  Evidence,
  Provenance,
  KnowledgeFact,
  KnowledgeReferenceDescriptor,
  KnowledgeEpistemicStatus,
} from './types';
import { KnowledgeGovernor } from './knowledgeGovernor';
import { KnowledgeHasher } from './knowledgeHasher';
import { KnowledgeSpatialBridge } from './knowledgeSpatialBridge';

export interface KnowledgeQueryParams {
  readonly tenantId: string;
  readonly address369?: number;
  readonly cellId343?: number;
  readonly epistemicStatus?: KnowledgeEpistemicStatus;
  readonly objectType?: 'ENTITY' | 'CONCEPT' | 'FACT' | 'RELATIONSHIP';
  readonly limit?: number;
}

export class KnowledgeVdbStore {
  // Key format: `${tenantId}:${objectId}`
  private readonly entities: Map<string, KnowledgeEntity> = new Map();
  private readonly concepts: Map<string, Concept> = new Map();
  private readonly facts: Map<string, KnowledgeFact> = new Map();
  private readonly relationships: Map<string, Relationship> = new Map();
  private readonly evidences: Map<string, Evidence> = new Map();
  private readonly provenances: Map<string, Provenance> = new Map();

  // Spatial index: key = `${tenantId}:${address369}` -> array of object keys
  private readonly spatialIndex: Map<string, Set<string>> = new Map();

  // Graph adjacency index: key = `${tenantId}:${nodeId}` -> array of relationship keys
  private readonly adjacencyIndex: Map<string, Set<string>> = new Map();

  private makeKey(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  private indexSpatial(tenantId: string, address369: number, storeKey: string): void {
    const idxKey = `${tenantId}:${address369}`;
    if (!this.spatialIndex.has(idxKey)) {
      this.spatialIndex.set(idxKey, new Set());
    }
    this.spatialIndex.get(idxKey)!.add(storeKey);
  }

  private indexAdjacency(tenantId: string, nodeId: string, relKey: string): void {
    const idxKey = `${tenantId}:${nodeId}`;
    if (!this.adjacencyIndex.has(idxKey)) {
      this.adjacencyIndex.set(idxKey, new Set());
    }
    this.adjacencyIndex.get(idxKey)!.add(relKey);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Entity Operations
  // ───────────────────────────────────────────────────────────────────────────

  public saveEntity(
    entity: Omit<KnowledgeEntity, 'checksum' | 'stateVersion'>,
    expectedVersion: number
  ): KnowledgeEntity {
    KnowledgeGovernor.assertActuationBlocked(entity.name);
    const key = this.makeKey(entity.tenantId, entity.entityId);
    const existing = this.entities.get(key);

    KnowledgeGovernor.validateOCC(entity.entityId, expectedVersion, existing?.stateVersion);

    if (existing) {
      KnowledgeGovernor.assertNoEpistemicDowngrade(
        entity.entityId,
        existing.epistemicStatus,
        entity.epistemicStatus
      );
    }

    const nextVersion = existing ? existing.stateVersion + 1 : 1;
    const checksum = KnowledgeHasher.computeEntityChecksum({
      ...entity,
      stateVersion: nextVersion,
    });

    const grounding = KnowledgeSpatialBridge.resolveGrounding(entity.address369);

    const saved: KnowledgeEntity = {
      ...entity,
      cellId343: grounding.cellId343,
      coordinate3D: grounding.coordinate3D,
      stateVersion: nextVersion,
      checksum,
    };

    this.entities.set(key, Object.freeze(saved));
    this.indexSpatial(entity.tenantId, entity.address369, key);
    return saved;
  }

  public getEntity(entityId: string, callerTenantId: string): KnowledgeEntity | null {
    const key = this.makeKey(callerTenantId, entityId);
    const item = this.entities.get(key);
    if (!item) return null;
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, item.tenantId);
    return item;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Concept Operations
  // ───────────────────────────────────────────────────────────────────────────

  public saveConcept(
    concept: Omit<Concept, 'checksum' | 'stateVersion'>,
    expectedVersion: number
  ): Concept {
    KnowledgeGovernor.assertActuationBlocked(concept.label);
    const key = this.makeKey(concept.tenantId, concept.conceptId);
    const existing = this.concepts.get(key);

    KnowledgeGovernor.validateOCC(concept.conceptId, expectedVersion, existing?.stateVersion);

    if (existing) {
      KnowledgeGovernor.assertNoEpistemicDowngrade(
        concept.conceptId,
        existing.epistemicStatus,
        concept.epistemicStatus
      );
    }

    const nextVersion = existing ? existing.stateVersion + 1 : 1;
    const checksum = KnowledgeHasher.computeConceptChecksum({
      ...concept,
      stateVersion: nextVersion,
    });

    const grounding = KnowledgeSpatialBridge.resolveGrounding(concept.address369);

    const saved: Concept = {
      ...concept,
      cellId343: grounding.cellId343,
      coordinate3D: grounding.coordinate3D,
      stateVersion: nextVersion,
      checksum,
    };

    this.concepts.set(key, Object.freeze(saved));
    this.indexSpatial(concept.tenantId, concept.address369, key);
    return saved;
  }

  public getConcept(conceptId: string, callerTenantId: string): Concept | null {
    const key = this.makeKey(callerTenantId, conceptId);
    const item = this.concepts.get(key);
    if (!item) return null;
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, item.tenantId);
    return item;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Fact Operations
  // ───────────────────────────────────────────────────────────────────────────

  public saveFact(
    fact: Omit<KnowledgeFact, 'checksum' | 'stateVersion'>,
    expectedVersion: number
  ): KnowledgeFact {
    KnowledgeGovernor.assertActuationBlocked(`${fact.predicate} ${fact.objectId}`);
    const key = this.makeKey(fact.tenantId, fact.factId);
    const existing = this.facts.get(key);

    KnowledgeGovernor.validateOCC(fact.factId, expectedVersion, existing?.stateVersion);

    if (existing) {
      KnowledgeGovernor.assertNoEpistemicDowngrade(
        fact.factId,
        existing.epistemicStatus,
        fact.epistemicStatus
      );
    }

    const nextVersion = existing ? existing.stateVersion + 1 : 1;
    const checksum = KnowledgeHasher.computeFactChecksum({
      ...fact,
      stateVersion: nextVersion,
    });

    const grounding = KnowledgeSpatialBridge.resolveGrounding(fact.address369);

    const saved: KnowledgeFact = {
      ...fact,
      cellId343: grounding.cellId343,
      stateVersion: nextVersion,
      checksum,
    };

    this.facts.set(key, Object.freeze(saved));
    this.indexSpatial(fact.tenantId, fact.address369, key);
    return saved;
  }

  public getFact(factId: string, callerTenantId: string): KnowledgeFact | null {
    const key = this.makeKey(callerTenantId, factId);
    const item = this.facts.get(key);
    if (!item) return null;
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, item.tenantId);
    return item;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Relationship Operations
  // ───────────────────────────────────────────────────────────────────────────

  public saveRelationship(
    rel: Omit<Relationship, 'checksum' | 'stateVersion'>,
    expectedVersion: number
  ): Relationship {
    const key = this.makeKey(rel.tenantId, rel.relationshipId);
    const existing = this.relationships.get(key);

    KnowledgeGovernor.validateOCC(rel.relationshipId, expectedVersion, existing?.stateVersion);

    const nextVersion = existing ? existing.stateVersion + 1 : 1;
    const checksum = KnowledgeHasher.computeRelationshipChecksum({
      ...rel,
      stateVersion: nextVersion,
    });

    const saved: Relationship = {
      ...rel,
      stateVersion: nextVersion,
      checksum,
    };

    this.relationships.set(key, Object.freeze(saved));
    this.indexAdjacency(rel.tenantId, rel.sourceId, key);
    this.indexAdjacency(rel.tenantId, rel.targetId, key);
    return saved;
  }

  public getRelationship(relationshipId: string, callerTenantId: string): Relationship | null {
    const key = this.makeKey(callerTenantId, relationshipId);
    const item = this.relationships.get(key);
    if (!item) return null;
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, item.tenantId);
    return item;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Evidence & Provenance Operations
  // ───────────────────────────────────────────────────────────────────────────

  public saveEvidence(evidence: Evidence): Evidence {
    const key = this.makeKey(evidence.tenantId, evidence.evidenceId);
    this.evidences.set(key, Object.freeze(evidence));
    return evidence;
  }

  public getEvidence(evidenceId: string, callerTenantId: string): Evidence | null {
    const key = this.makeKey(callerTenantId, evidenceId);
    const item = this.evidences.get(key);
    if (!item) return null;
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, item.tenantId);
    return item;
  }

  public saveProvenance(provenance: Provenance): Provenance {
    const key = this.makeKey(provenance.tenantId, provenance.provenanceId);
    this.provenances.set(key, Object.freeze(provenance));
    return provenance;
  }

  public getProvenance(provenanceId: string, callerTenantId: string): Provenance | null {
    const key = this.makeKey(callerTenantId, provenanceId);
    const item = this.provenances.get(key);
    if (!item) return null;
    KnowledgeGovernor.assertTenantIntegrity(callerTenantId, item.tenantId);
    return item;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Graph Traversal & Adjacency Queries
  // ───────────────────────────────────────────────────────────────────────────

  public getAdjacentRelationships(nodeId: string, callerTenantId: string): readonly Relationship[] {
    const idxKey = `${callerTenantId}:${nodeId}`;
    const relKeys = this.adjacencyIndex.get(idxKey);
    if (!relKeys || relKeys.size === 0) return [];

    const result: Relationship[] = [];
    for (const rk of relKeys) {
      const rel = this.relationships.get(rk);
      if (rel && rel.tenantId === callerTenantId) {
        result.push(rel);
      }
    }
    return Object.freeze(result);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Zero-Copy Reference Descriptors Query
  // ───────────────────────────────────────────────────────────────────────────

  public queryReferences(params: KnowledgeQueryParams): readonly KnowledgeReferenceDescriptor[] {
    const limit = params.limit ?? 100;
    const descriptors: KnowledgeReferenceDescriptor[] = [];

    // Entities
    for (const entity of this.entities.values()) {
      if (descriptors.length >= limit) break;
      if (entity.tenantId !== params.tenantId) continue;
      if (params.objectType && params.objectType !== 'ENTITY') continue;
      if (params.address369 !== undefined && entity.address369 !== params.address369) continue;
      if (params.cellId343 !== undefined && entity.cellId343 !== params.cellId343) continue;
      if (params.epistemicStatus && entity.epistemicStatus !== params.epistemicStatus) continue;

      descriptors.push({
        objectId: entity.entityId,
        objectType: 'ENTITY',
        tenantId: entity.tenantId,
        address369: entity.address369,
        cellId343: entity.cellId343,
        stateVersion: entity.stateVersion,
        checksum: entity.checksum,
        epistemicStatus: entity.epistemicStatus,
        preview: `${entity.name} (${entity.category})`,
      });
    }

    // Concepts
    for (const concept of this.concepts.values()) {
      if (descriptors.length >= limit) break;
      if (concept.tenantId !== params.tenantId) continue;
      if (params.objectType && params.objectType !== 'CONCEPT') continue;
      if (params.address369 !== undefined && concept.address369 !== params.address369) continue;
      if (params.cellId343 !== undefined && concept.cellId343 !== params.cellId343) continue;
      if (params.epistemicStatus && concept.epistemicStatus !== params.epistemicStatus) continue;

      descriptors.push({
        objectId: concept.conceptId,
        objectType: 'CONCEPT',
        tenantId: concept.tenantId,
        address369: concept.address369,
        cellId343: concept.cellId343,
        stateVersion: concept.stateVersion,
        checksum: concept.checksum,
        epistemicStatus: concept.epistemicStatus,
        preview: `${concept.label}: ${concept.domain}`,
      });
    }

    // Facts
    for (const fact of this.facts.values()) {
      if (descriptors.length >= limit) break;
      if (fact.tenantId !== params.tenantId) continue;
      if (params.objectType && params.objectType !== 'FACT') continue;
      if (params.address369 !== undefined && fact.address369 !== params.address369) continue;
      if (params.cellId343 !== undefined && fact.cellId343 !== params.cellId343) continue;
      if (params.epistemicStatus && fact.epistemicStatus !== params.epistemicStatus) continue;

      descriptors.push({
        objectId: fact.factId,
        objectType: 'FACT',
        tenantId: fact.tenantId,
        address369: fact.address369,
        cellId343: fact.cellId343,
        stateVersion: fact.stateVersion,
        checksum: fact.checksum,
        epistemicStatus: fact.epistemicStatus,
        preview: `${fact.subjectId} ${fact.predicate} ${fact.objectId}`,
      });
    }

    return Object.freeze(descriptors);
  }

  public getStats(tenantId: string): {
    entityCount: number;
    conceptCount: number;
    factCount: number;
    relationshipCount: number;
    evidenceCount: number;
    provenanceCount: number;
  } {
    let entityCount = 0;
    let conceptCount = 0;
    let factCount = 0;
    let relationshipCount = 0;
    let evidenceCount = 0;
    let provenanceCount = 0;

    for (const e of this.entities.values()) if (e.tenantId === tenantId) entityCount++;
    for (const c of this.concepts.values()) if (c.tenantId === tenantId) conceptCount++;
    for (const f of this.facts.values()) if (f.tenantId === tenantId) factCount++;
    for (const r of this.relationships.values()) if (r.tenantId === tenantId) relationshipCount++;
    for (const ev of this.evidences.values()) if (ev.tenantId === tenantId) evidenceCount++;
    for (const p of this.provenances.values()) if (p.tenantId === tenantId) provenanceCount++;

    return {
      entityCount,
      conceptCount,
      factCount,
      relationshipCount,
      evidenceCount,
      provenanceCount,
    };
  }
}
