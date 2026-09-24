/**
 * CUBiO AI — Task 186: Native Knowledge Normalization & Canonicalization
 * src/cubio/model/native_knowledge_normalization/knowledgeCanonicalizer.ts
 *
 * Content Fingerprinting & Non-Destructive Deduplication:
 * Generates bitwise canonical SHA-256 fingerprints, merges duplicate knowledge
 * records across ingestion streams while preserving and unioning provenance lineage.
 */

import * as crypto from 'crypto';
import {
  NormalizedEntity,
  NormalizedFact,
  CanonicalFingerprint,
} from './types';
import {
  KnowledgeEpistemicStatus,
  EPISTEMIC_WEIGHTS,
} from '../native_knowledge_architecture/types';
import { KnowledgeHasher } from '../native_knowledge_architecture/knowledgeHasher';
import { EntityNormalizer } from './entityNormalizer';
import { PredicateNormalizer } from './predicateNormalizer';

export class KnowledgeCanonicalizer {
  /**
   * Generates a deterministic SHA-256 content fingerprint for any entity or fact.
   */
  public static computeFingerprint(
    targetId: string,
    canonicalRepresentation: string
  ): CanonicalFingerprint {
    const fingerprintHash = crypto
      .createHash('sha256')
      .update(canonicalRepresentation, 'utf8')
      .digest('hex');

    return Object.freeze({
      targetId,
      fingerprintHash,
      canonicalRepresentation,
      timestamp: Date.now(),
    });
  }

  /**
   * Selects the higher epistemic rank between two statuses.
   */
  public static selectHigherEpistemicStatus(
    statusA: KnowledgeEpistemicStatus,
    statusB: KnowledgeEpistemicStatus
  ): KnowledgeEpistemicStatus {
    const weightA = EPISTEMIC_WEIGHTS[statusA] ?? 0;
    const weightB = EPISTEMIC_WEIGHTS[statusB] ?? 0;
    return weightA >= weightB ? statusA : statusB;
  }

  /**
   * Merges an incoming candidate entity into an existing canonical entity non-destructively:
   * - Preserves all aliases without duplicates.
   * - Combines lineageSourceIds into a union set (zero data loss).
   * - Retains higher epistemic status.
   * - Monotonically increments stateVersion.
   */
  public static mergeEntity(
    existing: NormalizedEntity,
    incoming: {
      name: string;
      category?: string;
      address369?: number;
      epistemicStatus?: KnowledgeEpistemicStatus;
      lineageSourceId?: string;
      properties?: Record<string, unknown>;
    }
  ): NormalizedEntity {
    const combinedAliases = Array.from(
      new Set([...existing.aliases, existing.primaryName, incoming.name])
    ).filter((a) => a.trim().length > 0);

    const primaryName = EntityNormalizer.selectPrimaryName(combinedAliases);

    const lineageSet = new Set(existing.lineageSourceIds);
    if (incoming.lineageSourceId) {
      lineageSet.add(incoming.lineageSourceId);
    }

    const nextVersion = existing.stateVersion + 1;
    const epistemicStatus = incoming.epistemicStatus
      ? this.selectHigherEpistemicStatus(existing.epistemicStatus, incoming.epistemicStatus)
      : existing.epistemicStatus;

    const mergedProps = {
      ...(existing.properties ?? {}),
      ...(incoming.properties ?? {}),
    };

    const canonicalChecksum = KnowledgeHasher.sha256(
      KnowledgeHasher.canonicalJsonStringify({
        canonicalId: existing.canonicalId,
        primaryName,
        category: existing.category,
        address369: incoming.address369 ?? existing.address369,
        tenantId: existing.tenantId,
        stateVersion: nextVersion,
        epistemicStatus,
        aliases: [...combinedAliases].sort(),
        lineageSourceIds: Array.from(lineageSet).sort(),
      })
    );

    return Object.freeze({
      canonicalId: existing.canonicalId,
      primaryName,
      normalizedName: existing.normalizedName,
      aliases: Object.freeze(combinedAliases),
      category: existing.category,
      address369: incoming.address369 ?? existing.address369,
      tenantId: existing.tenantId,
      stateVersion: nextVersion,
      canonicalChecksum,
      epistemicStatus,
      lineageSourceIds: Object.freeze(Array.from(lineageSet)),
      properties: Object.freeze(mergedProps),
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    });
  }

  /**
   * Merges an incoming candidate fact into an existing canonical fact non-destructively:
   * - Combines evidenceIds and lineageSourceIds into union sets.
   * - Retains higher epistemic status.
   * - Combines confidence: max(existing, incoming).
   * - Monotonically increments stateVersion.
   */
  public static mergeFact(
    existing: NormalizedFact,
    incoming: {
      confidence?: number;
      epistemicStatus?: KnowledgeEpistemicStatus;
      evidenceIds?: readonly string[];
      lineageSourceId?: string;
      provenanceId?: string;
    }
  ): NormalizedFact {
    const evidenceSet = new Set(existing.evidenceIds);
    if (incoming.evidenceIds) {
      for (const eid of incoming.evidenceIds) evidenceSet.add(eid);
    }

    const lineageSet = new Set(existing.lineageSourceIds);
    if (incoming.lineageSourceId) {
      lineageSet.add(incoming.lineageSourceId);
    }

    const nextVersion = existing.stateVersion + 1;
    const epistemicStatus = incoming.epistemicStatus
      ? this.selectHigherEpistemicStatus(existing.epistemicStatus, incoming.epistemicStatus)
      : existing.epistemicStatus;

    const confidence = incoming.confidence !== undefined
      ? Math.max(existing.confidence, incoming.confidence)
      : existing.confidence;

    const canonicalChecksum = KnowledgeHasher.sha256(
      KnowledgeHasher.canonicalJsonStringify({
        canonicalId: existing.canonicalId,
        subjectCanonicalId: existing.subjectCanonicalId,
        predicate: existing.predicate,
        objectCanonicalId: existing.objectCanonicalId,
        tenantId: existing.tenantId,
        stateVersion: nextVersion,
        epistemicStatus,
        confidence,
        evidenceIds: Array.from(evidenceSet).sort(),
        lineageSourceIds: Array.from(lineageSet).sort(),
      })
    );

    return Object.freeze({
      canonicalId: existing.canonicalId,
      subjectCanonicalId: existing.subjectCanonicalId,
      predicate: existing.predicate,
      objectCanonicalId: existing.objectCanonicalId,
      confidence,
      address369: existing.address369,
      tenantId: existing.tenantId,
      stateVersion: nextVersion,
      canonicalChecksum,
      epistemicStatus,
      evidenceIds: Object.freeze(Array.from(evidenceSet)),
      lineageSourceIds: Object.freeze(Array.from(lineageSet)),
      provenanceId: incoming.provenanceId ?? existing.provenanceId,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    });
  }
}
