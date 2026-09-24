/**
 * CUBiO AI — Task 194: Native Research and Information Synthesis
 * src/cubio/model/native_research_synthesis/citationTracker.ts
 *
 * Citation and Lineage Tracker:
 * Constructs cryptographic citations and formats deterministic reasoning lineage trails.
 */

import { ResearchCitation } from './types';
import { EvidenceChainNode } from '../native_evidence_provenance/types';
import { KnowledgeFact } from '../native_knowledge_architecture/types';

export class CitationTracker {
  /**
   * Builds a structured citation from an evidence chain node.
   */
  public static buildCitationFromNode(
    node: EvidenceChainNode,
    provenanceId?: string
  ): ResearchCitation {
    const src = node.sourceIdentity;
    const citationId = `CITE-${src.payloadChecksum.slice(0, 16)}`;

    return {
      citationId,
      sourceId: src.sourceId,
      provenanceId,
      locationUri: src.locationUri,
      authorOrInstrument: src.authorOrInstrument,
      payloadChecksum: src.payloadChecksum,
      epistemicTier: node.epistemicTier,
    };
  }

  /**
   * Builds a citation from a canonical fact.
   */
  public static buildCitationFromFact(fact: KnowledgeFact): ResearchCitation {
    const citationId = `CITE-FACT-${fact.checksum.slice(0, 16)}`;
    return {
      citationId,
      sourceId: fact.factId,
      provenanceId: fact.provenanceId,
      locationUri: `vdb://facts/${fact.factId}`,
      authorOrInstrument: 'Canonical-VDB-KnowledgeStore',
      payloadChecksum: fact.checksum,
      epistemicTier: fact.epistemicStatus,
    };
  }

  /**
   * Formats a formal multi-step reasoning lineage trail.
   */
  public static formatReasoningTrail(
    premiseStatements: readonly string[],
    ruleApplied: string,
    conclusionStatement: string
  ): readonly string[] {
    const trail: string[] = [];
    premiseStatements.forEach((p, idx) => {
      trail.push(`[PREMISE ${idx + 1}]: ${p}`);
    });
    trail.push(`[INFERENCE RULE]: ${ruleApplied}`);
    trail.push(`[CONCLUSION]: ${conclusionStatement}`);
    return trail;
  }
}
