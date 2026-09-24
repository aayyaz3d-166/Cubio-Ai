/**
 * CUBiO AI — Task 185: Native Knowledge Acquisition & Ingestion Pipeline
 * src/cubio/model/native_knowledge_acquisition/candidateValidator.ts
 *
 * Multi-Tier Candidate Validator:
 * Validates extracted knowledge candidates prior to persistent VDB registration.
 * Enforces tenant integrity, epistemic safeguards, actuation lockout, and spatial bounds.
 */

import {
  RawKnowledgeDocument,
  CandidateEntity,
  CandidateFact,
  CandidateConcept,
  CandidateEvidence,
  CandidateValidationVerdict,
  IngestionActuationBlockedError,
  IngestionValidationError,
} from './types';
import { KnowledgeGovernor } from '../native_knowledge_architecture/knowledgeGovernor';
import { OutputGuard } from '../../inference/safety/outputGuard';
import { validateAddress } from '../../../core/address369';

export class CandidateValidator {
  /**
   * Validates a CandidateEntity.
   */
  public static validateEntity(
    entity: CandidateEntity,
    doc: RawKnowledgeDocument,
    minConfidence: number = 0.50
  ): CandidateValidationVerdict {
    const violations: string[] = [];

    // 1. Actuation Lockout check
    try {
      KnowledgeGovernor.assertActuationBlocked(entity.name);
      KnowledgeGovernor.assertActuationBlocked(entity.rawExcerpt);
      const outputCheck = OutputGuard.validateOutput(entity.rawExcerpt);
      if (!outputCheck.isSafe) {
        throw new IngestionActuationBlockedError(entity.name);
      }
    } catch (err: any) {
      throw new IngestionActuationBlockedError(entity.name);
    }

    // 2. Spatial address check
    try {
      validateAddress(entity.address369);
    } catch (err: any) {
      violations.push(`Invalid spatial address: ${entity.address369}`);
    }

    // 3. Document grounding check
    if (!doc.content.includes(entity.name)) {
      violations.push(`Entity name "${entity.name}" not found in source document content`);
    }

    // 4. Epistemic assignment safeguard: raw ingested entities cannot claim AXIOM without verified proof
    let assignedStatus = entity.epistemicStatus;
    if (entity.epistemicStatus === 'AXIOM') {
      violations.push('Raw unverified entity cannot claim AXIOM epistemic status');
      assignedStatus = 'OBSERVATION';
    }

    // 5. Confidence check
    if (entity.confidence < minConfidence) {
      violations.push(`Confidence ${entity.confidence} below threshold ${minConfidence}`);
    }

    const isValid = violations.length === 0;
    return {
      isValid,
      candidateId: entity.candidateId,
      violations: Object.freeze(violations),
      assignedEpistemicStatus: assignedStatus,
      adjustedConfidence: isValid ? entity.confidence : Math.max(0.1, entity.confidence - 0.3),
    };
  }

  /**
   * Validates a CandidateFact.
   */
  public static validateFact(
    fact: CandidateFact,
    doc: RawKnowledgeDocument,
    minConfidence: number = 0.50
  ): CandidateValidationVerdict {
    const violations: string[] = [];

    // 1. Actuation Lockout
    try {
      KnowledgeGovernor.assertActuationBlocked(`${fact.subject} ${fact.predicate} ${fact.object}`);
      const outputCheck = OutputGuard.validateOutput(fact.rawExcerpt);
      if (!outputCheck.isSafe) {
        throw new IngestionActuationBlockedError(fact.rawExcerpt);
      }
    } catch {
      throw new IngestionActuationBlockedError(fact.rawExcerpt);
    }

    // 2. Spatial address check
    try {
      validateAddress(fact.address369);
    } catch (err: any) {
      violations.push(`Invalid spatial address: ${fact.address369}`);
    }

    // 3. Grounding check
    if (!doc.content.includes(fact.subject)) {
      violations.push(`Fact subject "${fact.subject}" not grounded in source text`);
    }

    // 4. Epistemic safeguard: raw facts cannot be AXIOM
    let assignedStatus = fact.epistemicStatus;
    if (fact.epistemicStatus === 'AXIOM') {
      violations.push('Raw ingested fact cannot claim AXIOM epistemic status');
      assignedStatus = 'OBSERVATION';
    }

    // 5. Confidence check
    if (fact.confidence < minConfidence) {
      violations.push(`Confidence ${fact.confidence} below threshold ${minConfidence}`);
    }

    const isValid = violations.length === 0;
    return {
      isValid,
      candidateId: fact.candidateId,
      violations: Object.freeze(violations),
      assignedEpistemicStatus: assignedStatus,
      adjustedConfidence: isValid ? fact.confidence : Math.max(0.1, fact.confidence - 0.3),
    };
  }

  /**
   * Validates a CandidateConcept.
   */
  public static validateConcept(
    concept: CandidateConcept,
    doc: RawKnowledgeDocument,
    minConfidence: number = 0.50
  ): CandidateValidationVerdict {
    const violations: string[] = [];

    // 1. Actuation Lockout
    try {
      KnowledgeGovernor.assertActuationBlocked(concept.label);
      KnowledgeGovernor.assertActuationBlocked(concept.definition);
    } catch {
      throw new IngestionActuationBlockedError(concept.label);
    }

    // 2. Spatial address check
    try {
      validateAddress(concept.address369);
    } catch (err: any) {
      violations.push(`Invalid spatial address: ${concept.address369}`);
    }

    // 3. Definition length check
    if (concept.definition.length < 5) {
      violations.push('Concept definition too short (< 5 characters)');
    }

    const isValid = violations.length === 0;
    return {
      isValid,
      candidateId: concept.candidateId,
      violations: Object.freeze(violations),
      assignedEpistemicStatus: concept.epistemicStatus,
      adjustedConfidence: concept.confidence,
    };
  }

  /**
   * Validates CandidateEvidence.
   */
  public static validateEvidence(
    evidence: CandidateEvidence,
    doc: RawKnowledgeDocument
  ): CandidateValidationVerdict {
    const violations: string[] = [];

    // Actuation check
    try {
      KnowledgeGovernor.assertActuationBlocked(evidence.content);
    } catch {
      throw new IngestionActuationBlockedError(evidence.content);
    }

    // Grounding check
    if (!doc.content.includes(evidence.content)) {
      violations.push('Evidence statement is not verbatim in source document');
    }

    const isValid = violations.length === 0;
    return {
      isValid,
      candidateId: evidence.candidateId,
      violations: Object.freeze(violations),
      assignedEpistemicStatus: evidence.sourceType === 'EMPIRICAL_MEASUREMENT' ? 'FACT' : 'OBSERVATION',
      adjustedConfidence: evidence.confidence,
    };
  }
}
