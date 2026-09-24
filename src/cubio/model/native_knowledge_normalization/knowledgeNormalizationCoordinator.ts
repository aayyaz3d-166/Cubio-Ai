/**
 * CUBiO AI — Task 186: Native Knowledge Normalization & Canonicalization
 * src/cubio/model/native_knowledge_normalization/knowledgeNormalizationCoordinator.ts
 *
 * Master Coordinator Facade:
 * Coordinates entity and fact normalization, deterministic fingerprinting,
 * non-destructive deduplication with lineage union, and OCC concurrency validation.
 */

import * as crypto from 'crypto';
import {
  TASK_186_ID,
  IS_ACTUATION_BLOCKED,
  NormalizedEntity,
  NormalizedFact,
  DeduplicationSummary,
  NormalizationTenantViolationError,
  NormalizationOCCCollisionError,
} from './types';
import { KnowledgeEpistemicStatus } from '../native_knowledge_architecture/types';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { EntityNormalizer } from './entityNormalizer';
import { PredicateNormalizer } from './predicateNormalizer';
import { KnowledgeCanonicalizer } from './knowledgeCanonicalizer';
import { OutputGuard } from '../../inference/safety/outputGuard';

export interface CanonicalizeEntityInput {
  readonly name: string;
  readonly category?: string;
  readonly address369?: number;
  readonly epistemicStatus?: KnowledgeEpistemicStatus;
  readonly lineageSourceId?: string;
  readonly properties?: Record<string, unknown>;
}

export interface CanonicalizeFactInput {
  readonly subject: string;
  readonly predicate: string;
  readonly object: string;
  readonly address369?: number;
  readonly confidence?: number;
  readonly epistemicStatus?: KnowledgeEpistemicStatus;
  readonly evidenceIds?: readonly string[];
  readonly lineageSourceId?: string;
}

export class KnowledgeNormalizationCoordinator {
  // Canonical registry: key = `${tenantId}:${canonicalId}`
  private readonly canonicalEntities: Map<string, NormalizedEntity> = new Map();
  private readonly canonicalFacts: Map<string, NormalizedFact> = new Map();

  constructor() {
    KnowledgeGovernor.assertActuationBlocked();
  }

  private makeKey(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  /**
   * Normalizes and registers/merges an entity into the canonical store.
   */
  public canonicalizeEntity(
    tenantId: string,
    input: CanonicalizeEntityInput,
    expectedVersion?: number
  ): { entity: NormalizedEntity; isNew: boolean } {
    KnowledgeGovernor.assertActuationBlocked(input.name);

    const category = input.category ?? 'DOMAIN_ENTITY';
    const canonicalId = EntityNormalizer.deriveCanonicalEntityId(tenantId, category, input.name);
    const storeKey = this.makeKey(tenantId, canonicalId);

    const existing = this.canonicalEntities.get(storeKey);

    if (existing) {
      if (existing.tenantId !== tenantId) {
        throw new NormalizationTenantViolationError(tenantId, existing.tenantId);
      }

      if (expectedVersion !== undefined && expectedVersion !== existing.stateVersion) {
        throw new NormalizationOCCCollisionError(canonicalId, expectedVersion, existing.stateVersion);
      }

      const merged = KnowledgeCanonicalizer.mergeEntity(existing, input);
      this.canonicalEntities.set(storeKey, merged);
      return { entity: merged, isNew: false };
    }

    // New Canonical Entity (V=1)
    if (expectedVersion !== undefined && expectedVersion !== 0) {
      throw new NormalizationOCCCollisionError(canonicalId, expectedVersion, 0);
    }

    const normalizedName = EntityNormalizer.normalizeName(input.name);
    const primaryName = input.name.trim();
    const address369 = input.address369 ?? 26;
    const epistemicStatus = input.epistemicStatus ?? 'FACT';
    const lineageSourceIds = input.lineageSourceId ? [input.lineageSourceId] : [];

    const canonicalChecksum = crypto
      .createHash('sha256')
      .update(`CANON_ENT_NEW:${tenantId}:${canonicalId}:${normalizedName}:1:${epistemicStatus}`)
      .digest('hex');

    const newEntity: NormalizedEntity = {
      canonicalId,
      primaryName,
      normalizedName,
      aliases: Object.freeze([primaryName]),
      category,
      address369,
      tenantId,
      stateVersion: 1,
      canonicalChecksum,
      epistemicStatus,
      lineageSourceIds: Object.freeze(lineageSourceIds),
      properties: input.properties ? Object.freeze({ ...input.properties }) : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.canonicalEntities.set(storeKey, Object.freeze(newEntity));
    return { entity: newEntity, isNew: true };
  }

  /**
   * Normalizes and registers/merges a fact into the canonical store.
   */
  public canonicalizeFact(
    tenantId: string,
    input: CanonicalizeFactInput,
    expectedVersion?: number
  ): { fact: NormalizedFact; isNew: boolean } {
    KnowledgeGovernor.assertActuationBlocked(`${input.subject} ${input.predicate} ${input.object}`);

    // Resolve subject and object to canonical entity IDs
    const subjectCanonicalId = EntityNormalizer.deriveCanonicalEntityId(tenantId, 'DOMAIN_ENTITY', input.subject);
    const objectCanonicalId = EntityNormalizer.deriveCanonicalEntityId(tenantId, 'DOMAIN_ENTITY', input.object);
    const canonicalPred = PredicateNormalizer.normalizePredicate(input.predicate);

    const canonicalId = PredicateNormalizer.deriveCanonicalFactId(
      tenantId,
      subjectCanonicalId,
      canonicalPred,
      objectCanonicalId
    );

    const storeKey = this.makeKey(tenantId, canonicalId);
    const existing = this.canonicalFacts.get(storeKey);

    if (existing) {
      if (existing.tenantId !== tenantId) {
        throw new NormalizationTenantViolationError(tenantId, existing.tenantId);
      }

      if (expectedVersion !== undefined && expectedVersion !== existing.stateVersion) {
        throw new NormalizationOCCCollisionError(canonicalId, expectedVersion, existing.stateVersion);
      }

      const merged = KnowledgeCanonicalizer.mergeFact(existing, {
        confidence: input.confidence,
        epistemicStatus: input.epistemicStatus,
        evidenceIds: input.evidenceIds,
        lineageSourceId: input.lineageSourceId,
      });
      this.canonicalFacts.set(storeKey, merged);
      return { fact: merged, isNew: false };
    }

    // New Canonical Fact (V=1)
    if (expectedVersion !== undefined && expectedVersion !== 0) {
      throw new NormalizationOCCCollisionError(canonicalId, expectedVersion, 0);
    }

    const address369 = input.address369 ?? 26;
    const confidence = input.confidence ?? 0.85;
    const epistemicStatus = input.epistemicStatus ?? 'FACT';
    const evidenceIds = input.evidenceIds ? [...input.evidenceIds] : [];
    const lineageSourceIds = input.lineageSourceId ? [input.lineageSourceId] : [];

    const canonicalChecksum = crypto
      .createHash('sha256')
      .update(`CANON_FACT_NEW:${tenantId}:${canonicalId}:${canonicalPred}:1:${confidence}`)
      .digest('hex');

    const newFact: NormalizedFact = {
      canonicalId,
      subjectCanonicalId,
      predicate: canonicalPred,
      objectCanonicalId,
      confidence,
      address369,
      tenantId,
      stateVersion: 1,
      canonicalChecksum,
      epistemicStatus,
      evidenceIds: Object.freeze(evidenceIds),
      lineageSourceIds: Object.freeze(lineageSourceIds),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.canonicalFacts.set(storeKey, Object.freeze(newFact));
    return { fact: newFact, isNew: true };
  }

  /**
   * Batch deduplication across collections of raw candidate inputs.
   */
  public deduplicateBatch(
    tenantId: string,
    entities: readonly CanonicalizeEntityInput[],
    facts: readonly CanonicalizeFactInput[]
  ): DeduplicationSummary {
    const startTime = Date.now();
    let duplicatesMergedCount = 0;
    let lineagePreservedCount = 0;

    for (const entInput of entities) {
      const res = this.canonicalizeEntity(tenantId, entInput);
      if (!res.isNew) {
        duplicatesMergedCount++;
      }
      lineagePreservedCount += res.entity.lineageSourceIds.length;
    }

    for (const factInput of facts) {
      const res = this.canonicalizeFact(tenantId, factInput);
      if (!res.isNew) {
        duplicatesMergedCount++;
      }
      lineagePreservedCount += res.fact.lineageSourceIds.length;
    }

    let canonicalEntitiesCount = 0;
    let canonicalFactsCount = 0;

    for (const e of this.canonicalEntities.values()) {
      if (e.tenantId === tenantId) canonicalEntitiesCount++;
    }
    for (const f of this.canonicalFacts.values()) {
      if (f.tenantId === tenantId) canonicalFactsCount++;
    }

    return Object.freeze({
      tenantId,
      inputEntitiesCount: entities.length,
      canonicalEntitiesCount,
      inputFactsCount: facts.length,
      canonicalFactsCount,
      duplicatesMergedCount,
      lineagePreservedCount,
      executionTimeMs: Math.max(1, Date.now() - startTime),
    });
  }

  public getEntity(canonicalId: string, callerTenantId: string): NormalizedEntity | null {
    const key = this.makeKey(callerTenantId, canonicalId);
    return this.canonicalEntities.get(key) ?? null;
  }

  public getFact(canonicalId: string, callerTenantId: string): NormalizedFact | null {
    const key = this.makeKey(callerTenantId, canonicalId);
    return this.canonicalFacts.get(key) ?? null;
  }

  public emitAdvisory(text: string): { isSafe: boolean; advisory: string } {
    const verdict = OutputGuard.validateOutput(text);
    if (!verdict.isSafe) {
      return {
        isSafe: false,
        advisory: verdict.sanitizedText,
      };
    }
    return {
      isSafe: true,
      advisory: `ADVISORY: ${verdict.sanitizedText}`,
    };
  }
}
