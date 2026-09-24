/**
 * CUBiO AI — Task 189: Native Knowledge Indexing and Retrieval
 * src/cubio/model/native_knowledge_retrieval/knowledgeIndex.ts
 *
 * Multi-Facet Deterministic Inverted Index:
 * Manages lightweight index descriptors for entities, concepts, facts,
 * relationships, and evidence without full-VDB RAM loading.
 */

import {
  KnowledgeIndexEntry,
  KnowledgeObjectType,
  RetrievalTenantViolationError,
} from './types';
import {
  KnowledgeEntity,
  Concept,
  KnowledgeFact,
  Relationship,
  Evidence,
} from '../native_knowledge_architecture/types';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';

export class KnowledgeIndex {
  // Master entry lookup: `${tenantId}:${objectId}` -> KnowledgeIndexEntry
  private readonly entries: Map<string, KnowledgeIndexEntry> = new Map();

  // Inverted multi-facet indices
  private readonly tokenIndex: Map<string, Set<string>> = new Map();
  private readonly spatialIndex: Map<string, Set<string>> = new Map();
  private readonly typeIndex: Map<string, Set<string>> = new Map();
  private readonly epistemicIndex: Map<string, Set<string>> = new Map();
  private readonly categoryIndex: Map<string, Set<string>> = new Map();

  private makeKey(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  /**
   * Deterministic native tokenization.
   */
  public static tokenize(text: string): readonly string[] {
    KnowledgeGovernor.assertActuationBlocked(text);
    return text
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^a-z0-9_\-\s]/g, ' ')
      .split(/[\s_\-]+/)
      .filter((t) => t.length >= 2);
  }

  /**
   * Adds a lightweight entry to all indices.
   */
  public addEntry(entry: KnowledgeIndexEntry): KnowledgeIndexEntry {
    KnowledgeGovernor.assertActuationBlocked(entry.label);
    const storeKey = this.makeKey(entry.tenantId, entry.objectId);
    const frozen = Object.freeze({ ...entry });
    this.entries.set(storeKey, frozen);

    // 1. Token index
    for (const token of entry.tokens) {
      const tKey = `${entry.tenantId}:${token}`;
      if (!this.tokenIndex.has(tKey)) this.tokenIndex.set(tKey, new Set());
      this.tokenIndex.get(tKey)!.add(entry.objectId);
    }

    // 2. Spatial index
    const sKey = `${entry.tenantId}:${entry.address369}`;
    if (!this.spatialIndex.has(sKey)) this.spatialIndex.set(sKey, new Set());
    this.spatialIndex.get(sKey)!.add(entry.objectId);

    // 3. Type index
    const typKey = `${entry.tenantId}:${entry.objectType}`;
    if (!this.typeIndex.has(typKey)) this.typeIndex.set(typKey, new Set());
    this.typeIndex.get(typKey)!.add(entry.objectId);

    // 4. Epistemic index
    const epiKey = `${entry.tenantId}:${entry.epistemicStatus}`;
    if (!this.epistemicIndex.has(epiKey)) this.epistemicIndex.set(epiKey, new Set());
    this.epistemicIndex.get(epiKey)!.add(entry.objectId);

    // 5. Category index
    if (entry.category) {
      const catKey = `${entry.tenantId}:${entry.category.toLowerCase()}`;
      if (!this.categoryIndex.has(catKey)) this.categoryIndex.set(catKey, new Set());
      this.categoryIndex.get(catKey)!.add(entry.objectId);
    }

    return frozen;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Typed Ingest Helpers (Zero Full-Payload Retention in Index)
  // ───────────────────────────────────────────────────────────────────────────

  public indexEntity(entity: KnowledgeEntity): KnowledgeIndexEntry {
    const tokens = KnowledgeIndex.tokenize(`${entity.name} ${entity.category}`);
    return this.addEntry({
      objectId: entity.entityId,
      objectType: 'ENTITY',
      label: entity.name,
      tokens,
      category: entity.category,
      address369: entity.address369,
      cellId343: entity.cellId343,
      tenantId: entity.tenantId,
      stateVersion: entity.stateVersion,
      checksum: entity.checksum,
      epistemicStatus: entity.epistemicStatus,
      provenanceDepth: 0,
    });
  }

  public indexConcept(concept: Concept): KnowledgeIndexEntry {
    const tokens = KnowledgeIndex.tokenize(`${concept.label} ${concept.domain} ${concept.definition}`);
    return this.addEntry({
      objectId: concept.conceptId,
      objectType: 'CONCEPT',
      label: concept.label,
      tokens,
      category: concept.domain,
      address369: concept.address369,
      cellId343: concept.cellId343,
      tenantId: concept.tenantId,
      stateVersion: concept.stateVersion,
      checksum: concept.checksum,
      epistemicStatus: concept.epistemicStatus,
      provenanceDepth: 0,
    });
  }

  public indexFact(fact: KnowledgeFact): KnowledgeIndexEntry {
    const tokens = KnowledgeIndex.tokenize(`${fact.subjectId} ${fact.predicate} ${fact.objectId}`);
    return this.addEntry({
      objectId: fact.factId,
      objectType: 'FACT',
      label: `${fact.subjectId} ${fact.predicate} ${fact.objectId}`,
      tokens,
      category: fact.predicate,
      address369: fact.address369,
      cellId343: fact.cellId343,
      tenantId: fact.tenantId,
      stateVersion: fact.stateVersion,
      checksum: fact.checksum,
      epistemicStatus: fact.epistemicStatus,
      provenanceDepth: fact.evidenceIds.length,
    });
  }

  public indexRelationship(rel: Relationship): KnowledgeIndexEntry {
    const tokens = KnowledgeIndex.tokenize(`${rel.sourceId} ${rel.relationType} ${rel.targetId}`);
    return this.addEntry({
      objectId: rel.relationshipId,
      objectType: 'RELATIONSHIP',
      label: `${rel.sourceId} ${rel.relationType} ${rel.targetId}`,
      tokens,
      category: rel.relationType,
      address369: 0,
      tenantId: rel.tenantId,
      stateVersion: rel.stateVersion,
      checksum: rel.checksum,
      epistemicStatus: rel.epistemicStatus,
      provenanceDepth: rel.evidenceIds.length,
    });
  }

  public indexEvidence(evidence: Evidence): KnowledgeIndexEntry {
    const tokens = KnowledgeIndex.tokenize(`${evidence.sourceType} ${evidence.content}`);
    return this.addEntry({
      objectId: evidence.evidenceId,
      objectType: 'EVIDENCE',
      label: evidence.content.slice(0, 64),
      tokens,
      category: evidence.sourceType,
      address369: evidence.spatialCellId ?? 0,
      cellId343: evidence.spatialCellId,
      tenantId: evidence.tenantId,
      stateVersion: 1,
      checksum: evidence.sourceChecksum,
      epistemicStatus: evidence.epistemicStatus,
      provenanceDepth: evidence.lineage.length,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Retrieval & Query Primitives
  // ───────────────────────────────────────────────────────────────────────────

  public getEntry(objectId: string, callerTenantId: string): KnowledgeIndexEntry | null {
    const key = this.makeKey(callerTenantId, objectId);
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.tenantId !== callerTenantId) {
      throw new RetrievalTenantViolationError(callerTenantId, entry.tenantId);
    }
    return entry;
  }

  public getCandidateObjectIdsByToken(token: string, callerTenantId: string): Set<string> {
    const tKey = `${callerTenantId}:${token.toLowerCase()}`;
    return this.tokenIndex.get(tKey) ?? new Set();
  }

  public getCandidateObjectIdsBySpatialAddress(address369: number, callerTenantId: string): Set<string> {
    const sKey = `${callerTenantId}:${address369}`;
    return this.spatialIndex.get(sKey) ?? new Set();
  }

  public getAllEntries(callerTenantId: string): readonly KnowledgeIndexEntry[] {
    const result: KnowledgeIndexEntry[] = [];
    for (const entry of this.entries.values()) {
      if (entry.tenantId === callerTenantId) {
        result.push(entry);
      }
    }
    return Object.freeze(result);
  }

  public getStats(callerTenantId: string): {
    entryCount: number;
    tokenCount: number;
    spatialBucketCount: number;
  } {
    let entryCount = 0;
    for (const e of this.entries.values()) if (e.tenantId === callerTenantId) entryCount++;

    let tokenCount = 0;
    for (const k of this.tokenIndex.keys()) if (k.startsWith(`${callerTenantId}:`)) tokenCount++;

    let spatialBucketCount = 0;
    for (const k of this.spatialIndex.keys()) if (k.startsWith(`${callerTenantId}:`)) spatialBucketCount++;

    return { entryCount, tokenCount, spatialBucketCount };
  }
}
