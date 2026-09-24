/**
 * CUBiO AI — Task 194: Native Research and Information Synthesis
 * src/cubio/model/native_research_synthesis/researchSynthesizer.ts
 *
 * Core Research Synthesizer:
 * Synthesizes retrieved facts, relationships, evidence chains, and reasoning into
 * structured conclusions, partitioned into FACT, DERIVED, THEORY, HYPOTHESIS, and UNKNOWN.
 */

import * as crypto from 'crypto';
import {
  ResearchQuery,
  ResearchConclusion,
  ResearchSynthesisDossier,
  ResearchEpistemicState,
  ResearchCitation,
  MAX_SYNTHESIS_CONTEXT_ITEMS,
  ResearchContextOverflowError,
  ResearchTenantViolationError,
} from './types';
import { EpistemicClassifier } from './epistemicClassifier';
import { CitationTracker } from './citationTracker';
import { KnowledgeFact, Relationship } from '../native_knowledge_architecture/types';
import { EvidenceChain } from '../native_evidence_provenance/types';
import { ConflictRecord } from '../native_knowledge_contradiction/types';

export interface ResearchContextInput {
  readonly facts: readonly KnowledgeFact[];
  readonly relationships: readonly Relationship[];
  readonly evidenceChains: readonly EvidenceChain[];
  readonly contradictions?: readonly ConflictRecord[];
  readonly missingEvidenceTopics?: readonly string[];
}

export class ResearchSynthesizer {
  /**
   * Executes deterministic research synthesis over bounded context.
   */
  public static synthesize(
    query: ResearchQuery,
    context: ResearchContextInput,
    timestamp: number = 1000
  ): ResearchSynthesisDossier {
    const totalItems =
      context.facts.length +
      context.relationships.length +
      context.evidenceChains.length +
      (context.contradictions?.length ?? 0);

    if (totalItems > MAX_SYNTHESIS_CONTEXT_ITEMS) {
      throw new ResearchContextOverflowError(totalItems, MAX_SYNTHESIS_CONTEXT_ITEMS);
    }

    // Tenant boundary checks
    for (const f of context.facts) {
      if (f.tenantId !== query.tenantId) {
        throw new ResearchTenantViolationError(`Fact '${f.factId}' tenant does not match query tenant`);
      }
    }
    for (const r of context.relationships) {
      if (r.tenantId !== query.tenantId) {
        throw new ResearchTenantViolationError(`Relationship '${r.relationshipId}' tenant does not match query tenant`);
      }
    }
    for (const ec of context.evidenceChains) {
      if (ec.tenantId !== query.tenantId) {
        throw new ResearchTenantViolationError(`EvidenceChain '${ec.chainId}' tenant does not match query tenant`);
      }
    }

    // Index evidence chains by claimId
    const chainByClaim = new Map<string, EvidenceChain>();
    for (const ec of context.evidenceChains) {
      chainByClaim.set(ec.claimId, ec);
    }

    // Index contradictions by subjectId / factId
    const contradictionReasonsBySubject = new Map<string, string>();
    const surfacedContradictions: string[] = [];
    if (context.contradictions) {
      for (const c of context.contradictions) {
        surfacedContradictions.push(`${c.conflictType}: ${c.reason}`);
        for (const id of c.conflictingRecordIds) {
          contradictionReasonsBySubject.set(id, c.reason);
        }
      }
    }

    const conclusions: ResearchConclusion[] = [];
    const allCitations: ResearchCitation[] = [];
    const evidenceGaps: string[] = [...(context.missingEvidenceTopics ?? [])];

    // 1. Process matching direct facts
    for (const fact of context.facts) {
      // Filter by subject / predicate / topic match if specified
      if (query.targetSubject && fact.subjectId !== query.targetSubject) continue;
      if (query.targetPredicate && fact.predicate !== query.targetPredicate) continue;

      const factCitations: ResearchCitation[] = [];
      const chain = chainByClaim.get(fact.factId);
      const hasContradiction = contradictionReasonsBySubject.has(fact.factId) ||
        contradictionReasonsBySubject.has(fact.subjectId);
      const contradictionReason = contradictionReasonsBySubject.get(fact.factId) ||
        contradictionReasonsBySubject.get(fact.subjectId);

      if (chain) {
        for (const node of chain.nodes) {
          const cite = CitationTracker.buildCitationFromNode(node, fact.provenanceId);
          factCitations.push(cite);
          allCitations.push(cite);
        }
      } else {
        const directCite = CitationTracker.buildCitationFromFact(fact);
        factCitations.push(directCite);
        allCitations.push(directCite);
      }

      const hasEvidence = !!chain || (fact.evidenceIds && fact.evidenceIds.length > 0);
      const classification = EpistemicClassifier.classify({
        epistemicTier: fact.epistemicStatus,
        evidenceChainCount: chain ? chain.nodes.length : (fact.evidenceIds ? fact.evidenceIds.length : 0),
        isEvidenceVerified: hasEvidence,
        hasContradiction,
        contradictionReason,
        isMissingRequiredEvidence: !hasEvidence,
      });

      if (classification.epistemicState === 'UNKNOWN') {
        evidenceGaps.push(`Fact '${fact.factId}' lacked verified evidence chain or contained contradictions`);
      }

      conclusions.push({
        conclusionId: `CONCL-${fact.factId}`,
        statement: `Subject '${fact.subjectId}' has predicate '${fact.predicate}' with value '${fact.objectId}'`,
        subject: fact.subjectId,
        predicate: fact.predicate,
        object: fact.objectId,
        epistemicState: classification.epistemicState,
        confidence: fact.confidence * classification.confidenceMultiplier,
        citations: factCitations,
        reasoningLineage: [`Direct retrieval of canonical fact '${fact.factId}'`],
        evidenceChainIds: chain ? [chain.chainId] : [],
        uncertaintyNotes: classification.uncertaintyNotes,
      });
    }

    // 2. Perform Deductive Derivation (Transitive inference over relationships + facts)
    for (const rel of context.relationships) {
      if (rel.relationType === 'IS_A' || rel.relationType === 'PART_OF') {
        const subjectFacts = context.facts.filter((f) => f.subjectId === rel.targetId);
        for (const sf of subjectFacts) {
          const parentChain = chainByClaim.get(sf.factId);
          const hasEvidence = !!parentChain || (sf.evidenceIds && sf.evidenceIds.length > 0);
          const isParentVerified = hasEvidence;

          const derivedStatement = `Derived: Subject '${rel.sourceId}' inherits '${sf.predicate}: ${sf.objectId}' from '${rel.targetId}' via ${rel.relationType}`;
          const premiseStatements = [
            `Relationship: '${rel.sourceId}' ${rel.relationType} '${rel.targetId}'`,
            `Fact: '${rel.targetId}' ${sf.predicate} '${sf.objectId}'`,
          ];
          const lineage = CitationTracker.formatReasoningTrail(
            premiseStatements,
            'TRANSITIVE_INHERITANCE',
            derivedStatement
          );

          const classification = EpistemicClassifier.classify({
            epistemicTier: 'FACT',
            isDerived: true,
            derivationRule: 'TRANSITIVE_INHERITANCE',
            evidenceChainCount: hasEvidence ? (parentChain ? parentChain.nodes.length : sf.evidenceIds.length) : 0,
            isEvidenceVerified: isParentVerified,
          });

          conclusions.push({
            conclusionId: `CONCL-DERIVED-${rel.sourceId}-${sf.predicate}`,
            statement: derivedStatement,
            subject: rel.sourceId,
            predicate: sf.predicate,
            object: sf.objectId,
            epistemicState: classification.epistemicState,
            confidence: sf.confidence * (rel.weight ?? 0.9) * classification.confidenceMultiplier,
            citations: parentChain
              ? parentChain.nodes.map((n) => CitationTracker.buildCitationFromNode(n))
              : [],
            reasoningLineage: lineage,
            evidenceChainIds: parentChain ? [parentChain.chainId] : [],
            uncertaintyNotes: classification.uncertaintyNotes,
          });
        }
      }
    }

    // 3. Partition by Epistemic State
    const conclusionsByState: Record<ResearchEpistemicState, ResearchConclusion[]> = {
      FACT: [],
      DERIVED: [],
      THEORY: [],
      HYPOTHESIS: [],
      UNKNOWN: [],
    };

    for (const c of conclusions) {
      conclusionsByState[c.epistemicState].push(c);
    }

    // 4. Compute Deterministic Digest
    const sortedConclusions = [...conclusions].sort((a, b) => a.conclusionId.localeCompare(b.conclusionId));
    const digestPayload = `${query.tenantId}:::${query.queryId}:::${sortedConclusions
      .map((c) => `${c.conclusionId}:${c.epistemicState}:${c.confidence.toFixed(3)}`)
      .join('||')}`;

    const synthesisDigest = crypto.createHash('sha256').update(digestPayload).digest('hex');
    const dossierId = `DOSSIER-${synthesisDigest.slice(0, 16)}`;

    return {
      dossierId,
      tenantId: query.tenantId,
      queryTopic: query.topic,
      conclusionsByState,
      allConclusions: conclusions,
      contradictionsSurfaced: [...new Set(surfacedContradictions)],
      evidenceGaps: [...new Set(evidenceGaps)],
      allCitations,
      synthesisDigest,
      generatedAt: timestamp,
    };
  }
}
