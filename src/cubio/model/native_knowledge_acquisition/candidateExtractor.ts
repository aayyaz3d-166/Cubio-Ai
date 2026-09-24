/**
 * CUBiO AI — Task 185: Native Knowledge Acquisition & Ingestion Pipeline
 * src/cubio/model/native_knowledge_acquisition/candidateExtractor.ts
 *
 * Native Deterministic Candidate Extractor:
 * Parses raw text documents into candidate KnowledgeEntity, KnowledgeFact,
 * Concept, and Evidence structures without external AI models or cloud APIs.
 */

import * as crypto from 'crypto';
import {
  RawKnowledgeDocument,
  CandidateEntity,
  CandidateFact,
  CandidateConcept,
  CandidateEvidence,
  ExtractedKnowledgeCandidates,
  ExtractionConfig,
} from './types';
import { KnowledgeSpatialBridge } from '../native_knowledge_architecture/knowledgeSpatialBridge';

export class CandidateExtractor {
  private static readonly PREDICATE_MAP: Readonly<Record<string, string>> = Object.freeze({
    'is a': 'IS_A',
    'is an': 'IS_A',
    'part of': 'PART_OF',
    'contains': 'CONTAINS',
    'causes': 'CAUSES',
    'derives from': 'DERIVES_FROM',
    'derived from': 'DERIVES_FROM',
    'maps to': 'MAPS_TO',
    'constrains': 'CONSTRAINS',
    'located in': 'LOCATED_IN',
    'resonates at': 'RESONATES_AT',
    'oscillates at': 'RESONATES_AT',
    'exhibits': 'HAS_PROPERTY',
    'measures': 'HAS_MEASUREMENT',
  });

  private static readonly PHYSICAL_UNITS_REGEX =
    /\b\d+(?:\.\d+)?\s*(?:nm|um|mm|cm|m|km|hz|khz|mhz|ghz|db|k|v|mv|ma|a|s|ms|ns|%)\b/i;

  /**
   * Main entrypoint: Extracts all structured candidates from a raw document.
   */
  public static extractCandidates(
    doc: RawKnowledgeDocument,
    config?: ExtractionConfig
  ): ExtractedKnowledgeCandidates {
    const maxCandidates = config?.maxCandidates ?? 100;
    const minConfidence = config?.minConfidenceThreshold ?? 0.50;
    const defaultAddr = config?.defaultAddress369 ?? 26; // Default to first spatial cell

    const entities: CandidateEntity[] = [];
    const facts: CandidateFact[] = [];
    const concepts: CandidateConcept[] = [];
    const evidences: CandidateEvidence[] = [];

    const lines = doc.content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      if (entities.length + facts.length + concepts.length >= maxCandidates) break;

      const line = lines[lineIdx];

      // 1. Detect explicit spatial address in line
      const lineAddress = this.extractSpatialAddress(line, defaultAddr);

      // 2. Concept extraction: "Concept: [Label] - [Definition]" or "[Label] is defined as [Definition]"
      const conceptMatch = this.extractConceptFromLine(line, lineAddress, doc.documentId, lineIdx);
      if (conceptMatch && conceptMatch.confidence >= minConfidence) {
        concepts.push(conceptMatch);
        continue; // Line was a formal concept definition
      }

      // 3. Evidence extraction: statements with numerical measurements or empirical keywords
      const evidenceMatch = this.extractEvidenceFromLine(line, doc.documentId, lineIdx);
      if (evidenceMatch && evidenceMatch.confidence >= minConfidence) {
        evidences.push(evidenceMatch);
      }

      // 4. Fact triplet extraction: [Subject] [Predicate] [Object]
      const factMatch = this.extractFactFromLine(line, lineAddress, doc.documentId, lineIdx);
      if (factMatch && factMatch.confidence >= minConfidence) {
        facts.push(factMatch);

        // Auto-extract candidate entities from subject and object
        this.extractEntityFromTerm(factMatch.subject, lineAddress, doc.documentId, line, entities);
        if (factMatch.object.length > 2 && !factMatch.object.includes(' ')) {
          this.extractEntityFromTerm(factMatch.object, lineAddress, doc.documentId, line, entities);
        }
      }
    }

    // Hash the overall extraction result
    const payload = JSON.stringify({
      docId: doc.documentId,
      entitiesCount: entities.length,
      factsCount: facts.length,
      conceptsCount: concepts.length,
      evidencesCount: evidences.length,
    });
    const extractionChecksum = crypto.createHash('sha256').update(payload).digest('hex');

    return {
      documentId: doc.documentId,
      tenantId: doc.tenantId,
      entities: Object.freeze(entities),
      facts: Object.freeze(facts),
      concepts: Object.freeze(concepts),
      evidences: Object.freeze(evidences),
      extractionChecksum,
    };
  }

  private static extractSpatialAddress(line: string, defaultAddr: number): number {
    // Check for "address 36" or "address: 36" or "address #36"
    const addrMatch = line.match(/\baddress(?:\s*:?|\s*#)\s*(\d{1,3})\b/i);
    if (addrMatch) {
      const val = parseInt(addrMatch[1], 10);
      if (val >= 0 && val <= 368) return val;
    }

    // Check for "cell 10" or "cell: 10"
    const cellMatch = line.match(/\bcell(?:\s*:?|\s*#)\s*(\d{1,3})\b/i);
    if (cellMatch) {
      const cellId = parseInt(cellMatch[1], 10);
      if (cellId >= 0 && cellId <= 342) {
        return KnowledgeSpatialBridge.fromCellId(cellId).address369;
      }
    }

    return defaultAddr;
  }

  private static extractConceptFromLine(
    line: string,
    address369: number,
    docId: string,
    lineIdx: number
  ): CandidateConcept | null {
    // Pattern A: "Concept: [Label] - [Definition]"
    const matchA = line.match(/^Concept:\s*([^–\-:]+)[–\-:]\s*(.+)$/i);
    if (matchA) {
      const label = matchA[1].trim();
      const def = matchA[2].trim();
      return {
        candidateId: `cand_con_${docId}_${lineIdx}`,
        label,
        domain: 'general',
        definition: def,
        address369,
        epistemicStatus: 'FACT',
        confidence: 0.90,
        rawExcerpt: line,
      };
    }

    // Pattern B: "[Label] is defined as [Definition]"
    const matchB = line.match(/^([A-Z][A-Za-z0-9\s_-]{2,30})\s+is\s+defined\s+as\s+(.+)$/i);
    if (matchB) {
      return {
        candidateId: `cand_con_${docId}_${lineIdx}`,
        label: matchB[1].trim(),
        domain: 'taxonomy',
        definition: matchB[2].trim(),
        address369,
        epistemicStatus: 'FACT',
        confidence: 0.85,
        rawExcerpt: line,
      };
    }

    return null;
  }

  private static extractEvidenceFromLine(
    line: string,
    docId: string,
    lineIdx: number
  ): CandidateEvidence | null {
    const hasUnit = this.PHYSICAL_UNITS_REGEX.test(line);
    const hasEmpiricalWord = /\b(?:measured|observed|interferometry|spectroscopy|conductance|plateau|snr|experiment|sensor)\b/i.test(line);

    if (hasUnit && hasEmpiricalWord) {
      return {
        candidateId: `cand_evi_${docId}_${lineIdx}`,
        sourceType: 'EMPIRICAL_MEASUREMENT',
        content: line,
        confidence: 0.95,
      };
    } else if (hasEmpiricalWord) {
      return {
        candidateId: `cand_evi_${docId}_${lineIdx}`,
        sourceType: 'DIRECT_OBSERVATION',
        content: line,
        confidence: 0.80,
      };
    }

    return null;
  }

  private static extractFactFromLine(
    line: string,
    address369: number,
    docId: string,
    lineIdx: number
  ): CandidateFact | null {
    const lower = line.toLowerCase();

    for (const [phrase, canonicalPred] of Object.entries(this.PREDICATE_MAP)) {
      const idx = lower.indexOf(` ${phrase} `);
      if (idx > 0) {
        const subject = line.slice(0, idx).trim();
        const object = line.slice(idx + phrase.length + 2).trim();

        if (subject.length >= 2 && object.length >= 2) {
          return {
            candidateId: `cand_fact_${docId}_${lineIdx}`,
            subject,
            predicate: canonicalPred,
            object,
            address369,
            epistemicStatus: 'OBSERVATION', // Raw extracted facts default to OBSERVATION
            confidence: 0.75,
            rawExcerpt: line,
          };
        }
      }
    }

    return null;
  }

  private static extractEntityFromTerm(
    term: string,
    address369: number,
    docId: string,
    line: string,
    list: CandidateEntity[]
  ): void {
    const cleaned = term.replace(/[.,;:]$/, '').trim();
    if (cleaned.length < 3 || cleaned.length > 50) return;
    if (list.some((e) => e.name.toLowerCase() === cleaned.toLowerCase())) return;

    // Must be capitalized or contain underscores/technical tokens
    const isCapitalized = /^[A-Z]/.test(cleaned);
    const hasTechnicalShape = /^[A-Z0-9_-]+$/.test(cleaned) || /\b(?:Resonator|Lattice|Matrix|Cell|Photon|Wave|Node|Oscillator)\b/i.test(cleaned);

    if (isCapitalized || hasTechnicalShape) {
      list.push({
        candidateId: `cand_ent_${docId}_${list.length + 1}`,
        name: cleaned,
        category: 'DOMAIN_ENTITY',
        address369,
        epistemicStatus: 'OBSERVATION',
        confidence: 0.80,
        rawExcerpt: line,
      });
    }
  }
}
