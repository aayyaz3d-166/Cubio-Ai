/**
 * CUBiO AI — Task 184: Native Knowledge Architecture
 * src/cubio/model/native_knowledge_architecture/knowledgeHasher.ts
 *
 * Cryptographic SHA-256 Checksum Derivation & Bitwise Canonical Normalization.
 * Produces deterministic, tamper-evident checksums without key-order variance.
 */

import * as crypto from 'crypto';
import {
  KnowledgeEntity,
  Concept,
  Relationship,
  Evidence,
  Provenance,
  KnowledgeFact,
  DerivationStep,
} from './types';

export class KnowledgeHasher {
  /**
   * Sorts object keys recursively to produce bitwise stable JSON strings.
   */
  public static canonicalJsonStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return '[' + value.map((item) => this.canonicalJsonStringify(item)).join(',') + ']';
    }

    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const keyVals = sortedKeys.map(
      (k) => `${JSON.stringify(k)}:${this.canonicalJsonStringify(obj[k])}`
    );
    return '{' + keyVals.join(',') + '}';
  }

  /**
   * Computes SHA-256 hash of any canonical string payload.
   */
  public static sha256(payload: string): string {
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Derives canonical checksum for KnowledgeEntity.
   */
  public static computeEntityChecksum(entity: Omit<KnowledgeEntity, 'checksum'>): string {
    const payload = this.canonicalJsonStringify({
      entityId: entity.entityId,
      name: entity.name,
      category: entity.category,
      address369: entity.address369,
      tenantId: entity.tenantId,
      stateVersion: entity.stateVersion,
      epistemicStatus: entity.epistemicStatus,
      properties: entity.properties ?? {},
    });
    return this.sha256(`KNOWLEDGE_ENTITY:${payload}`);
  }

  /**
   * Derives canonical checksum for Concept.
   */
  public static computeConceptChecksum(concept: Omit<Concept, 'checksum'>): string {
    const payload = this.canonicalJsonStringify({
      conceptId: concept.conceptId,
      label: concept.label,
      domain: concept.domain,
      definition: concept.definition,
      address369: concept.address369,
      tenantId: concept.tenantId,
      stateVersion: concept.stateVersion,
      epistemicStatus: concept.epistemicStatus,
      attributes: concept.attributes ?? {},
    });
    return this.sha256(`KNOWLEDGE_CONCEPT:${payload}`);
  }

  /**
   * Derives canonical checksum for Relationship.
   */
  public static computeRelationshipChecksum(rel: Omit<Relationship, 'checksum'>): string {
    const payload = this.canonicalJsonStringify({
      relationshipId: rel.relationshipId,
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      relationType: rel.relationType,
      weight: rel.weight,
      bidirectional: rel.bidirectional,
      tenantId: rel.tenantId,
      stateVersion: rel.stateVersion,
      epistemicStatus: rel.epistemicStatus,
      evidenceIds: [...rel.evidenceIds].sort(),
    });
    return this.sha256(`KNOWLEDGE_RELATIONSHIP:${payload}`);
  }

  /**
   * Derives canonical checksum for Evidence.
   */
  public static computeEvidenceChecksum(evidence: Omit<Evidence, 'sourceChecksum'>): string {
    const payload = this.canonicalJsonStringify({
      evidenceId: evidence.evidenceId,
      sourceType: evidence.sourceType,
      content: evidence.content,
      confidence: evidence.confidence,
      epistemicStatus: evidence.epistemicStatus,
      tenantId: evidence.tenantId,
      spatialCellId: evidence.spatialCellId ?? null,
      lineage: [...evidence.lineage].sort(),
    });
    return this.sha256(`KNOWLEDGE_EVIDENCE:${payload}`);
  }

  /**
   * Derives composite SHA-256 hash for Provenance records.
   */
  public static computeProvenanceCompositeHash(
    targetId: string,
    rootSourceIds: readonly string[],
    derivationSteps: readonly DerivationStep[],
    tenantId: string
  ): string {
    const sortedSources = [...rootSourceIds].sort();
    const sortedSteps = derivationSteps.map((s) => ({
      stepIndex: s.stepIndex,
      rule: s.rule,
      inputIds: [...s.inputIds].sort(),
      outputChecksum: s.outputChecksum,
    }));

    const payload = this.canonicalJsonStringify({
      targetId,
      rootSourceIds: sortedSources,
      derivationSteps: sortedSteps,
      tenantId,
    });
    return this.sha256(`KNOWLEDGE_PROVENANCE:${payload}`);
  }

  /**
   * Derives canonical checksum for KnowledgeFact.
   */
  public static computeFactChecksum(fact: Omit<KnowledgeFact, 'checksum'>): string {
    const payload = this.canonicalJsonStringify({
      factId: fact.factId,
      subjectId: fact.subjectId,
      predicate: fact.predicate,
      objectId: fact.objectId,
      epistemicStatus: fact.epistemicStatus,
      confidence: fact.confidence,
      address369: fact.address369,
      tenantId: fact.tenantId,
      stateVersion: fact.stateVersion,
      evidenceIds: [...fact.evidenceIds].sort(),
      provenanceId: fact.provenanceId ?? '',
    });
    return this.sha256(`KNOWLEDGE_FACT:${payload}`);
  }
}
